import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import useFetch from "../hooks/useFetch";
import storeAuth from "../context/storeAuth";
import { confirm } from "../utils/swal";
import { Marker, MapContainer, TileLayer } from "react-leaflet";
import { createPortal } from "react-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import L from "leaflet";

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const redPinIcon = L.divIcon({
    className: "custom-pin",
    html: `<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0ZM15 20.25C12.1005 20.25 9.75 18.1495 9.75 15.25C9.75 12.3505 12.1005 10.25 15 10.25C17.8995 10.25 20.25 12.3505 20.25 15.25C20.25 18.1495 17.8995 20.25 15 20.25Z" fill="#EF4444"/>
            <circle cx="15" cy="15" r="5" fill="white"/>
           </svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
});

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
    const [imagenCarrusel, setImagenCarrusel] = useState(0);
    const [swiperInstancia, setSwiperInstancia] = useState(null);
    const [enviandoQueja, setEnviandoQueja] = useState(false);
    const [terminandoContrato, setTerminandoContrato] = useState(false);
    const [modoComentario, setModoComentario] = useState(null);
    const [tipoComentario, setTipoComentario] = useState("queja");
    const [calificacion, setCalificacion] = useState(0);
    const [comentarios, setComentarios] = useState([]);
    const carruselMiniaturasRef = useRef(null);

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

    const resolveMetodoPago = (dep) => {
        const raw = dep?.metodoPago;

        if (raw && typeof raw === "object") {
            return {
                tipoBanco: raw?.tipoBanco || raw?.banco || dep?.tipoBanco || dep?.banco || "",
                cuentaBancaria: raw?.cuentaBancaria || raw?.numeroCuenta || dep?.cuentaBancaria || dep?.numeroCuenta || "",
                numeroCedula: raw?.numeroCedula || raw?.cedula || dep?.numeroCedula || dep?.cedula || "",
            };
        }

        if (typeof raw === "string") {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    return {
                        tipoBanco: parsed?.tipoBanco || parsed?.banco || dep?.tipoBanco || dep?.banco || "",
                        cuentaBancaria: parsed?.cuentaBancaria || parsed?.numeroCuenta || dep?.cuentaBancaria || dep?.numeroCuenta || "",
                        numeroCedula: parsed?.numeroCedula || parsed?.cedula || dep?.numeroCedula || dep?.cedula || "",
                    };
                }
            } catch {
                // ignorar strings no JSON
            }
        }

        return {
            tipoBanco: dep?.tipoBanco || dep?.banco || "",
            cuentaBancaria: dep?.cuentaBancaria || dep?.numeroCuenta || "",
            numeroCedula: dep?.numeroCedula || dep?.cedula || "",
        };
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

    const abrirModalTerminarContrato = async () => {
        const deseaContinuar = await confirm({
            title: 'Terminar contrato',
            text: '¿Estás seguro de terminar el contrato? Antes de continuar debes escribir un comentario.',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
            icon: 'warning',
        });

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

            const comentarioId =
                response?.data?.data?._id ||
                response?.data?.data?.id ||
                response?.data?._id ||
                response?.data?.id;

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
        setImagenCarrusel(0);
    }, [departamento?.imagenes?.length]);

    useEffect(() => {
        const contenedor = carruselMiniaturasRef.current;
        if (!contenedor || !departamento?.imagenes?.length) return;

        const botonActivo = contenedor.querySelector(`[data-thumbnail-index="${imagenCarrusel}"]`);
        if (!botonActivo) return;

        // Evitar que la página haga scroll vertical; solo desplazamos el scroll horizontal del contenedor
        try {
            // Cálculo: centrar el thumbnail dentro del contenedor sin tocar el scroll vertical de la página
            const targetScrollLeft = botonActivo.offsetLeft - (contenedor.clientWidth / 2) + (botonActivo.clientWidth / 2);
            if (typeof contenedor.scrollTo === "function") {
                contenedor.scrollTo({ left: Math.max(0, Math.round(targetScrollLeft)), behavior: "smooth" });
            } else {
                contenedor.scrollLeft = Math.max(0, Math.round(targetScrollLeft));
            }
        } catch (err) {
            // Fallback: si algo falla, no hacer nada para evitar salto de página
            console.debug("No se pudo desplazar miniaturas sin scroll vertical:", err);
        }
    }, [imagenCarrusel, departamento?.imagenes?.length]);

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
    const estadoRegreso = location?.state?.from === "/dashboard/chat"
        ? location?.state?.chatState || undefined
        : undefined;

    return (
        <div className="min-h-full bg-slate-50 py-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div className="mx-auto w-full max-w-7xl flex flex-col px-2 md:px-4">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
                    <button
                        type="button"
                        onClick={() => navigate(rutaRegreso, estadoRegreso ? { state: estadoRegreso } : undefined)}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        ← Atrás
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4">Detalles de la residencia</h1>

                {isArrendatario && departamento?.disponible === false && (
                    <section className="mb-6 rounded-2xl border border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-25 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-yellow-800">Departamento desactivado</p>
                            <p className="text-sm text-yellow-700">Si necesitas conocer el motivo, puedes escribir al administrador.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard/chat", { state: { abrirChatAdministrador: true, departamentoNombre: departamento?.titulo, arrendatarioNombre: `${user?.nombre || ""} ${user?.apellido || ""}`.trim() } })}
                            className="shrink-0 rounded-full bg-yellow-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-yellow-700 shadow-md hover:shadow-yellow-600/30 transform hover:-translate-y-0.5"
                        >
                            Contactar con el administrador
                        </button>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
                    <section className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <h2 className="mb-3 text-lg font-semibold text-gray-800">Información general</h2>

                        <div className="grid grid-cols-1 gap-4 text-sm text-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Título</span>
                                    <span className="text-gray-900 truncate">{departamento.titulo}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-700">Precio</span>
                                    <span className="text-gray-900">$ {departamento.precioMensual}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Descripción</span>
                                <p className="text-gray-700 line-clamp-3 mt-1">{departamento.descripcion}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Dirección</span>
                                    <p className="text-gray-900 truncate">{departamento.direccion}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Referencia</span>
                                    <p className="text-gray-900">{departamento.referencia || "-"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Habitaciones</span>
                                    <p className="text-gray-900">{departamento.numeroHabitaciones}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Baños</span>
                                    <p className="text-gray-900">{departamento.numeroBanos}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Parqueadero</span>
                                    <p className="text-gray-900">{departamento.parqueadero ? "Sí" : "No"}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Mascotas</span>
                                    <p className="text-gray-900">{departamento.mascotas ? "Sí" : "No"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {(((departamento.alicoutaMonto != null && departamento.alicoutaMonto !== '' && Number(departamento.alicoutaMonto) > 0) || departamento.alicuota)) && (
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Alícuota</span>
                                        <p className="text-gray-900">{(departamento.alicoutaMonto != null && departamento.alicoutaMonto !== '' && Number(departamento.alicoutaMonto) > 0) ? `$ ${departamento.alicoutaMonto}` : (departamento.alicuota ? 'Sí' : 'No aplica')}</p>
                                    </div>
                                )}

                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Guardianía</span>
                                    <p className="text-gray-900">{departamento.guardiania ? "Sí" : "No"}</p>
                                </div>

                                {departamento.parqueadero && (
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Parqueaderos</span>
                                        <p className="text-gray-900">{departamento.numParqueaderos != null ? departamento.numParqueaderos : '1'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">Servicios incluidos</h3>
                            {servicios.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {servicios.map((servicio, index) => (
                                        <span
                                            key={`${servicio}-${index}`}
                                            className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium"
                                        >
                                            {servicio}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Sin servicios registrados.</p>
                            )}
                        </div>
                    </section>

                    {propietario && (
                        <section className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Información del propietario</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 text-sm text-gray-700">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Nombre</span>
                                    <p className="text-gray-900">{propietario.nombre} {propietario.apellido}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Correo</span>
                                    <p className="text-gray-900 truncate">{propietario.email}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Teléfono</span>
                                    <p className="text-gray-900">{propietario.celular || "No disponible"}</p>
                                </div>
                            </div>

                            {(() => {
                                const metodoPago = resolveMetodoPago(departamento);
                                const tieneMetodoPago = Boolean(
                                    metodoPago.tipoBanco || metodoPago.cuentaBancaria || metodoPago.numeroCedula
                                );

                                if (!tieneMetodoPago) return null;

                                return (
                                    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Método de pago</h4>
                                        <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Tipo de banco</span>
                                                <p className="text-gray-900">{metodoPago.tipoBanco || "No disponible"}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cuenta bancaria</span>
                                                <p className="text-gray-900">{metodoPago.cuentaBancaria || "No disponible"}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cédula</span>
                                                <p className="text-gray-900">{metodoPago.numeroCedula || "No disponible"}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

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
                                    className="mt-4 w-full px-4 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                                >
                                    {isAdministrador ? "Chatear con arrendatario" : "Chatear con propietario"}
                                </button>
                            )}
                        </section>
                    )}

                </div>

                <section className="mb-6 grid gap-6 lg:grid-cols-2 items-stretch">
                    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200 flex flex-col">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ubicación referencial</h2>
                        <div className="overflow-hidden rounded-xl border border-gray-300 flex-1 min-h-[320px] sm:min-h-[400px]">
                            <MapContainer
                                key={`${mapCenter[0]}-${mapCenter[1]}`}
                                center={mapCenter}
                                zoom={15}
                                minZoom={MAP_MIN_ZOOM}
                                maxZoom={MAP_MAX_ZOOM}
                                maxBounds={EPN_MAX_BOUNDS}
                                maxBoundsViscosity={1.0}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {markerCoords && isWithinEpnBounds(markerCoords[0], markerCoords[1]) && (
                                    <Marker position={markerCoords} icon={redPinIcon} />
                                )}
                            </MapContainer>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Ubicación de referencia cercana a la Escuela Politécnica Nacional, Quito.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200 flex flex-col">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Imágenes de la residencia</h2>

                        {departamento.imagenes?.length > 0 ? (
                            <div className="space-y-4">
                                <Swiper
                                    modules={[Autoplay, Navigation]}
                                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                                    navigation
                                    onSwiper={setSwiperInstancia}
                                    onSlideChange={(swiper) => setImagenCarrusel(swiper.activeIndex)}
                                    className="relative h-64 sm:h-80 md:h-96 w-full rounded-2xl border border-gray-200 bg-white shadow-sm"
                                >
                                    {departamento.imagenes.map((img, index) => (
                                        <SwiperSlide key={index}>
                                            <button
                                                type="button"
                                                onClick={() => abrirLightbox(index)}
                                                className="h-full w-full"
                                            >
                                                <img
                                                    src={img.url}
                                                    alt={`Imagen ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>

                                <p className="text-center text-xs text-gray-500">
                                    Imagen {imagenCarrusel + 1} de {departamento.imagenes.length}
                                </p>

                                {departamento.imagenes.length > 1 ? (
                                    <div className="overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        <div ref={carruselMiniaturasRef} className="flex gap-3 snap-x snap-mandatory scroll-smooth px-1">
                                            {departamento.imagenes.map((img, index) => {
                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => {
                                                            setImagenCarrusel(index);
                                                            if (swiperInstancia) swiperInstancia.slideTo(index);
                                                        }}
                                                        data-thumbnail-index={index}
                                                        className={`shrink-0 snap-start overflow-hidden rounded-xl border shadow-sm transition-all ${
                                                            index === imagenCarrusel
                                                                ? 'border-blue-600 ring-2 ring-blue-200'
                                                                : 'border-gray-200 bg-white hover:border-blue-300'
                                                        }`}
                                                    >
                                                        <img
                                                            src={img.url}
                                                            alt={`Imagen ${index + 1}`}
                                                            className="h-28 w-36 object-cover transition-transform duration-300 hover:scale-[1.03]"
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">
                                No hay imágenes disponibles.
                            </div>
                        )}
                    </div>
                </section>

                {
                    <section className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm mb-6 overflow-hidden">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Comentarios de usuarios</h2>
                                <p className="text-sm text-gray-600">
                                    Calificación promedio: <span className="font-semibold text-gray-800">{promedioCalificacion}/5</span>
                                    <span className="ml-2 text-amber-500">{renderEstrellas(Math.round(Number(promedioCalificacion)))}</span>
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-4">
                            {comentarios.length > 0 ? (
                                <Swiper
                                    modules={[Autoplay, Pagination]}
                                    autoplay={{
                                        delay: 3500,
                                        disableOnInteraction: false,
                                        pauseOnMouseEnter: true
                                    }}
                                    pagination={{ clickable: true }}
                                    spaceBetween={20}
                                    slidesPerView={1}
                                    breakpoints={{
                                        640: { slidesPerView: 2 },
                                        1024: { slidesPerView: 3 }
                                    }}
                                    loop={comentarios.length > 3}
                                    className="pb-16"
                                >
                                    {comentarios.map((item) => (
                                        <SwiperSlide key={item.id} className="h-auto">
                                            <article className="h-full min-h-[220px] rounded-2xl border border-white/70 bg-white/75 backdrop-blur-md p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col">
                                                <div className="flex items-start justify-between gap-2 mb-4">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 text-sm truncate">{item.nombre}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                                                            {item.fecha ? new Date(item.fecha).toLocaleDateString("es-EC") : ""}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-amber-500 text-xs">
                                                        {renderEstrellas(item.calificacion)}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4 flex-1">
                                                    {item.comentario}
                                                </p>
                                            </article>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-6 italic">Todavía no hay comentarios en esta residencia.</p>
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
                                className="w-full sm:w-1/2 px-4 py-2 rounded-full border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm"
                            >
                                Queja o sugerencia
                            </button>
                            <button
                                type="button"
                                onClick={abrirModalTerminarContrato}
                                disabled={terminandoContrato || enviandoQueja}
                                className="w-full sm:w-1/2 px-4 py-2 rounded-full bg-red-700 text-white font-semibold hover:bg-red-600 disabled:bg-red-400 transition-all shadow-lg hover:shadow-red-600/30 transform hover:-translate-y-0.5"
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
                                {modoComentario === "terminar" ? "Escribe tu comentario" : "Queja o sugerencia"}
                            </h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                {modoComentario === "terminar"
                                    ? "Escribe tu comentario antes de terminar el contrato."
                                    : "Escribe tu queja o sugerencia sobre la residencia."}
                            </p>

                            <form onSubmit={handleSubmit(enviarComentario)} className="space-y-4">
                                {modoComentario !== "terminar" && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de comentario</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setTipoComentario("queja")}
                                                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                                                        tipoComentario === "queja"
                                                            ? "border-blue-600 bg-blue-600 text-white shadow-md"
                                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    Queja
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTipoComentario("sugerencia")}
                                                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                                                        tipoComentario === "sugerencia"
                                                            ? "border-blue-600 bg-blue-600 text-white shadow-md"
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
                                            Calificación y comentario de la residencia (Obligatorios)
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
                                        {calificacion === 0 && (
                                            <p className="text-center text-[10px] text-red-600 font-bold mt-1 uppercase tracking-tight">Debes calificar con al menos 1 estrella</p>
                                        )}
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
                                        placeholder={modoComentario === "terminar" ? "Cuéntanos tu experiencia..." : "Cuéntanos tu queja o sugerencia..."}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-700 resize-none"
                                        rows="4"
                                        {...register("descripcion", { 
                                            required: "La descripción es obligatoria.",
                                            minLength: { value: 10, message: "Mínimo 10 caracteres." },
                                            validate: val => val.trim().length >= 10 || "La descripción no puede estar vacía o contener solo espacios (mínimo 10 caracteres reales)."
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
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-full font-medium transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                                    >
                                        {enviandoQueja ? 'Enviando...' : (modoComentario === "terminar" ? 'Enviar evaluación y terminar contrato' : 'Enviar')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cerrarModalComentario}
                                        className="w-full border border-gray-300 text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-full font-medium transition-colors"
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
        </div>
    );
    };

export default Details;
