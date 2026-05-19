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

    const contexto = {
        departamento:
            parentData?.departamento?.titulo ||
            parentData?.departamento?.nombre ||
            parentData?.departamento ||
            parentData?.inmueble ||
            parentData?.residencia ||
            null,
        departamentoId:
            parentData?.departamento?._id ||
            parentData?.departamento?.id ||
            parentData?.inmueble?._id ||
            parentData?.inmueble?.id ||
            parentData?.residencia?._id ||
            parentData?.residencia?.id ||
            parentData?.departamentoId ||
            null,
        arrendatarioId: parentData?.arrendatarioId ?? null,
    };

    return items.map((item) => ({
        ...item,
        departamento: item?.departamento ?? contexto.departamento,
        departamentoId:
            item?.departamento?._id ?? item?.departamento?.id ?? contexto.departamentoId,
        arrendatarioId: item?.arrendatarioId ?? contexto.arrendatarioId,
    }));
};

const normalizeResponseComment = (comment, fallbackAutor = "Administrador") => {
    if (comment === null || comment === undefined) return null;

    if (typeof comment === "string" || typeof comment === "number" || typeof comment === "boolean") {
        const texto = String(comment).trim();
        return texto
            ? {
                  texto,
                  autor: fallbackAutor,
              }
            : null;
    }

    if (typeof comment === "object") {
        const texto = toText(
            comment?.texto ||
                comment?.comentarioUsuario ||
                comment?.comentarioAdmin ||
                comment?.comentario ||
                comment?.descripcion ||
                comment?.mensaje,
            ""
        );

        return texto
            ? {
                  texto,
                  autor: toText(comment?.autor || comment?.usuario || comment?.user || fallbackAutor, fallbackAutor),
              }
            : null;
    }

    return null;
};

const extractRespuestaComentarios = (item) => {
    const seen = new Set();
    const respuestas = [];

    const originalText = String(
        toText(item?.mensaje ?? item?.descripcion ?? item?.comentario, "")
    ).trim();

    const pushIfUnique = (raw) => {
        const normalized = normalizeResponseComment(raw);
        if (!normalized || !normalized.texto) return;
        const texto = String(normalized.texto).trim();
        const autor = String(normalized.autor || "Administrador").trim();
        if (!texto) return;
        if (originalText && texto === originalText) return;
        const key = `${texto}|${autor}`;
        if (seen.has(key)) return;
        seen.add(key);
        respuestas.push({ texto, autor, fecha: normalized.fecha || null });
    };

    if (Array.isArray(item?.comentarios)) {
        item.comentarios.forEach((c) => pushIfUnique(c));
    }

    const responseFields = [
        item?.comentario,
        item?.comentarioUsuario,
        item?.comentarioAdmin,
        item?.respuesta,
        item?.respuestaUsuario,
        item?.respuestaAdmin,
        item?.observacion,
        item?.retroalimentacion,
        item?.comentarioRevision,
    ];

    responseFields.forEach((field) => pushIfUnique(field));

    return respuestas;
};

const getListFromResponse = (responseData) => {
    if (Array.isArray(responseData)) {
        if (responseData.length > 0) {
            const first = responseData[0];
            if (first?.comentarios && Array.isArray(first.comentarios)) {
                return responseData.flatMap((item) =>
                    attachParentContextToItems(item.comentarios, { departamento: item.departamento })
                );
            }
        }
        return responseData;
    }
    
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.quejas)) return responseData.quejas;
    if (Array.isArray(responseData?.sugerencias)) return responseData.sugerencias;
    if (Array.isArray(responseData?.comentarios)) {
        if (responseData.comentarios.length > 0) {
            return attachParentContextToItems(responseData.comentarios, responseData);
        }
    }
    if (Array.isArray(responseData?.results)) return responseData.results;
    if (Array.isArray(responseData?.data?.comentarios)) {
        if (responseData.data.comentarios.length > 0) {
            return attachParentContextToItems(responseData.data.comentarios, responseData.data);
        }
    }
    if (Array.isArray(responseData?.data?.quejas)) {
        return attachParentContextToItems(responseData.data.quejas, responseData.data);
    }
    if (Array.isArray(responseData?.data?.sugerencias)) {
        return attachParentContextToItems(responseData.data.sugerencias, responseData.data);
    }

    const nestedArray = findFirstArrayInObject(responseData);
    if (nestedArray.length) return nestedArray;

    if (
        responseData &&
        typeof responseData === "object" &&
        (responseData?.descripcion || responseData?.mensaje || responseData?.comentario || responseData?._id || responseData?.id)
    ) {
        return [responseData];
    }

    return [];
};

const normalizeFeedbackItem = (item, index) => {
    let estudianteRaw = item?.estudiante ?? item?.usuario ?? item?.userName ?? item?.autor ?? item?.creadoPor;
    let estudianteNormalizado = "No disponible";

    if (Array.isArray(estudianteRaw)) {
        const first = estudianteRaw.find((el) => el && (el.nombre || el.apellido || el.email || typeof el === "string")) || estudianteRaw[0];
        estudianteNormalizado = toText(first, "No disponible");
    } else {
        estudianteNormalizado = toText(estudianteRaw, "No disponible");
    }

    const tipoRaw = String(
        item?.tipoComentario ||
        item?.tipo ||
        item?.categoria ||
        item?.category ||
        item?.clase ||
        ""
    ).trim().toLowerCase();

    // Para el endpoint del arrendatario los registros pueden llegar solo como comentarios del departamento.
    const tipoNormalizado = ["queja", "sugerencia", "comentario"].includes(tipoRaw)
        ? tipoRaw
        : (item?.comentarioUsuario || item?.comentarioAdmin || item?.respuesta ? "comentario" : "queja");
    const manejaEstado = tipoNormalizado !== "comentario";

    const comentariosRespuesta = extractRespuestaComentarios(item);

    return {
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
    const tiposConRevision = ["queja", "sugerencia"];

    const roleNormalized = String(rol || "").toLowerCase();
    const isAdmin = roleNormalized === "administrador";
    const isArrendatario = roleNormalized === "arrendatario";
    const isEstudiante = roleNormalized === "estudiante";
    const canViewFeedback = isAdmin || isArrendatario || isEstudiante;

    const endpoint = useMemo(() => {
        if (isAdmin) return "/administrador/quejas";
        if (isArrendatario) return "/arrendatario/comentarios";
        if (isEstudiante) return "/estudiante/listarcomentarios";
        return null;
    }, [isAdmin, isArrendatario, isEstudiante]);

    useEffect(() => {
        const fetchFeedback = async () => {
            if (!canViewFeedback || !endpoint) {
                return;
            }

            setLoading(true);
            try {
                const url = `${import.meta.env.VITE_BACKEND_URL}${endpoint}`;
                const response = await axios.get(url, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const rawList = getListFromResponse(response?.data);
                
                const normalizedList = rawList.map((item, index) => {
                    const normalized = normalizeFeedbackItem(item, index);
                    return normalized;
                }).filter(Boolean);
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
        if (!tiposConRevision.includes(queja?.tipo) || queja?.tieneRespuesta) return;
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

            const responseComentario = await axios.put(urlComentario, payloadComentario, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (responseComentario?.status >= 200 && responseComentario?.status < 300) {
                // 2. Cambiar estado a revisado
                const urlEstado = `${import.meta.env.VITE_BACKEND_URL}/quejaSugerencia/estado`;
                const payloadEstado = {
                    id: quejaId,
                    estado: true,
                };

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
            const errorMessage =
                error?.response?.data?.msg || error?.response?.data?.message || "Error al enviar comentario";
            toast.error(errorMessage);
        } finally {
            setEnviandoComentario(false);
        }
    };

    // Filtrar items por estado y tipoComentario
    const itemsFiltrados = useMemo(() => {
        // Separar comentarios (sin revisión) de quejas/sugerencias (con revisión)
        const itemsQuejas = items.filter((item) => item.manejaEstado);
        const itemsComentarios = items.filter((item) => !item.manejaEstado);

        // Aplicar filtro de estado solo a quejas/sugerencias
        const quejasPorEstado =
            filtro === "pendientes"
                ? itemsQuejas.filter((item) => !item.estado)
                : filtro === "revisados"
                    ? itemsQuejas.filter((item) => item.estado)
                    : itemsQuejas;

        // Combinar: si filtroTipo es "queja" o "sugerencia", mostrar solo ese tipo
        // Si es "todos", mostrar quejas + sugerencias
        let resultado = [];

        if (filtroTipo === "comentario") {
            resultado = itemsComentarios;
        } else if (filtroTipo === "todos") {
            resultado = [...quejasPorEstado, ...itemsComentarios];
        } else {
            resultado = quejasPorEstado.filter((item) => item.tipo === filtroTipo);
        }

        return resultado;
    }, [items, filtro, filtroTipo]);

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
                                                <p className="text-xs text-gray-500 mt-1">{comentario?.autor || "Admin"}</p>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
                    <div className="relative z-10 bg-white/95 rounded-lg shadow-lg max-w-lg w-full mx-4 p-6 border border-gray-200">
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