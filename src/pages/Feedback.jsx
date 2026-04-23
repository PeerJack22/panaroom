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

const normalizeFeedbackItem = (item, index) => ({
    id: item?._id || item?.id || `${index}-${item?.createdAt || item?.fecha || Date.now()}`,
    mensaje: toText(item?.mensaje || item?.descripcion || item?.comentario, "Sin descripción"),
    estudiante: toText(
        item?.estudiante?.nombre ||
        item?.estudiante ||
        item?.usuario ||
        item?.userName ||
        item?.autor ||
        item?.creadoPor,
        "No disponible"
    ),
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
});

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

    const roleNormalized = String(rol || "").toLowerCase();
    const isAdmin = roleNormalized === "administrador";
    const isArrendatario = roleNormalized === "arrendatario";
    const canViewFeedback = isAdmin || isArrendatario;

    const endpoint = useMemo(() => {
        if (isAdmin) return "/administrador/quejas";
        if (isArrendatario) return "/arrendatario/comentarios";
        return null;
    }, [isAdmin, isArrendatario]);

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

    if (!canViewFeedback) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
                <h1 className="font-black text-3xl text-gray-700">Quejas y sugerencias</h1>
                <p className="mt-4 text-gray-600">Este módulo está disponible para administrador y arrendatario.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="font-black text-4xl text-gray-500">Quejas y sugerencias</h1>
            <hr className="my-4 border-t-2 border-gray-300" />

            <section className="bg-white border border-gray-200 rounded-xl shadow p-5">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {isAdmin ? "Todas las quejas (Administrador)" : "Quejas de mis departamentos (Arrendatario)"}
                </h2>

                {loading ? (
                    <p className="text-gray-500">Cargando registros...</p>
                ) : !items.length ? (
                    <p className="text-gray-500">No existen registros para mostrar.</p>
                ) : (
                    <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                        {items.map((item) => (
                            <article key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{item.mensaje}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Estudiante: {item.estudiante} • Departamento:{" "}
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