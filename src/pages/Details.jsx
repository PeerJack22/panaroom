import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import useFetch from "../hooks/useFetch";
import storeAuth from "../context/storeAuth";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { createPortal } from "react-dom";

const DEFAULT_CENTER = [-0.2106, -78.4897];
const EPN_BOUNDS = {
    south: -0.222,
    west: -78.502,
    north: -0.199,
    east: -78.475,
};
const EPN_MAX_BOUNDS = [
    [EPN_BOUNDS.south, EPN_BOUNDS.west],
    [EPN_BOUNDS.north, EPN_BOUNDS.east],
];
const MAP_MIN_ZOOM = 14;
const MAP_MAX_ZOOM = 18;

const extractMarkerCoordinates = (url) => {
    if (!url || typeof url !== "string") return null;
    const markerMatch = url.match(/marker=([-\d.]+)%2C([-\d.]+)/i) || url.match(/marker=([-\d.]+),([-\d.]+)/i);
    if (!markerMatch) return null;

    const lat = Number(markerMatch[1]);
    const lng = Number(markerMatch[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return [lat, lng];
};

const isWithinEpnBounds = (lat, lng) => {
    return (
        lat >= EPN_BOUNDS.south &&
        lat <= EPN_BOUNDS.north &&
        lng >= EPN_BOUNDS.west &&
        lng <= EPN_BOUNDS.east
    );
};


const Details = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { fetchDataBackend } = useFetch();
    const { rol, user } = storeAuth();
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const [departamento, setDepartamento] = useState(null);
    const [propietario, setPropietario] = useState(null);
    const [imagenActiva, setImagenActiva] = useState(null);
    const [enviandoQueja, setEnviandoQueja] = useState(false);
    const [terminandoContrato, setTerminandoContrato] = useState(false);
    const [modoComentario, setModoComentario] = useState(null);
    const [tipoComentario, setTipoComentario] = useState("queja");
    const [calificacion, setCalificacion] = useState(0);
    const [comentarios, setComentarios] = useState([]);

    const isEstudiante = rol === 'estudiante';
    const isAdministrador = rol === 'administrador';
    const isArrendatario = rol === 'arrendatario';

    const abrirLightbox = (index) => setImagenActiva(index);
    const cerrarLightbox = () => setImagenActiva(null);

    const irSiguienteImagen = () => {
        if (!departamento?.imagenes?.length) return;
        setImagenActiva((prev) => (prev + 1) % departamento.imagenes.length);
    };

    const irImagenAnterior = () => {
        if (!departamento?.imagenes?.length) return;
        setImagenActiva((prev) => (prev - 1 + departamento.imagenes.length) % departamento.imagenes.length);
    };

    const renderEstrellas = (valor) => {
        const cantidad = Math.max(0, Math.min(5, Number(valor) || 0));
        return Array.from({ length: 5 }).map((_, index) => (
            <span key={index} aria-hidden="true">
                {index < cantidad ? "★" : "☆"}
            </span>
        ));
    };

    const formatearServicio = (valor) => {
        if (!valor) return null;
        const texto = String(valor).trim();
        if (!texto) return null;
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    };

    const getServicios = (dep) => {
        if (Array.isArray(dep?.serviciosIncluidos)) {
            return dep.serviciosIncluidos
                .map((item) => {
                    if (typeof item === "string") return formatearServicio(item);
                    if (item && typeof item === "object") {
                        return formatearServicio(item.nombre || item.name || item.servicio);
                    }
                    return null;
                })
                .filter(Boolean);
        }

        if (typeof dep?.serviciosIncluidos === "string") {
            return dep.serviciosIncluidos
                .split(",")
                .map((s) => formatearServicio(s))
                .filter(Boolean);
        }

        const servicios = [];
        if (dep?.luz) servicios.push("Luz");
        if (dep?.agua) servicios.push("Agua");
        if (dep?.internet) servicios.push("Internet");
        return servicios;
    };

    const cerrarModalComentario = () => {
        setModoComentario(null);
        setTipoComentario("queja");
        setCalificacion(0);
        reset();
    };

    const abrirModalComentario = () => {
        setModoComentario("comentario");
        setTipoComentario("queja");
        reset();
    };

    const abrirModalTerminarContrato = () => {
        const deseaContinuar = window.confirm(
            "¿Estás seguro de terminar el contrato? Antes de continuar debes escribir un comentario."
        );

        if (!deseaContinuar) return;

        setModoComentario("terminar");
        reset();
    };

    const enviarComentario = async (data) => {
        if (!departamento?._id || !data?.descripcion || enviandoQueja) return;

        // Validar calificación si es terminación
        if (modoComentario === "terminar" && calificacion === 0) {
            toast.error("Por favor, selecciona una calificación de estrellas.");
            return;
        }

        setEnviandoQueja(true);
        const esTerminacion = modoComentario === "terminar";
        const loadingToast = toast.loading(esTerminacion ? "Enviando comentario y terminando contrato..." : "Enviando comentario...");
        const tipoComentarioNormalizado = esTerminacion
            ? "comentario"
            : String(tipoComentario || "queja").toLowerCase();

        try {
            const payload = {
                descripcion: data.descripcion,
                departamento: departamento._id,
                tipoComentario: tipoComentarioNormalizado,
            };

            // Debugging logs removed
            
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const url = `${import.meta.env.VITE_BACKEND_URL}/estudiante/queja-sugerencia`;
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${storedUser?.state?.token}`,
                },
            });
            
            // Debugging logs removed

            const comentarioId = response?.data?._id || response?.data?.id;

            // Si es terminación, enviar también la calificación
            if (esTerminacion && comentarioId && calificacion > 0) {
                try {
                    const calificacionUrl = `${import.meta.env.VITE_BACKEND_URL}/queja-sugerencia/calificacion`;
                    const calificacionPayload = {
                        id: comentarioId,
                        calificacion: calificacion,
                    };

                    // Debugging logs removed

                    await axios.put(calificacionUrl, calificacionPayload, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${storedUser?.state?.token}`,
                        },
                    });

                    // Debugging logs removed
                } catch (calificacionError) {
                    console.error("[Details] Error al enviar calificación:", calificacionError);
                    // No lanzar error, continuar con el proceso
                }
            }

            toast.dismiss(loadingToast);
            toast.success(response?.data?.msg || (esTerminacion ? "Comentario enviado correctamente" : "Comentario enviado correctamente"));
            reset();

            if (esTerminacion) {
                setModoComentario(null);
                setCalificacion(0);
                setTimeout(() => {
                    ejecutarTerminarContrato();
                }, 1000);
            } else {
                cerrarModalComentario();
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            const errorMessage =
                error?.response?.data?.msg ||
                error?.response?.data?.message ||
                'No se pudo enviar el comentario';
            toast.error(errorMessage);
        } finally {
            setEnviandoQueja(false);
        }
    };

    const ejecutarTerminarContrato = async () => {
        if (!departamento?._id || terminandoContrato) return;

        setTerminandoContrato(true);
        const loadingToast = toast.loading("Terminando contrato...");

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/quitarEstudiante`;
            const payload = {
                departamentoId: departamento._id,
            };

            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const response = await axios.put(url, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${storedUser?.state?.token}`,
                },
            });

            toast.dismiss(loadingToast);
            toast.success(response?.data?.msg || "Contrato terminado correctamente");
            
            setTimeout(() => {
                navigate("/dashboard/mis-residencias");
            }, 1500);
        } catch (error) {
            toast.dismiss(loadingToast);
            const errorMessage =
                error?.response?.data?.msg ||
                error?.response?.data?.message ||
                "No se pudo terminar el contrato";
            toast.error(errorMessage);
        } finally {
            setTerminandoContrato(false);
        }
    };

    useEffect(() => {
        const fetchDepartamento = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser.state.token}`,
            };
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/${id}`;
            const response = await fetchDataBackend(url, null, "GET", headers);
            if (!response) throw new Error("Departamento no encontrado");
            setDepartamento(response);

            // Obtener datos del propietario (arrendatario)
            if (response?.arrendatario) {
                const ownerIdString = typeof response.arrendatario === "object"
                    ? response.arrendatario._id || response.arrendatario.id
                    : response.arrendatario;

                if (ownerIdString) {
                    try {
                        // Intentar obtener al arrendatario buscando en la lista general
                        const listUrl = `${import.meta.env.VITE_BACKEND_URL}/arrendatario/listararrendatarios`;
                        const listResp = await fetchDataBackend(listUrl, null, "GET", headers);

                        let arrendatarios = [];
                        if (Array.isArray(listResp)) arrendatarios = listResp;
                        else if (Array.isArray(listResp?.data)) arrendatarios = listResp.data;
                        else if (Array.isArray(listResp?.arrendatarios)) arrendatarios = listResp.arrendatarios;

                        const owner = arrendatarios.find((a) => String(a?._id || a?.id) === String(ownerIdString));

                        if (owner && (owner.nombre || owner.email)) {
                            setPropietario(owner);
                        } else {
                            // Fallback: si el endpoint individual existe, intentar llamarlo
                            try {
                                const ownerResponse = await fetchDataBackend(
                                    `${import.meta.env.VITE_BACKEND_URL}/arrendatario/${ownerIdString}`,
                                    null,
                                    "GET",
                                    headers
                                );
                                const singleOwner = Array.isArray(ownerResponse) ? ownerResponse[0] : (ownerResponse?.data || ownerResponse);
                                if (singleOwner && (singleOwner.nombre || singleOwner.email)) {
                                    setPropietario(singleOwner);
                                }
                            } catch (innerErr) {
                                // No hacer nada, ya logueado más abajo
                                console.debug("Fallback: no se obtuvo propietario por id:", innerErr);
                            }
                        }
                    } catch (ownerError) {
                        console.error("Error al obtener datos del propietario (listar):", ownerError);
                    }
                }
            }
        } catch (error) {
            console.error("Error al cargar departamento:", error);
        }
        };
        fetchDepartamento();
    }, [id, fetchDataBackend]);

    useEffect(() => {
        const fetchComentarios = async () => {
            try {
                const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/comentarios/${id}`;
                const storedUser = JSON.parse(localStorage.getItem("auth-token"));
                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${storedUser?.state?.token}`,
                };
                const response = await fetchDataBackend(url, null, "GET", headers);
                const lista = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.comentarios)
                        ? response.comentarios
                        : Array.isArray(response?.data)
                            ? response.data
                            : [];

                setComentarios(
                    lista
                        .filter((item) => String(item?.tipoComentario || "").toLowerCase() === "comentario")
                        .map((item, index) => ({
                            id: item?._id || item?.id || index,
                            nombre: item?.nombreRemitente || item?.nombre || item?.usuario?.nombre || "Usuario",
                            fecha: item?.createdAt || item?.fecha || item?.fechaCreacion || "",
                            calificacion: Number(item?.calificacion) || 0,
                            comentario: item?.descripcion || item?.comentario || "",
                        }))
                );
            } catch (error) {
                console.error("Error al cargar comentarios:", error);
                setComentarios([]);
            }
        };

        if (id) fetchComentarios();
    }, [id, fetchDataBackend]);

    useEffect(() => {
        const totalImagenes = departamento?.imagenes?.length || 0;

        const onKeyDown = (e) => {
            if (imagenActiva === null) return;

            if (e.key === "Escape") {
                cerrarLightbox();
            }

            if (e.key === "ArrowRight") {
                if (!totalImagenes) return;
                setImagenActiva((prev) => (prev + 1) % totalImagenes);
            }

            if (e.key === "ArrowLeft") {
                if (!totalImagenes) return;
                setImagenActiva((prev) => (prev - 1 + totalImagenes) % totalImagenes);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [imagenActiva, departamento?.imagenes?.length]);

    if (!departamento) {
        return (
        <div className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 text-center">
            <span className="font-medium">Cargando datos del departamento...</span>
        </div>
        );
    }

    const tieneEstudianteAsignado = Boolean(
        departamento?.estudianteId ||
        departamento?.estudiante ||
        departamento?.estudiante?._id ||
        departamento?.estudiante?.id
    );

    const servicios = getServicios(departamento);
    const markerCoords = extractMarkerCoordinates(departamento?.urlMapa);
    const mapCenter = markerCoords && isWithinEpnBounds(markerCoords[0], markerCoords[1])
        ? markerCoords
        : DEFAULT_CENTER;
    const comentariosConCalificacion = comentarios.filter((item) => Number(item.calificacion) > 0);
    const promedioCalificacion = comentariosConCalificacion.length
        ? (comentariosConCalificacion.reduce((acc, item) => acc + Number(item.calificacion), 0) / comentariosConCalificacion.length).toFixed(1)
        : "0.0";
    const rutaRegreso = location?.state?.from || "/dashboard/listar";

    return (
        <div className="max-w-6xl mx-auto mt-8 mb-10 px-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8">
                <button
                    type="button"
                    onClick={() => navigate(rutaRegreso)}
                    className="mb-4 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    ← Atrás
                </button>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Detalles de la residencia</h1>

                {isArrendatario && departamento?.disponible === false && (
                    <section className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-yellow-800">Departamento desactivado</p>
                            <p className="text-sm text-yellow-700">Si necesitas conocer el motivo, puedes escribir al administrador.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard/chat", { state: { abrirChatAdministrador: true, departamentoNombre: departamento?.titulo, arrendatarioNombre: `${user?.nombre || ""} ${user?.apellido || ""}`.trim() } })}
                            className="shrink-0 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-yellow-700"
                        >
                            Contactar con el administrador
                        </button>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
                    <section className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <h2 className="mb-4 text-xl font-semibold text-gray-800">Información general</h2>
                        
                        <div className="space-y-4">
                            <div className="pb-4 border-b border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Título</p>
                                <p className="text-gray-900 font-medium">{departamento.titulo}</p>
                            </div>

                            <div className="pb-4 border-b border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Descripción</p>
                                <p className="text-gray-700 text-sm">{departamento.descripcion}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Dirección</p>
                                    <p className="text-gray-900">{departamento.direccion}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Referencia</p>
                                    <p className="text-gray-900">{departamento.referencia || "-"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Categoría</p>
                                    <p className="text-gray-900">{departamento.categoria ? formatearServicio(departamento.categoria) : "No definida"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Bodega</p>
                                    <p className="text-gray-900">{departamento.bodega ? "Sí" : "No"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Guardianía</p>
                                    <p className="text-gray-900">{departamento.guardiania ? "Sí" : "No"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Precio mensual</p>
                                    <p className="text-gray-900 font-semibold">$ {departamento.precioMensual}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Monto de alícuota</p>
                                    <p className="text-gray-900">{departamento.alicoutaMonto != null ? `$ ${departamento.alicoutaMonto}` : "No aplica"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Habitaciones</p>
                                    <p className="text-gray-900">{departamento.numeroHabitaciones}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Baños</p>
                                    <p className="text-gray-900">{departamento.numeroBanos}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Parqueadero</p>
                                    <p className="text-gray-900">{departamento.parqueadero ? "Sí" : "No"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Número de parqueaderos</p>
                                    <p className="text-gray-900">{departamento.numParqueaderos != null ? departamento.numParqueaderos : (departamento.parqueadero ? "1" : "0")}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Permite mascotas</p>
                                <p className="text-gray-900">{departamento.mascotas ? "Sí" : "No"}</p>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Servicios incluidos</h3>
                            {servicios.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {servicios.map((servicio, index) => (
                                        <span
                                            key={`${servicio}-${index}`}
                                            className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium"
                                        >
                                            {servicio}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Este apartamento no tiene servicios registrados.</p>
                            )}
                        </div>
                    </section>

                    {propietario && (
                        <section className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Información del propietario</h3>
                            <div className="space-y-4">
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Nombre completo</p>
                                    <p className="text-gray-900 font-medium">{propietario.nombre} {propietario.apellido}</p>
                                </div>
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Correo electrónico</p>
                                    <p className="text-gray-900">{propietario.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Teléfono de contacto</p>
                                    <p className="text-gray-900">{propietario.celular || "No disponible"}</p>
                                </div>
                            </div>

                            {(isAdministrador || (isEstudiante && !tieneEstudianteAsignado)) && (
                                <button
                                    type="button"
                                    onClick={() => navigate("/dashboard/chat", {
                                        state: {
                                            propietarioId: propietario?._id,
                                            propietarioNombre: `${propietario?.nombre || ""} ${propietario?.apellido || ""}`.trim(),
                                            contactoId: propietario?._id,
                                            contactoTipo: "arrendatario",
                                            contactoNombre: `${propietario?.nombre || ""} ${propietario?.apellido || ""}`.trim(),
                                            departamentoId: departamento?._id,
                                            departamentoNombre: departamento?.titulo,
                                        },
                                    })}
                                    className="mt-6 w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    {isAdministrador ? "Chatear con arrendatario" : "Chatear con propietario"}
                                </button>
                            )}
                        </section>
                    )}

                </div>

                <section className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Ubicación referencial</h2>
                    <div className="rounded-lg overflow-hidden border border-gray-300">
                        <MapContainer
                            key={`${mapCenter[0]}-${mapCenter[1]}`}
                            center={mapCenter}
                            zoom={15}
                            minZoom={MAP_MIN_ZOOM}
                            maxZoom={MAP_MAX_ZOOM}
                            maxBounds={EPN_MAX_BOUNDS}
                            maxBoundsViscosity={1.0}
                            style={{ height: "24rem", width: "100%" }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {markerCoords && isWithinEpnBounds(markerCoords[0], markerCoords[1]) && (
                                <CircleMarker center={markerCoords} radius={8} pathOptions={{ color: "#1d4ed8" }} />
                            )}
                        </MapContainer>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Ubicación de referencia cercana a la Escuela Politécnica Nacional, Quito.
                    </p>
                </section>

                {departamento.imagenes?.length > 0 && (
                    <section className="mt-8 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Imágenes de la residencia</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {departamento.imagenes.map((img, index) => (
                                <img
                                    key={index}
                                    src={img.url}
                                    alt={`Imagen ${index + 1}`}
                                    className="w-full h-44 object-cover rounded-lg border border-gray-200 shadow-sm cursor-zoom-in hover:scale-[1.02] transition-transform"
                                    onClick={() => abrirLightbox(index)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {
                    <section className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Comentarios de usuarios</h2>
                            <p className="text-sm text-gray-600">
                                Calificación promedio: <span className="font-semibold text-gray-800">{promedioCalificacion}/5</span>
                                <span className="ml-2 text-amber-500">{renderEstrellas(Math.round(Number(promedioCalificacion)))}</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            {comentarios.length > 0 ? comentarios.map((item) => (
                                <article key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                        <p className="font-semibold text-gray-800">{item.nombre}</p>
                                        <p className="text-xs text-gray-500">
                                            {item.fecha ? new Date(item.fecha).toLocaleDateString("es-EC") : ""}
                                        </p>
                                    </div>

                                    <div className="mb-2 flex items-center gap-2">
                                        <div className="text-amber-500 leading-none">
                                            {renderEstrellas(item.calificacion)}
                                        </div>
                                        <span className="text-xs text-gray-600">{item.calificacion}.0/5</span>
                                    </div>

                                    <p className="text-sm text-gray-700 leading-relaxed">{item.comentario}</p>
                                </article>
                            )) : (
                                <p className="text-sm text-gray-500">Todavía no hay comentarios en esta residencia.</p>
                            )}
                        </div>
                    </section>
                }

                {isEstudiante && tieneEstudianteAsignado && (
                    <section className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones del contrato</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={abrirModalComentario}
                                disabled={enviandoQueja || terminandoContrato}
                                className="w-full sm:w-1/2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                            >
                                Queja o sugerencia
                            </button>
                            <button
                                type="button"
                                onClick={abrirModalTerminarContrato}
                                disabled={terminandoContrato || enviandoQueja}
                                className="w-full sm:w-1/2 px-4 py-2 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-600 disabled:bg-red-400 transition-colors"
                            >
                                {terminandoContrato ? "Terminando contrato..." : "Terminar contrato"}
                            </button>
                        </div>
                    </section>
                )}

                {isEstudiante && tieneEstudianteAsignado && modoComentario && createPortal(
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                {modoComentario === "terminar" ? "Comentario antes de terminar el contrato" : "Queja o sugerencia"}
                            </h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                {modoComentario === "terminar"
                                    ? "Escribe tu comentario antes de terminar el contrato."
                                    : "Escribe tu queja o sugerencia sobre la residencia."}
                            </p>

                            <form onSubmit={handleSubmit(enviarComentario)} className="space-y-4">
                                {modoComentario !== "terminar" && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tipo de comentario
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTipoComentario("queja")}
                                                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                                                    tipoComentario === "queja"
                                                        ? "border-blue-600 bg-blue-600 text-white"
                                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                }`}
                                            >
                                                Queja
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTipoComentario("sugerencia")}
                                                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                                                    tipoComentario === "sugerencia"
                                                        ? "border-blue-600 bg-blue-600 text-white"
                                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                }`}
                                            >
                                                Sugerencia
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {modoComentario === "terminar" && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Calificación de la residencia (Obligatoria)
                                        </label>
                                        <div className="flex gap-2 justify-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setCalificacion(star)}
                                                    className={`text-4xl transition-transform hover:scale-110 ${
                                                        star <= calificacion
                                                            ? "text-amber-400"
                                                            : "text-gray-300"
                                                    }`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                        {calificacion > 0 && (
                                            <p className="text-center text-sm text-gray-600 mt-2">
                                                Calificación: <span className="font-semibold">{calificacion}/5</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        placeholder={modoComentario === "terminar" ? "Escribe tu evaluación de la residencia..." : "Cuéntanos tu queja o sugerencia..."}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-700 resize-none"
                                        rows="4"
                                        {...register("descripcion", { 
                                            required: "La descripción es obligatoria.",
                                            minLength: { value: 10, message: "Mínimo 10 caracteres." }
                                        })}
                                    />
                                    {errors.descripcion && (
                                        <p className="text-sm text-red-600 mt-1">{errors.descripcion.message}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        type="submit"
                                        disabled={enviandoQueja || (modoComentario === "terminar" && calificacion === 0)}
                                        className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        {enviandoQueja ? 'Enviando...' : (modoComentario === "terminar" ? 'Enviar evaluación y terminar contrato' : 'Enviar queja/sugerencia')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cerrarModalComentario}
                                        className="w-full border border-gray-300 text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

                {imagenActiva !== null && departamento.imagenes?.length > 0 && createPortal(
                    <div
                        className="fixed inset-0 z-[99999] bg-black/85 flex items-center justify-center p-4"
                        onClick={cerrarLightbox}
                    >
                        <button
                            type="button"
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-2xl w-10 h-10 rounded-full"
                            onClick={cerrarLightbox}
                            aria-label="Cerrar visor"
                        >
                            ×
                        </button>

                        {departamento.imagenes.length > 1 && (
                            <button
                                type="button"
                                className="absolute left-4 md:left-8 bg-white/10 hover:bg-white/20 text-white text-2xl w-11 h-11 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    irImagenAnterior();
                                }}
                                aria-label="Imagen anterior"
                            >
                                ‹
                            </button>
                        )}

                        <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                            <img
                                src={departamento.imagenes[imagenActiva]?.url}
                                alt={`Vista grande ${imagenActiva + 1}`}
                                className="w-full max-h-[82vh] object-contain rounded-xl"
                            />
                            <p className="text-white text-sm mt-3 text-center">
                                Imagen {imagenActiva + 1} de {departamento.imagenes.length}
                            </p>
                        </div>

                        {departamento.imagenes.length > 1 && (
                            <button
                                type="button"
                                className="absolute right-4 md:right-8 bg-white/10 hover:bg-white/20 text-white text-2xl w-11 h-11 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    irSiguienteImagen();
                                }}
                                aria-label="Siguiente imagen"
                            >
                                ›
                            </button>
                        )}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
    };

export default Details;
