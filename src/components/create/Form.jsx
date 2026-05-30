import { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import storeAuth from "../../context/storeAuth.jsx";

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

const isWithinEpnBounds = (lat, lng) => {
    return (
        lat >= EPN_BOUNDS.south &&
        lat <= EPN_BOUNDS.north &&
        lng >= EPN_BOUNDS.west &&
        lng <= EPN_BOUNDS.east
    );
};

const buildOpenStreetMapEmbedUrl = (lat, lng) => {
    const delta = 0.005;
    const minLng = (lng - delta).toFixed(6);
    const minLat = (lat - delta).toFixed(6);
    const maxLng = (lng + delta).toFixed(6);
    const maxLat = (lat + delta).toFixed(6);
    const markerLat = lat.toFixed(6);
    const markerLng = lng.toFixed(6);

    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${markerLat}%2C${markerLng}`;
};

const extractMarkerCoordinates = (url) => {
    if (!url || typeof url !== "string") return null;
    const markerMatch = url.match(/marker=([-\d.]+)%2C([-\d.]+)/i) || url.match(/marker=([-\d.]+),([-\d.]+)/i);
    if (!markerMatch) return null;

    const lat = Number(markerMatch[1]);
    const lng = Number(markerMatch[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return [lat, lng];
};

export const Form = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedImages, setSelectedImages] = useState([]);
    const totalSteps = 4;
    const {
        register,
        handleSubmit,
        setValue,
        clearErrors,
        trigger,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm();
    const { fetchDataBackend } = useFetch();

    const { user, token } = storeAuth();

    const values = watch();
    const tieneParqueadero = watch("parqueadero") === "true";
    const alicuotaActiva = values.alicuota === "true";
    const currentMapUrl = watch("urlMapa");
    const [selectedPoint, setSelectedPoint] = useState(null);

    useEffect(() => {
        if (!tieneParqueadero) {
            setValue("numParqueaderos", "0", { shouldDirty: true, shouldValidate: true });
        }
    }, [setValue, tieneParqueadero]);

    // No mostramos miniaturas en la confirmación; mantenemos solo la lista de `selectedImages`.

    useEffect(() => {
        const coords = extractMarkerCoordinates(currentMapUrl);
        if (coords && isWithinEpnBounds(coords[0], coords[1])) {
            setSelectedPoint(coords);
            return;
        }

        setSelectedPoint(null);
    }, [currentMapUrl]);

    const stepFields = {
        1: ["titulo", "descripcion", "direccion", "referencia", "urlMapa", "categoria"],
        2: ["precioMensual", "numeroHabitaciones", "numeroBanos", "parqueadero", "bodega", "guardiania", "alicuota", "alicoutaMonto", "mascotas", ...(tieneParqueadero ? ["numParqueaderos"] : [])],
        3: ["imagen"],
    };

    useEffect(() => {
        setValue("ciudad", "Quito", { shouldDirty: false });
    }, [setValue]);

    const handleNextStep = async () => {
        if (!stepFields[step]) {
            setStep((prev) => Math.min(prev + 1, totalSteps));
            return;
        }

        const valid = await trigger(stepFields[step]);
        if (!valid) {
            toast.error("Completa los campos obligatorios antes de continuar.");
            return;
        }

        // Verificación adicional: si estamos en el paso 1, comprobar que el título sea único
        if (step === 1) {
            try {
                const titulo = String(watch("titulo") || "").trim();
                if (titulo) {
                    const url = `${import.meta.env.VITE_BACKEND_URL}/departamentos`;
                    // intentar obtener token de store o localStorage (igual que en otros componentes)
                    const storedUser = JSON.parse(localStorage.getItem("auth-token") || "null");
                    const authToken = token || storedUser?.state?.token || null;
                    const headers = { "Content-Type": "application/json" };
                    if (authToken) headers.Authorization = `Bearer ${authToken}`;

                    try {
                        const resp = await fetchDataBackend(url, null, "GET", headers);
                        const lista = Array.isArray(resp) ? resp : (Array.isArray(resp?.data) ? resp.data : []);
                        const existe = lista.some((d) => String(d?.titulo || "").trim().toLowerCase() === titulo.toLowerCase());
                        if (existe) {
                            setError("titulo", { type: "validate", message: "Ya existe una residencia con ese título" });
                            toast.warn("Ya existe una residencia con ese título.");
                            return;
                        }
                    } catch (err) {
                        // manejo de errores: si es 401/403 indicar re-login, si no, permitir continuar
                        const status = err?.response?.status || err?.status || null;
                        if (status === 401 || status === 403) {
                            setError("titulo", { type: "validate", message: "Acceso denegado. Por favor inicia sesión nuevamente." });
                            toast.error("Acceso denegado. Por favor inicia sesión nuevamente.");
                            return;
                        }
                        console.warn("Error verificando títulos (se ignorará la verificación):", err);
                    }
                }
            } catch (err) {
                console.error("Error verificando título único:", err);
                // No cortar el flujo si la verificación falla por red
            }
        }

        setStep((prev) => Math.min(prev + 1, totalSteps));
    };

    const handlePreviousStep = () => {
        setStep((prev) => Math.max(prev - 1, 1));
    };

    const removeImage = (index) => {
        const updated = selectedImages.filter((_, i) => i !== index);
        setSelectedImages(updated);
        setValue("imagen", updated, { shouldValidate: true });
    };

    const handleMapSelect = ([lat, lng]) => {
        if (!isWithinEpnBounds(lat, lng)) {
            toast.error("Selecciona un punto dentro de la zona aledaña a la EPN.");
            return;
        }

        setSelectedPoint([lat, lng]);
        setValue("urlMapa", buildOpenStreetMapEmbedUrl(lat, lng), {
            shouldDirty: true,
            shouldValidate: true,
        });
        clearErrors("urlMapa");
    };

    const MapClickSelector = () => {
        useMapEvents({
            click(e) {
                handleMapSelect([e.latlng.lat, e.latlng.lng]);
            },
        });

        return null;
    };

    const registerResidencia = async (data) => {
        if (!user || !user._id) {
            toast.error("Error: ID de usuario no disponible. Por favor, reinicia la sesión.");
            navigate("/login");
            return;
        }

        const serviciosSeleccionados = Array.isArray(data.servicios)
            ? data.servicios
            : data.servicios
                ? [data.servicios]
                : [];

        const mapServicioBackend = {
            agua: "Agua",
            luz: "Luz",
            internet: "Internet",
        };

        const serviciosNormalizados = serviciosSeleccionados
            .map((serv) => mapServicioBackend[String(serv).trim().toLowerCase()] || null)
            .filter(Boolean);

        if (!serviciosNormalizados.length) {
            toast.error("Debes seleccionar al menos un servicio.");
            return;
        }

        if (selectedImages.length < 4) {
            toast.error("Debes subir al menos 4 imágenes.");
            return;
        }

        const formData = new FormData();
        formData.append("arrendatario", user._id);

        Object.keys(data).forEach((key) => {
            if (key === "imagen") {
                return;
            } else if (key === "servicios") {
                return;
            } else if (key === "parqueadero") {
                formData.append("parqueadero", data[key] === "true" ? "true" : "false");
            } else if (key === "alicuota") {
                formData.append("alicuota", data[key] === "true" ? "true" : "false");
            } else if (key === "mascotas") {
                formData.append("mascotas", data[key] === "true" ? "true" : "false");
            } else if (key === "guardiania") {
                formData.append("guardiania", data[key] === "true" ? "true" : "false");
            } else if (key === "numParqueaderos") {
                formData.append("numParqueaderos", data[key] || "0");
            } else if (key === "alicoutaMonto") {
                if (data.alicuota === "true") {
                    formData.append("alicoutaMonto", String(data[key] ?? "0"));
                }
            } else if (key === "precioMensual" || key === "numeroHabitaciones" || key === "numeroBanos" || key === "alicoutaMonto") {
                // Asegurar que se envían valores numéricos como strings
                formData.append(key, String(data[key] ?? ""));
            } else {
                formData.append(key, data[key]);
            }
        });

        serviciosNormalizados.forEach((servicio) => {
            formData.append("serviciosIncluidos", servicio);
        });

        selectedImages.forEach((img) => {
            formData.append("imagenes", img);
        });

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/registro`;
            const headers = {
                Authorization: `Bearer ${token}`,
                // NO pongas "Content-Type": "application/json"
            };
            const response = await fetchDataBackend(url, formData, "POST", headers);
            if (response) {
                if (!response.msg) {
                    toast.success("Residencia registrada exitosamente!");
                }
                setTimeout(() => {
                    navigate("/dashboard/listar");
                }, 2000);
            }
        } catch (error) {
            console.error("Error al registrar residencia:", error);
            toast.error(
                "Hubo un error al registrar la residencia. Inténtalo de nuevo."
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit(registerResidencia)}
            className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Registrar residencia</h1>
                    <p className="mt-2 text-sm text-slate-600">Completa cada bloque y revisa el resumen antes de guardar.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                    ← Regresar
                </button>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between gap-2">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex items-center flex-1">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${n <= step ? "bg-blue-700 border-blue-700 text-white" : "bg-white border-slate-300 text-slate-500"}`}>
                                {n}
                            </div>
                            {n < 4 && (
                                <div className={`h-1 flex-1 mx-2 rounded ${n < step ? "bg-blue-700" : "bg-slate-200"}`} />
                            )}
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-sm text-slate-500">Paso {step} de {totalSteps}</p>
            </div>

            <fieldset className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <legend className="rounded-full bg-white px-4 py-1 text-xl font-bold text-slate-800 shadow-sm">
                    {step === 1 && "Información básica"}
                    {step === 2 && "Datos del inmueble"}
                    {step === 3 && "Imágenes y servicios"}
                    {step === 4 && "Confirmación"}
                </legend>

                {step === 1 && (
                    <>
                        <div>
                            <label className="mb-2 block text-sm font-semibold">Título</label>
                            <input
                                type="text"
                                placeholder="Ingresar título"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("titulo", { 
                                    required: "El título es obligatorio.",
                                    maxLength: { value: 10, message: "Máximo 10 caracteres." },
                                    pattern: { value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ]+$/, message: "Solo letras permitidas (sin espacios)." },
                                    validate: val => val.trim().length > 0 || "No puede estar vacío."
                                })}
                            />
                            {errors.titulo && <p className="text-red-600 text-xs italic">{errors.titulo.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Descripción</label>
                            <textarea
                                placeholder="Ingresa la descripción de forma general como características del inmueble, mobiliario, etc."
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("descripcion", { 
                                    required: "La descripción es obligatoria.",
                                    maxLength: { value: 20, message: "Máximo 20 caracteres." },
                                    validate: val => val.trim().length > 0 || "No puede estar vacío."
                                })}
                            />
                            {errors.descripcion && <p className="text-red-600 text-xs italic">{errors.descripcion.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Dirección</label>
                            <input
                                type="text"
                                placeholder="Ingresar dirección"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("direccion", { 
                                    required: "La dirección es obligatoria.",
                                    maxLength: { value: 15, message: "Máximo 15 caracteres." },
                                    validate: val => val.trim().length > 0 || "No puede estar vacío."
                                })}
                            />
                            {errors.direccion && <p className="text-red-600 text-xs italic">{errors.direccion.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Referencia</label>
                            <input
                                type="text"
                                placeholder="Ingresar referencia del lugar"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("referencia", { 
                                    required: "La referencia es obligatoria.",
                                    maxLength: { value: 15, message: "Máximo 15 caracteres." },
                                    validate: val => val.trim().length > 0 || "No puede estar vacío."
                                })}
                            />
                            {errors.referencia && <p className="text-red-600 text-xs italic">{errors.referencia.message}</p>}
                        </div>

                        <input type="hidden" {...register("ciudad")} />

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Categoría</label>
                            <select
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                defaultValue=""
                                {...register("categoria", {
                                    required: "Debes seleccionar una categoría.",
                                    validate: (v) => ["departamento", "suit"].includes(String(v)) || "Categoría inválida.",
                                })}
                            >
                                <option value="" disabled>Seleccionar categoría...</option>
                                <option value="departamento">Departamento</option>
                                <option value="suit">Suite</option>
                            </select>
                            {errors.categoria && <p className="text-red-600 text-xs italic">{errors.categoria.message}</p>}
                        </div>

                        <input
                            type="hidden"
                            {...register("urlMapa", {
                                required: "Debes seleccionar la ubicacion en el mapa.",
                                validate: (value) => {
                                    if (!String(value || "").includes("openstreetmap.org")) {
                                        return "No se pudo guardar la ubicacion del mapa.";
                                    }

                                    const coords = extractMarkerCoordinates(value);
                                    if (!coords || !isWithinEpnBounds(coords[0], coords[1])) {
                                        return "La ubicacion debe estar dentro de la zona aledaña a la EPN.";
                                    }

                                    return true;
                                },
                            })}
                        />

                        <div className="mt-5">
                            <label className="mb-2 block text-sm font-semibold">Seleccionar punto en el mapa</label>
                            <div className="rounded-md border border-gray-300 overflow-hidden">
                                <MapContainer
                                    key={selectedPoint ? `${selectedPoint[0]}-${selectedPoint[1]}` : "default-center"}
                                    center={selectedPoint || DEFAULT_CENTER}
                                    zoom={15}
                                    minZoom={MAP_MIN_ZOOM}
                                    maxZoom={MAP_MAX_ZOOM}
                                    maxBounds={EPN_MAX_BOUNDS}
                                    maxBoundsViscosity={1.0}
                                    style={{ height: "280px", width: "100%" }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapClickSelector />
                                    {selectedPoint && (
                                        <CircleMarker center={selectedPoint} radius={8} pathOptions={{ color: "#1d4ed8" }} />
                                    )}
                                </MapContainer>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Haz clic en el mapa para guardar la ubicacion del lugar (zona aledaña a la EPN).
                            </p>
                            {errors.urlMapa && <p className="text-red-600 text-xs italic mt-2">{errors.urlMapa.message}</p>}
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Precio mensual</label>
                            <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("precioMensual", { 
                                required: "El precio mensual es obligatorio.", 
                                min: { value: 0, message: "Mínimo 0." },
                                max: { value: 999, message: "Máximo 3 cifras (999)." }
                            })} />
                            {errors.precioMensual && <p className="mt-1 text-xs text-red-600">{errors.precioMensual.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Número de habitaciones</label>
                            <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("numeroHabitaciones", { 
                                required: "Este campo es obligatorio.", 
                                min: { value: 1, message: "Debe haber al menos 1." },
                                max: { value: 10, message: "Máximo 10." }
                            })} />
                            {errors.numeroHabitaciones && <p className="mt-1 text-xs text-red-600">{errors.numeroHabitaciones.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Número de baños</label>
                            <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("numeroBanos", { 
                                required: "Este campo es obligatorio.", 
                                min: { value: 1, message: "Debe haber al menos 1." },
                                max: { value: 10, message: "Máximo 10." }
                            })} />
                            {errors.numeroBanos && <p className="mt-1 text-xs text-red-600">{errors.numeroBanos.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Parqueadero</label>
                            <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="true" {...register("parqueadero", { required: "Debes indicar si tiene parqueadero.", validate: (value) => ["true", "false"].includes(String(value)) || "Selecciona una opción válida." })} />Sí</label>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="false" {...register("parqueadero", { required: "Debes indicar si tiene parqueadero.", validate: (value) => ["true", "false"].includes(String(value)) || "Selecciona una opción válida." })} />No</label>
                            </div>
                            {errors.parqueadero && <p className="mt-1 text-xs text-red-600">{errors.parqueadero.message}</p>}
                        </div>

                        {tieneParqueadero && (
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Número de parqueaderos</label>
                                <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("numParqueaderos", { 
                                    required: tieneParqueadero ? "Indica cuántos parqueaderos tiene." : false, 
                                    min: { value: 1, message: "Debe ser al menos 1." },
                                    max: { value: 10, message: "Máximo 10." }
                                })} />
                                {errors.numParqueaderos && <p className="mt-1 text-xs text-red-600">{errors.numParqueaderos.message}</p>}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Bodega</label>
                            <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="true" {...register("bodega", { required: "Debes indicar si tiene bodega.", validate: (value) => ["true", "false"].includes(String(value)) || "Selecciona una opción válida." })} />Sí</label>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="false" {...register("bodega", { required: "Debes indicar si tiene bodega.", validate: (value) => ["true", "false"].includes(String(value)) || "Selecciona una opción válida." })} />No</label>
                            </div>
                            {errors.bodega && <p className="mt-1 text-xs text-red-600">{errors.bodega.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Guardianía</label>
                            <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="true" {...register("guardiania", { required: "Indica si cuenta con guardianía." })} />Sí</label>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="false" {...register("guardiania", { required: "Indica si cuenta con guardianía." })} />No</label>
                            </div>
                            {errors.guardiania && <p className="mt-1 text-xs text-red-600">{errors.guardiania.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Alicuota</label>
                            <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="true" {...register("alicuota", { required: "Indica si aplica alícuota." })} />Sí</label>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="false" {...register("alicuota", { required: "Indica si aplica alícuota." })} />No</label>
                            </div>
                            {errors.alicuota && <p className="mt-1 text-xs text-red-600">{errors.alicuota.message}</p>}
                        </div>

                        {alicuotaActiva && (
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Monto alícuota</label>
                                <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("alicoutaMonto", { 
                                    required: alicuotaActiva ? "Debes indicar el monto de alícuota." : false, 
                                    min: { value: 0, message: "Mínimo 0." },
                                    max: { value: 999, message: "Máximo 3 cifras (999)." }
                                })} />
                                {errors.alicoutaMonto && <p className="mt-1 text-xs text-red-600">{errors.alicoutaMonto.message}</p>}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Mascotas</label>
                            <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="true" {...register("mascotas", { required: "Indica si se permiten mascotas." })} />Sí</label>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="false" {...register("mascotas", { required: "Indica si se permiten mascotas." })} />No</label>
                            </div>
                            {errors.mascotas && <p className="mt-1 text-xs text-red-600">{errors.mascotas.message}</p>}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <>
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold">Imágenes de la residencia (máximo 4)</label>
                                            <input
                                                type="file"
                                                multiple
                                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                                {...register("imagen", {
                                                    validate: () => (selectedImages.length > 0 && selectedImages.length <= 4) || "Sube entre 1 y 4 imágenes.",
                                                    onChange: (e) => {
                                                        const newFiles = Array.from(e.target.files || []);
                                                        if (!newFiles.length) return;

                                                        if (selectedImages.length + newFiles.length > 4) {
                                                            toast.warn("Solo se permiten hasta 4 imágenes.");
                                                            e.target.value = "";
                                                            return;
                                                        }

                                                        setSelectedImages((prev) => {
                                                            const merged = [...prev, ...newFiles];
                                                            setValue("imagen", merged, { shouldValidate: true });
                                                            return merged;
                                                        });
                                                        clearErrors("imagen");

                                                        // Permite volver a abrir el selector y agregar más archivos sin perder los anteriores.
                                                        e.target.value = "";
                                                    },
                                                })}
                                            />
                                            {errors.imagen && <p className="text-red-600 text-xs italic">{errors.imagen.message}</p>}
                                            
                                            {/* Preview de imágenes */}
                                            {selectedImages.length > 0 && (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                                                    {selectedImages.map((file, idx) => (
                                                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                                            <img src={URL.createObjectURL(file)} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeImage(idx)}
                                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedImages.length > 0 && (
                                                <p className="text-xs text-slate-500 mt-2 mb-5">
                                                    {selectedImages.length} de 4 imagen(es) seleccionada(s)
                                                </p>
                                            )}
                                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Servicios incluidos</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" value="agua" {...register("servicios")} />
                                    Agua
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" value="luz" {...register("servicios")} />
                                    Luz
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" value="internet" {...register("servicios")} />
                                    Internet
                                </label>
                            </div>
                        </div>
                    </>
                )}

                {step === 4 && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Resumen</h3>
                            <p className="text-sm text-slate-700 mb-4">Revisa la información antes de guardar. Solo se mostrarán los campos seleccionados.</p>
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                                <div>
                                    <div className="font-semibold">Título</div>
                                    <div className="mt-1 text-slate-600">{values.titulo || '-'}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Precio</div>
                                    <div className="mt-1 text-slate-600">${values.precioMensual || '0'}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Habitaciones</div>
                                    <div className="mt-1 text-slate-600">{values.numeroHabitaciones || '-'}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Baños</div>
                                    <div className="mt-1 text-slate-600">{values.numeroBanos || '-'}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Parqueadero</div>
                                    <div className="mt-1 text-slate-600">{values.parqueadero === 'true' ? 'Sí' : values.parqueadero === 'false' ? 'No' : '-'}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Bodega</div>
                                    <div className="mt-1 text-slate-600">{values.bodega === 'true' ? 'Sí' : values.bodega === 'false' ? 'No' : '-'}</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="font-semibold">Descripción</div>
                                    <div className="mt-1 text-slate-600">{values.descripcion || '-'}</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="font-semibold">Servicios</div>
                                    <div className="mt-1 text-slate-600">{Array.isArray(values.servicios) && values.servicios.length ? values.servicios.join(', ') : 'Sin servicios seleccionados'}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Dirección</div>
                                    <div className="mt-1 text-slate-600">{values.direccion || '-'}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Referencia</div>
                                    <div className="mt-1 text-slate-600">{values.referencia || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Detalles adicionales</h3>
                            <div className="text-sm text-slate-700 space-y-3">
                                <div><span className="font-semibold">Ciudad:</span> <span className="text-slate-600">{values.ciudad || '-'}</span></div>
                                <div><span className="font-semibold">Alícuota:</span> <span className="text-slate-600">{values.alicuota === 'true' ? `Sí${values.alicuota === 'true' && values.alicoutaMonto ? ` (Monto: ${values.alicoutaMonto})` : ''}` : values.alicuota === 'false' ? 'No' : '-'}</span></div>
                                <div><span className="font-semibold">Mascotas:</span> <span className="text-slate-600">{values.mascotas === 'true' ? 'Sí' : values.mascotas === 'false' ? 'No' : '-'}</span></div>
                                <div><span className="font-semibold">Guardianía:</span> <span className="text-slate-600">{values.guardiania === 'true' ? 'Sí' : values.guardiania === 'false' ? 'No' : '-'}</span></div>
                                <div><span className="font-semibold"># Imágenes seleccionadas:</span> <span className="text-slate-600">{selectedImages.length}</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </fieldset>

            <div className="flex items-center justify-between mt-6 gap-4">
                <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={step === 1}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Anterior
                </button>

                {step < totalSteps ? (
                    <button
                        type="button"
                        onClick={handleNextStep}
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-slate-100 uppercase font-bold hover:bg-slate-700 transition-all"
                    >
                        Siguiente
                    </button>
                ) : (
                    <input
                        type="submit"
                        value={isSubmitting ? "Guardando..." : "Guardar registro"}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-xl bg-blue-700 px-5 py-2.5 text-white uppercase font-bold transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-700"
                    />
                )}
            </div>
        </form>
    );
};