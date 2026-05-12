import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import storeAuth from "../context/storeAuth";

const FEEDBACK_ROUTE = "/dashboard/quejas-sugerencias";

const toText = (value, fallback = "-") => {
    if (value === null || value === undefined) return fallback;
    if (["string", "number", "boolean"].includes(typeof value)) return String(value);

    if (typeof value === "object") {
        const fullName = `${value?.nombre || ""} ${value?.apellido || ""}`.trim();
        if (fullName) return fullName;
        if (value?.titulo) return String(value.titulo);
        if (value?.name) return String(value.name);
        if (value?.email) return String(value.email);
        if (value?.descripcion) return String(value.descripcion);
        if (value?.mensaje) return String(value.mensaje);
        return fallback;
    }

    return fallback;
};

const findFirstArrayInObject = (value, depth = 0) => {
    if (depth > 5 || value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== "object") return [];

    const nestedValues = Object.values(value);
    for (const nested of nestedValues) {
        const found = findFirstArrayInObject(nested, depth + 1);
        if (found.length) return found;
    }

    return [];
};

const attachParentContextToItems = (items, parentData = {}) => {
    if (!Array.isArray(items)) return [];

    return items.map((item) => ({
        ...parentData,
        ...item,
        departamento: item?.departamento ?? parentData?.departamento,
        arrendatarioId: item?.arrendatarioId ?? parentData?.arrendatarioId,
    }));
};

const getListFromResponse = (responseData) => {
    console.log("[getListFromResponse] Entrando con:", responseData);
    
    if (Array.isArray(responseData)) {
        console.log("[getListFromResponse] Es un array, longitud:", responseData.length);
        // Si es un array, podría ser de comentarios directos o de objetos departamento-comentarios
        if (responseData.length > 0) {
            const first = responseData[0];
            console.log("[getListFromResponse] Primer elemento:", first);
            // Si cada elemento tiene un array de comentarios anidado, aplanarlos
            if (first?.comentarios && Array.isArray(first.comentarios)) {
                console.log("[getListFromResponse] Detectado estructura anidada (departamento-comentarios)");
                const result = responseData.flatMap((item) =>
                    attachParentContextToItems(item.comentarios, { departamento: item.departamento })
                );
                console.log("[getListFromResponse] Resultado flatMap:", result);
                return result;
            }
        }
        console.log("[getListFromResponse] Retornando array directo");
        return responseData;
    }
    
    if (Array.isArray(responseData?.data)) {
        console.log("[getListFromResponse] Encontrado responseData.data");
        return responseData.data;
    }
    if (Array.isArray(responseData?.quejas)) {
        console.log("[getListFromResponse] Encontrado responseData.quejas");
        return responseData.quejas;
    }
    if (Array.isArray(responseData?.comentarios)) {
        console.log("[getListFromResponse] Encontrado responseData.comentarios");
        return attachParentContextToItems(responseData.comentarios, responseData);
    }
    if (Array.isArray(responseData?.results)) {
        console.log("[getListFromResponse] Encontrado responseData.results");
        return responseData.results;
    }
    if (Array.isArray(responseData?.data?.comentarios)) {
        console.log("[getListFromResponse] Encontrado responseData.data.comentarios");
        return attachParentContextToItems(responseData.data.comentarios, responseData.data);
    }
    if (Array.isArray(responseData?.data?.quejas)) {
        console.log("[getListFromResponse] Encontrado responseData.data.quejas");
        return attachParentContextToItems(responseData.data.quejas, responseData.data);
    }

    // Fallback genérico para estructuras anidadas: data.items, data.comentarios, etc.
    console.log("[getListFromResponse] Buscando array anidado genérico");
    const nestedArray = findFirstArrayInObject(responseData);
    if (nestedArray.length) {
        console.log("[getListFromResponse] Encontrado array anidado:", nestedArray);
        return nestedArray;
    }

    // Algunos backends devuelven un solo objeto en lugar de lista.
    if (
        responseData &&
        typeof responseData === "object" &&
        (responseData?.descripcion || responseData?.mensaje || responseData?.comentario || responseData?._id || responseData?.id)
    ) {
        console.log("[getListFromResponse] Retornando como array de un solo objeto");
        return [responseData];
    }

    console.log("[getListFromResponse] Retornando array vacío");
    return [];
};

const normalizeFeedbackItem = (item, index) => {
    console.log(`[normalizeFeedbackItem] Item ${index}:`, item);
    // El campo `estudiante` puede venir como: string(id|nombre), objeto, o array. Normalizamos a texto legible.
    let estudianteRaw = item?.estudiante ?? item?.usuario ?? item?.userName ?? item?.autor ?? item?.creadoPor;
    let estudianteNormalizado = "No disponible";

    if (Array.isArray(estudianteRaw)) {
        // Si viene un arreglo, preferimos el primer elemento con datos significativos
        const first = estudianteRaw.find((el) => el && (el.nombre || el.apellido || el.email || typeof el === "string")) || estudianteRaw[0];
        estudianteNormalizado = toText(first, "No disponible");
    } else {
        estudianteNormalizado = toText(estudianteRaw, "No disponible");
    }

    const tipoRaw = String(item?.tipo || item?.categoria || item?.category || item?.clase || "").trim().toLowerCase();
    const tipoNormalizado = ["queja", "sugerencia", "comentario"].includes(tipoRaw)
        ? tipoRaw
        : "sin-tipo";
    const manejaEstado = tipoNormalizado !== "comentario";

    // Capturar comentarios de respuesta (pueden venir como array o como un único objeto)
    let comentariosRespuesta = [];
    if (Array.isArray(item?.comentarios)) {
        comentariosRespuesta = item.comentarios;
    } else if (item?.comentario && typeof item.comentario === "object") {
        comentariosRespuesta = [item.comentario];
    }

    const normalizado = {
        id: item?._id || item?.id || `${index}-${item?.createdAt || item?.fecha || Date.now()}`,
        _id: item?._id,
        tipo: tipoNormalizado,
        manejaEstado,
        mensaje: toText(item?.mensaje || item?.descripcion || item?.comentario, "Sin descripción"),
        estudiante: estudianteNormalizado,
        departamento: toText(
            item?.departamento?.titulo ||
            item?.departamento?.nombre ||
            item?.departamento?.descripcion ||
            item?.departamento ||
            item?.inmueble ||
            item?.residencia,
            "No disponible"
        ),
        departamentoId:
            item?.departamento?._id ||
            item?.departamento?.id ||
            item?.inmueble?._id ||
            item?.inmueble?.id ||
            item?.residencia?._id ||
            item?.residencia?.id ||
            null,
        fecha: item?.createdAt || item?.fecha || item?.updatedAt || null,
        estado: manejaEstado ? (item?.estado !== undefined ? item.estado : false) : null,
        comentariosRespuesta: comentariosRespuesta,
        tieneRespuesta: comentariosRespuesta.length > 0,
    };
    
    console.log(`[normalizeFeedbackItem] Item ${index} normalizado:`, normalizado);
    return normalizado;
};

const formatDate = (value) => {
    if (!value) return "No disponible";
    try {
        return new Date(value).toLocaleString("es-EC");
    } catch {
        return String(value);
    }
};

const Feedback = () => {
    const { rol, token } = storeAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState("pendientes"); // "pendientes", "revisados"
    const [filtroTipo, setFiltroTipo] = useState("todos"); // Placeholder UI, aun sin filtro real
    const [modalAbierto, setModalAbierto] = useState(false);
    const [quejaSeleccionada, setQuejaSeleccionada] = useState(null);
    const [comentarioAdmin, setComentarioAdmin] = useState("");
    const [enviandoComentario, setEnviandoComentario] = useState(false);

    const roleNormalized = String(rol || "").toLowerCase();
    const isAdmin = roleNormalized === "administrador";
    const isArrendatario = roleNormalized === "arrendatario";
    const isEstudiante = roleNormalized === "estudiante";
    const canViewFeedback = isAdmin || isArrendatario || isEstudiante;

    console.log("[Feedback] Rol:", rol, "| Rol normalizado:", roleNormalized);
    console.log("[Feedback] isAdmin:", isAdmin, "| isArrendatario:", isArrendatario, "| isEstudiante:", isEstudiante);
    console.log("[Feedback] canViewFeedback:", canViewFeedback);

    const endpoint = useMemo(() => {
        if (isAdmin) return "/administrador/quejas";
        if (isArrendatario) return "/arrendatario/comentarios";
        if (isEstudiante) return "/estudiante/listarcomentarios";
        return null;
    }, [isAdmin, isArrendatario, isEstudiante]);

    useEffect(() => {
        const fetchFeedback = async () => {
            if (!canViewFeedback || !endpoint) {
                console.log("[Feedback] No se puede ver feedback o no hay endpoint", {
                    canViewFeedback,
                    endpoint,
                });
                return;
            }

            console.log("[Feedback] Iniciando fetch desde endpoint:", endpoint);
            setLoading(true);
            try {
                const url = `${import.meta.env.VITE_BACKEND_URL}${endpoint}`;
                console.log("[Feedback] URL completa:", url);
                const response = await axios.get(url, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log("[Feedback] Respuesta del servidor:", response?.data);
                const rawList = getListFromResponse(response?.data);
                console.log("[Feedback] rawList después de getListFromResponse:", rawList);
                const normalizedList = rawList.map((item, index) =>
                    normalizeFeedbackItem(item, index)
                );
                console.log("[Feedback] normalizedList después de normalizeFeedbackItem:", normalizedList);
                setItems(normalizedList);
            } catch (error) {
                console.error("[Feedback] Error al cargar:", error);
                const errorMessage =
                    error?.response?.data?.msg ||
                    error?.response?.data?.message ||
                    "No se pudieron cargar las quejas/sugerencias";
                toast.error(errorMessage);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, [canViewFeedback, endpoint, token]);

    const abrirModalComentario = (queja) => {
        if (!queja?.manejaEstado || queja?.tieneRespuesta) return;
        setQuejaSeleccionada(queja);
        setComentarioAdmin("");
        setModalAbierto(true);
    };

    const cerrarModalComentario = () => {
        setModalAbierto(false);
        setQuejaSeleccionada(null);
        setComentarioAdmin("");
    };

    const enviarComentarioRespuesta = async () => {
        if (!quejaSeleccionada || !comentarioAdmin.trim()) {
            toast.error("Por favor, escribe un comentario.");
            return;
        }

        const quejaId = quejaSeleccionada?.id || quejaSeleccionada?._id;
        if (!quejaId) {
            toast.error("Error: No se pudo identificar la queja.");
            return;
        }

        setEnviandoComentario(true);
        try {
            // 1. Enviar comentario
            const urlComentario = `${import.meta.env.VITE_BACKEND_URL}/queja-sugerencia/comentario`;
            const payloadComentario = {
                id: quejaId,
                comentarioUsuario: comentarioAdmin,
            };

            console.log("[enviarComentario] Enviando comentario al endpoint:", urlComentario);
            console.log("[enviarComentario] Payload:", payloadComentario);

            const responseComentario = await axios.put(urlComentario, payloadComentario, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (responseComentario?.status >= 200 && responseComentario?.status < 300) {
                // 2. Cambiar estado a revisado (disponible: true)
                const urlEstado = `${import.meta.env.VITE_BACKEND_URL}/admin/quejaSugerencia/estado/${quejaId}`;
                const payloadEstado = {
                    disponible: true,
                };

                console.log("[enviarComentario] Cambiando estado al endpoint:", urlEstado);
                console.log("[enviarComentario] Payload estado:", payloadEstado);

                const responseEstado = await axios.put(urlEstado, payloadEstado, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (responseEstado?.status >= 200 && responseEstado?.status < 300) {
                    // Actualizar el item con la nueva respuesta
                    const nuevoComentario = {
                        texto: comentarioAdmin,
                        autor: "Administrador",
                        fecha: new Date().toISOString(),
                    };

                    setItems((prev) =>
                        prev.map((item) =>
                            item.id === quejaSeleccionada.id
                                ? {
                                      ...item,
                                      estado: true, // Automáticamente revisado
                                      comentariosRespuesta: [...(item.comentariosRespuesta || []), nuevoComentario],
                                      tieneRespuesta: true,
                                  }
                                : item
                        )
                    );

                    toast.success("Comentario guardado. Queja marcada como revisada.");
                    cerrarModalComentario();
                } else {
                    toast.error("El servidor no confirmó el cambio de estado.");
                }
            } else {
                toast.error("El servidor no confirmó el envío del comentario.");
            }
        } catch (error) {
            console.error("[enviarComentario] Error:", error);
            const errorMessage =
                error?.response?.data?.msg || error?.response?.data?.message || "Error al enviar comentario";
            toast.error(errorMessage);
        } finally {
            setEnviandoComentario(false);
        }
    };

    // Filtrar items basándose en el estado (el filtro por tipo es solo visual por ahora)
    const itemsFiltrados = useMemo(() => {
        const itemsConEstado = items.filter((item) => item.manejaEstado);
        if (filtro === "pendientes") return itemsConEstado.filter((item) => !item.estado);
        if (filtro === "revisados") return itemsConEstado.filter((item) => item.estado);
        return itemsConEstado.filter((item) => !item.estado);
    }, [items, filtro]);

    const conteoPendientes = useMemo(
        () => items.filter((item) => item.manejaEstado && !item.estado).length,
        [items]
    );

    const conteoRevisados = useMemo(
        () => items.filter((item) => item.manejaEstado && item.estado).length,
        [items]
    );

    if (!canViewFeedback) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
                <h1 className="font-black text-3xl text-gray-700">Quejas y sugerencias</h1>
                <p className="mt-4 text-gray-600">Este módulo te permite gestionar quejas y sugerencias de los usuarios</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="font-black text-4xl text-gray-500">Quejas y sugerencias</h1>
            <hr className="my-4 border-t-2 border-gray-300" />
            <p className="mb-6">Este módulo te permite gestionar quejas y sugerencias</p>

            <section className="bg-white border border-gray-200 rounded-xl shadow p-5">
                <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isAdmin ? "Todas las quejas y sugerencias" : isArrendatario ? "Quejas y sugerencias de mis departamentos" : "Mis quejas y sugerencias"}
                    </h2>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFiltro("pendientes")}
                                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                                    filtro === "pendientes"
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                Pendientes ({conteoPendientes})
                            </button>
                            <button
                                onClick={() => setFiltro("revisados")}
                                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                                    filtro === "revisados"
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                Revisados ({conteoRevisados})
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="filtroTipo" className="text-sm font-medium text-gray-700">
                                Tipo:
                            </label>
                            <select
                                id="filtroTipo"
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="todos">Todos los tipos</option>
                                <option value="queja">Queja</option>
                                <option value="sugerencia">Sugerencia</option>
                                <option value="comentario">Comentario</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p className="text-gray-500">Cargando registros...</p>
                ) : !itemsFiltrados.length ? (
                    <p className="text-gray-500">No existen registros para mostrar.</p>
                ) : (
                    <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                        {itemsFiltrados.map((item) => (
                            <article key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{item.mensaje}</p>
                                    </div>

                                    <div className="ml-3 flex-shrink-0 flex flex-col items-end gap-2">
                                        {item.manejaEstado && (
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    item.estado
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}
                                            >
                                                {item.estado ? "Revisado" : "Pendiente"}
                                            </span>
                                        )}
                                        {isAdmin && item.manejaEstado && !item.tieneRespuesta && (
                                            <button
                                                onClick={() => abrirModalComentario(item)}
                                                className="px-2 py-1 rounded text-xs font-semibold transition-colors bg-green-500 text-white hover:bg-green-600"
                                            >
                                                Responder
                                            </button>
                                        )}
                                        {item.tieneRespuesta && (
                                            <span className="text-xs text-green-600 font-semibold">
                                                ✓ Respondido
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-2">
                                    {isAdmin && (
                                        <>
                                            Estudiante: {item.estudiante} • {" "}
                                        </>
                                    )}
                                    Departamento: {" "}
                                    {item.departamentoId ? (
                                        <Link
                                            to={`/dashboard/visualizar/${item.departamentoId}`}
                                            state={{ from: FEEDBACK_ROUTE }}
                                            className="text-blue-600 hover:text-blue-700 underline"
                                        >
                                            {item.departamento}
                                        </Link>
                                    ) : (
                                        item.departamento
                                    )}
                                    {" "}• Fecha: {formatDate(item.fecha)}
                                </p>

                                {item.comentariosRespuesta && item.comentariosRespuesta.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                                        <p className="text-xs font-semibold text-gray-700">Respuestas:</p>
                                        {item.comentariosRespuesta.map((comentario, idx) => (
                                            <div key={idx} className="bg-white rounded p-2 ml-2 border-l-2 border-green-500">
                                                <p className="text-xs text-gray-800">{comentario?.texto || comentario?.descripcion || comentario?.comentario || "Sin contenido"}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {comentario?.autor || "Admin"} • {formatDate(comentario?.fecha || comentario?.createdAt)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal de comentario */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Responder a {quejaSeleccionada?.tipo === "queja" ? "Queja" : "Sugerencia"}
                        </h3>

                        <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-300 max-h-[150px] overflow-y-auto">
                            <p className="text-sm text-gray-700 font-semibold mb-2">Mensaje original:</p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quejaSeleccionada?.mensaje}</p>
                        </div>

                        <label htmlFor="comentario" className="block text-sm font-semibold text-gray-700 mb-2">
                            Tu respuesta:
                        </label>
                        <textarea
                            id="comentario"
                            value={comentarioAdmin}
                            onChange={(e) => setComentarioAdmin(e.target.value)}
                            placeholder="Escribe tu comentario de respuesta..."
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows="4"
                        />

                        <div className="flex gap-3 mt-6 justify-end">
                            <button
                                onClick={cerrarModalComentario}
                                disabled={enviandoComentario}
                                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-300 hover:bg-gray-400 font-semibold transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={enviarComentarioRespuesta}
                                disabled={enviandoComentario || !comentarioAdmin.trim()}
                                className="px-4 py-2 rounded-lg text-white bg-green-500 hover:bg-green-600 font-semibold transition-colors disabled:opacity-50"
                            >
                                {enviandoComentario ? "Enviando..." : "Enviar respuesta"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feedback;