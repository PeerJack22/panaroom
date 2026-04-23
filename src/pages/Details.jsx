import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import useFetch from "../hooks/useFetch";
import storeAuth from "../context/storeAuth";


const Details = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchDataBackend } = useFetch();
    const { rol } = storeAuth();
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const [departamento, setDepartamento] = useState(null);
    const [propietario, setPropietario] = useState(null);
    const [imagenActiva, setImagenActiva] = useState(null);
    const [mostrarFormularioQueja, setMostrarFormularioQueja] = useState(false);
    const [enviandoQueja, setEnviandoQueja] = useState(false);

    const isEstudiante = rol === 'estudiante';

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

    const enviarQueja = async (data) => {
        if (!departamento?._id || !data?.descripcion || enviandoQueja) return;

        setEnviandoQueja(true);
        const loadingToast = toast.loading('Enviando queja/sugerencia...');

        try {
            const payload = {
                descripcion: data.descripcion,
                departamento: departamento._id,
            };

            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const url = `${import.meta.env.VITE_BACKEND_URL}/estudiante/queja-sugerencia`;
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${storedUser?.state?.token}`,
                },
            });

            toast.dismiss(loadingToast);
            toast.success(response?.data?.msg || 'Queja/sugerencia enviada correctamente');
            setMostrarFormularioQueja(false);
            reset();
        } catch (error) {
            toast.dismiss(loadingToast);
            const errorMessage =
                error?.response?.data?.msg ||
                error?.response?.data?.message ||
                'No se pudo enviar la queja/sugerencia';
            toast.error(errorMessage);
        } finally {
            setEnviandoQueja(false);
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
                        // Intentar primero con /arrendatarios (plural) y luego con /arrendatario (singular)
                        let arrendatariosResponse;
                        try {
                            arrendatariosResponse = await fetchDataBackend(
                                `${import.meta.env.VITE_BACKEND_URL}/arrendatarios`,
                                null,
                                "GET",
                                headers
                            );
                        } catch {
                            arrendatariosResponse = await fetchDataBackend(
                                `${import.meta.env.VITE_BACKEND_URL}/arrendatario`,
                                null,
                                "GET",
                                headers
                            );
                        }

                        console.log("Respuesta completa de arrendatarios:", arrendatariosResponse);

                        // Buscar al propietario en la lista
                        // La respuesta puede venir como array directo o dentro de .data
                        let arrendatariosList = [];
                        
                        if (Array.isArray(arrendatariosResponse)) {
                            arrendatariosList = arrendatariosResponse;
                        } else if (Array.isArray(arrendatariosResponse?.data)) {
                            arrendatariosList = arrendatariosResponse.data;
                        } else if (arrendatariosResponse?.data?.arrendatarios) {
                            arrendatariosList = arrendatariosResponse.data.arrendatarios;
                        } else if (arrendatariosResponse?.data?.data) {
                            arrendatariosList = arrendatariosResponse.data.data;
                        }

                        const owner = arrendatariosList.find(
                            (arr) => arr._id === ownerIdString || arr.id === ownerIdString
                        );

                        if (owner) {
                            setPropietario(owner);
                        }
                    } catch (ownerError) {
                        console.error("Error al obtener datos del propietario:", ownerError);
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

    const servicios = getServicios(departamento);
    const mapaUrl =
        typeof departamento?.urlMapa === "string" && departamento.urlMapa.includes("openstreetmap.org")
            ? departamento.urlMapa
            : "https://www.openstreetmap.org/export/embed.html?bbox=-78.5058%2C-0.2148%2C-78.4878%2C-0.1968&layer=mapnik&marker=-0.2058%2C-78.4968";

    return (
        <div className="max-w-6xl mx-auto mt-8 mb-10 px-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard/listar")}
                    className="mb-4 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    ← Atrás
                </button>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Detalles del departamento</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
                    <section className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Información general</h2>
                        <ul className="space-y-3 text-gray-700">
                            <li><strong className="text-gray-900">Título:</strong> {departamento.titulo}</li>
                            <li><strong className="text-gray-900">Descripción:</strong> {departamento.descripcion}</li>
                            <li><strong className="text-gray-900">Dirección:</strong> {departamento.direccion}</li>
                            <li><strong className="text-gray-900">Precio mensual:</strong> $ {departamento.precioMensual}</li>
                            <li><strong className="text-gray-900">Habitaciones:</strong> {departamento.numeroHabitaciones}</li>
                            <li><strong className="text-gray-900">Baños:</strong> {departamento.numeroBanos}</li>
                            <li><strong className="text-gray-900">Parqueadero:</strong> {departamento.parqueadero ? "Sí" : "No"}</li>
                        </ul>

                        <div className="mt-5">
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
                        <section className="bg-gray-50 rounded-xl p-8 border border-gray-200 flex flex-col justify-start">
                            <h3 className="text-xl font-semibold text-gray-800 mb-6">Datos del propietario</h3>
                            <div className="space-y-4 text-gray-700">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Nombre completo</p>
                                    <p className="text-lg font-medium text-gray-900">{propietario.nombre} {propietario.apellido}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Correo electrónico</p>
                                    <p className="text-lg font-medium text-gray-900">{propietario.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Teléfono de contacto</p>
                                    <p className="text-lg font-medium text-gray-900">{propietario.celular || "No disponible"}</p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <section className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Ubicación referencial</h2>
                    <div className="rounded-lg overflow-hidden border border-gray-300">
                        <iframe
                            title="Mapa referencial Quito - Escuela Politécnica Nacional"
                            src={mapaUrl}
                            className="w-full h-96"
                            loading="lazy"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Ubicación de referencia cercana a la Escuela Politécnica Nacional, Quito.
                    </p>
                </section>

                {departamento.imagenes?.length > 0 && (
                    <section className="mt-8 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Imágenes del departamento</h2>
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

                {isEstudiante && (
                    <section className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Queja o Sugerencia</h2>
                        
                        {!mostrarFormularioQueja ? (
                            <button
                                type="button"
                                onClick={() => setMostrarFormularioQueja(true)}
                                className="text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                            >
                                Dejar una queja o sugerencia
                            </button>
                        ) : (
                            <form onSubmit={handleSubmit(enviarQueja)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        placeholder="Cuéntanos tu queja o sugerencia..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-700 resize-none"
                                        rows="5"
                                        {...register("descripcion", { 
                                            required: "La descripción es obligatoria",
                                            minLength: { value: 10, message: "Mínimo 10 caracteres" }
                                        })}
                                    />
                                    {errors.descripcion && (
                                        <p className="text-sm text-red-600 mt-1">{errors.descripcion.message}</p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={enviandoQueja}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        {enviandoQueja ? 'Enviando...' : 'Enviar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMostrarFormularioQueja(false);
                                            reset();
                                        }}
                                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                )}

                {imagenActiva !== null && departamento.imagenes?.length > 0 && (
                    <div
                        className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
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
                    </div>
                )}
            </div>
        </div>
    );
    };

export default Details;
