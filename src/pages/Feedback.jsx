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
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.quejas)) return responseData.quejas;
    if (Array.isArray(responseData?.comentarios)) {
        return attachParentContextToItems(responseData.comentarios, responseData);
    }
    if (Array.isArray(responseData?.results)) return responseData.results;
    if (Array.isArray(responseData?.data?.comentarios)) {
        return attachParentContextToItems(responseData.data.comentarios, responseData.data);
    }
    if (Array.isArray(responseData?.data?.quejas)) {
        return attachParentContextToItems(responseData.data.quejas, responseData.data);
    }

    // Fallback genérico para estructuras anidadas: data.items, data.comentarios, etc.
    const nestedArray = findFirstArrayInObject(responseData);
    if (nestedArray.length) return nestedArray;

    // Algunos backends devuelven un solo objeto en lugar de lista.
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
            if (!canViewFeedback || !endpoint) return;

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
                const normalizedList = rawList.map((item, index) => normalizeFeedbackItem(item, index));
                setItems(normalizedList);
            } catch (error) {
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

    const cambiarEstado = async (queja) => {
        if (!queja?.manejaEstado) return;

        const quejaId = queja?.id || queja?._id;

        if (!quejaId) {
            toast.error("Error: No se pudo identificar la queja.");
            return;
        }

        const nuevoEstado = !queja.estado;

        // Pedir confirmación si va a marcar como revisado
        if (nuevoEstado) {
            const confirmar = window.confirm(
                `¿Estás seguro de cambiar el estado de este registro a revisado?`
            );
            if (!confirmar) return;
        }

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/quejaSugerencia/estado`;
            const payload = {
                id: quejaId,
                estado: nuevoEstado,
            };

            const response = await axios.put(
                url,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response?.status >= 200 && response?.status < 300) {
                setItems((prev) =>
                    prev.map((item) =>
                        item.id === queja.id ? { ...item, estado: nuevoEstado } : item
                    )
                );
                toast.success(
                    nuevoEstado ? "Cambio guardado: Revisado" : "Cambio guardado: Pendiente"
                );
            } else {
                toast.error("El servidor no confirmó el cambio.");
            }
        } catch (error) {
            const errorMessage =
                error?.response?.data?.msg || error?.response?.data?.message || "Error al cambiar el estado";
            toast.error(errorMessage);
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
                                        {isAdmin && item.manejaEstado && (
                                            <button
                                                onClick={() => cambiarEstado(item)}
                                                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                                    item.estado
                                                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                                        : "bg-green-500 text-white hover:bg-green-600"
                                                }`}
                                            >
                                                {item.estado ? "Marcar pendiente" : "Marcar revisado"}
                                            </button>
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
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Feedback;