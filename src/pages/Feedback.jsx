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

const normalizeEstado = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const v = value.toLowerCase().trim();
        if (["true", "1", "revisado", "revisada", "reviewed"].includes(v)) return true;
        if (["false", "0", "pendiente", "no revisado", "pending"].includes(v)) return false;
    }
    if (typeof value === "number") return value !== 0;
    return false;
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
        estado: manejaEstado ? normalizeEstado(item?.estado) : null,
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
                // Debug: inspeccionar lo que llega del backend (muestra hasta 5 items)
                try {
                    // clonar para evitar referencias circulares
                    console.debug("[Feedback] rawList sample:", JSON.parse(JSON.stringify(rawList)).slice(0, 5));
                } catch {
                    console.debug("[Feedback] rawList (no serializable)", rawList);
                }

                // Filtro temporal: eliminar objetos que contienen arrays (ej. objetos 'padre' con `comentarios`)
                const cleanedRawList = Array.isArray(rawList)
                    ? rawList.filter((r) => {
                          if (!r || typeof r !== "object") return true;
                          return !Object.values(r).some((v) => Array.isArray(v));
                      })
                    : [];

                // Normalizar
                const normalizedList = cleanedRawList
                    .map((item, index) => normalizeFeedbackItem(item, index))
                    .filter((item) => item && item.tipo !== "comentario");

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
        // separar por tipos
        const itemsQuejasYSugerencias = items.filter((it) => it.tipo !== "comentario" && it.manejaEstado);
        const itemsComentarios = items.filter((it) => it.tipo === "comentario");

        const quejasPorEstado =
            filtro === "pendientes"
                ? itemsQuejasYSugerencias.filter((item) => !item.estado)
                : filtro === "revisados"
                    ? itemsQuejasYSugerencias.filter((item) => item.estado)
                    : itemsQuejasYSugerencias;

        let resultado = [];

        if (filtroTipo === "queja" || filtroTipo === "sugerencia") {
            resultado = quejasPorEstado.filter((item) => item.tipo === filtroTipo);
        } else if (filtroTipo === "comentario") {
            resultado = itemsComentarios;
        } else {
            // 'todos' -> mostrar solo quejas + sugerencias (excluye comentarios)
            resultado = quejasPorEstado;
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
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div className="max-w-6xl mx-auto py-8 px-4">
                <header className="mb-6">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Quejas y sugerencias</h1>
                    <p className="mt-2 text-sm text-slate-500">Este módulo te permite gestionar quejas y sugerencias</p>
                    <hr className="mt-4 border-slate-200" />
                </header>

                <section className="bg-white border border-slate-200 rounded-2xl shadow p-6">
                    <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-bold text-slate-800">
                            {isAdmin ? "Todas las quejas y sugerencias" : isArrendatario ? "Quejas y sugerencias de mis departamentos" : "Mis quejas y sugerencias"}
                        </h2>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex gap-2">
                                <button
                                onClick={() => setFiltro("pendientes")}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                    filtro === "pendientes"
                                    ? "bg-blue-600 text-white"
                                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                                >
                                Pendientes ({conteoPendientes})
                                </button>

                                <button
                                onClick={() => setFiltro("revisados")}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                    filtro === "revisados"
                                    ? "bg-blue-600 text-white"
                                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                                >
                                Revisados ({conteoRevisados})
                                </button>
                                </div>


                            <div className="flex items-center gap-2">
                                <label htmlFor="filtroTipo" className="text-sm font-medium text-slate-700">
                                    Tipo:
                                </label>
                                <select
                                    id="filtroTipo"
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="todos">Todos los tipos</option>
                                    <option value="queja">Queja</option>
                                    <option value="sugerencia">Sugerencia</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-slate-600">Cargando registros...</p>
                    ) : !itemsFiltrados.length ? (
                        <p className="text-slate-600">No existen registros para mostrar.</p>
                    ) : (
                        <div className="space-y-3 max-h-[56rem] overflow-y-auto pr-2">
                            {itemsFiltrados.map((item) => (
                                <article key={item.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{item.mensaje}</p>
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
                                                    className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                                >
                                                    Responder
                                                </button>
                                            )}
                                            {item.tieneRespuesta && (
                                                <span className="text-xs text-green-700 font-semibold">
                                                    ✓ Respondido
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 mt-2">
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
                                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                                            <p className="text-xs font-semibold text-slate-700">Respuestas:</p>
                                            {item.comentariosRespuesta.map((comentario, idx) => (
                                                <div key={idx} className="bg-white rounded-md p-3 ml-2 border-l-2 border-green-500">
                                                    <p className="text-sm text-slate-800">{comentario?.texto || comentario?.descripcion || comentario?.comentario || "Sin contenido"}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{comentario?.autor || "Admin"}</p>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
                        <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">
                                Responder a {quejaSeleccionada?.tipo === "queja" ? "Queja" : "Sugerencia"}
                            </h3>

                            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100 max-h-[150px] overflow-y-auto">
                                <p className="text-sm text-slate-700 font-semibold mb-2">Mensaje original:</p>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{quejaSeleccionada?.mensaje}</p>
                            </div>

                            <label htmlFor="comentario" className="block text-sm font-semibold text-slate-700 mb-2">
                                Tu respuesta:
                            </label>
                            <textarea
                                id="comentario"
                                value={comentarioAdmin}
                                onChange={(e) => setComentarioAdmin(e.target.value)}
                                placeholder="Escribe tu comentario de respuesta..."
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                rows="4"
                            />

                            <div className="flex gap-3 mt-6 justify-end">
                                <button
                                    onClick={cerrarModalComentario}
                                    disabled={enviandoComentario}
                                    className="px-4 py-2 rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={enviarComentarioRespuesta}
                                    disabled={enviandoComentario || !comentarioAdmin.trim()}
                                    className="px-4 py-2 rounded-full text-white bg-green-600 hover:bg-green-700 font-semibold transition-colors disabled:opacity-50"
                                >
                                    {enviandoComentario ? "Enviando..." : "Enviar respuesta"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feedback;