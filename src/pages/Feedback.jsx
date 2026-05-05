import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import storeAuth from "../context/storeAuth";

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

const getListFromResponse = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.quejas)) return responseData.quejas;
    if (Array.isArray(responseData?.comentarios)) return responseData.comentarios;
    if (Array.isArray(responseData?.results)) return responseData.results;

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

    return {
        id: item?._id || item?.id || `${index}-${item?.createdAt || item?.fecha || Date.now()}`,
        _id: item?._id,
        mensaje: toText(item?.mensaje || item?.descripcion || item?.comentario, "Sin descripción"),
        estudiante: estudianteNormalizado,
        departamento: toText(
            item?.departamento?.titulo ||
            item?.departamento?.nombre ||
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
        estado: item?.estado !== undefined ? item.estado : false,
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
    const [filtro, setFiltro] = useState("todos"); // "todos", "pendientes", "revisados"

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

    // Filtrar items basándose en el estado
    const itemsFiltrados = useMemo(() => {
        if (filtro === "pendientes") return items.filter((item) => !item.estado);
        if (filtro === "revisados") return items.filter((item) => item.estado);
        return items;
    }, [items, filtro]);

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
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isAdmin ? "Todas las quejas y sugerencias" : isArrendatario ? "Quejas y sugerencias de mis departamentos" : "Mis quejas y sugerencias"}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFiltro("todos")}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                filtro === "todos"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Todos ({items.length})
                        </button>
                        <button
                            onClick={() => setFiltro("pendientes")}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                filtro === "pendientes"
                                    ? "bg-yellow-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Pendientes ({items.filter((i) => !i.estado).length})
                        </button>
                        <button
                            onClick={() => setFiltro("revisados")}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                filtro === "revisados"
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Revisados ({items.filter((i) => i.estado).length})
                        </button>
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
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                item.estado
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {item.estado ? "Revisado" : "Pendiente"}
                                        </span>
                                        {isAdmin && (
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