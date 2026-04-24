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
        formState: { errors, isSubmitting },
    } = useForm();
    const { fetchDataBackend } = useFetch();

    const { user, token } = storeAuth();

    const values = watch();
    const currentMapUrl = watch("urlMapa");
    const [selectedPoint, setSelectedPoint] = useState(null);

    useEffect(() => {
        const coords = extractMarkerCoordinates(currentMapUrl);
        if (coords && isWithinEpnBounds(coords[0], coords[1])) {
            setSelectedPoint(coords);
            return;
        }

        setSelectedPoint(null);
    }, [currentMapUrl]);

    const stepFields = {
        1: ["titulo", "descripcion", "direccion", "urlMapa"],
        2: ["precioMensual", "numeroHabitaciones", "numeroBanos", "parqueadero"],
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

        setStep((prev) => Math.min(prev + 1, totalSteps));
    };

    const handlePreviousStep = () => {
        setStep((prev) => Math.max(prev - 1, 1));
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

        const serviciosNormalizados = serviciosSeleccionados
            .map((serv) => String(serv).trim().toLowerCase())
            .filter(Boolean);

        if (!serviciosNormalizados.length) {
            toast.error("Debes seleccionar al menos un servicio.");
            return;
        }

        if (!selectedImages.length) {
            toast.error("Debes subir al menos una imagen.");
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
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex items-center flex-1">
                            <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                    n <= step
                                        ? "bg-blue-700 border-blue-700 text-white"
                                        : "bg-white border-gray-300 text-gray-500"
                                }`}
                            >
                                {n}
                            </div>
                            {n < 4 && (
                                <div
                                    className={`h-1 flex-1 mx-2 rounded ${
                                        n < step ? "bg-blue-700" : "bg-gray-200"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-sm text-gray-500">Paso {step} de {totalSteps}</p>
            </div>

            <fieldset className="border-2 border-gray-500 p-6 rounded-lg shadow-lg">
                <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">
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
                                {...register("titulo", { required: "El título es obligatorio." })}
                            />
                            {errors.titulo && <p className="text-red-500 text-xs italic">{errors.titulo.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Descripción</label>
                            <textarea
                                placeholder="Ingresa la descripción de forma general"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("descripcion", { required: "La descripción es obligatoria." })}
                            />
                            {errors.descripcion && <p className="text-red-500 text-xs italic">{errors.descripcion.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Dirección</label>
                            <input
                                type="text"
                                placeholder="Ingresar dirección"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("direccion", { required: "La dirección es obligatoria." })}
                            />
                            {errors.direccion && <p className="text-red-500 text-xs italic">{errors.direccion.message}</p>}
                        </div>

                        <input type="hidden" {...register("ciudad")} />

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
                            {errors.urlMapa && <p className="text-red-500 text-xs italic mt-2">{errors.urlMapa.message}</p>}
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div>
                            <label className="mb-2 block text-sm font-semibold">Precio mensual</label>
                            <input
                                type="number"
                                placeholder="Ingresar precio mensual"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("precioMensual", {
                                    required: "El precio mensual es obligatorio.",
                                    min: { value: 0, message: "El precio no puede ser negativo." },
                                })}
                            />
                            {errors.precioMensual && <p className="text-red-500 text-xs italic">{errors.precioMensual.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Número de habitaciones</label>
                            <input
                                type="number"
                                placeholder="Ingrese el número de habitaciones"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("numeroHabitaciones", {
                                    required: "El número de habitaciones es obligatorio.",
                                    min: { value: 1, message: "Debe haber al menos 1 habitación." },
                                })}
                            />
                            {errors.numeroHabitaciones && <p className="text-red-500 text-xs italic">{errors.numeroHabitaciones.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Número de baños</label>
                            <input
                                type="number"
                                placeholder="Ingrese el número de baños"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                                {...register("numeroBanos", {
                                    required: "El número de baños es obligatorio.",
                                    min: { value: 1, message: "Debe haber al menos 1 baño." },
                                })}
                            />
                            {errors.numeroBanos && <p className="text-red-500 text-xs italic">{errors.numeroBanos.message}</p>}
                        </div>

                        <div className="mt-5">
                            <label className="mb-2 block text-sm font-semibold">Parqueadero</label>
                            <select
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                                defaultValue=""
                                {...register("parqueadero", {
                                    required: "Debes indicar si tiene parqueadero.",
                                    validate: (value) =>
                                        ["true", "false"].includes(String(value)) ||
                                        "Selecciona una opción válida.",
                                })}
                            >
                                <option value="" disabled>Seleccionar...</option>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                            </select>
                            {errors.parqueadero && <p className="text-red-500 text-xs italic">{errors.parqueadero.message}</p>}
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div>
                            <label className="mb-2 block text-sm font-semibold">Imágenes de la residencia</label>
                            <input
                                type="file"
                                multiple
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                {...register("imagen", {
                                    validate: () =>
                                        selectedImages.length > 0 || "Debes subir al menos una imagen.",
                                    onChange: (e) => {
                                        const newFiles = Array.from(e.target.files || []);
                                        if (!newFiles.length) return;

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
                            {errors.imagen && <p className="text-red-500 text-xs italic">{errors.imagen.message}</p>}
                            {selectedImages.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {selectedImages.length} imagen(es) seleccionada(s)
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
                    <div className="space-y-3 text-sm text-gray-700">
                        <p><span className="font-semibold">Título:</span> {values.titulo || "-"}</p>
                        <p><span className="font-semibold">Dirección:</span> {values.direccion || "-"}</p>
                        <p><span className="font-semibold">Precio mensual:</span> {values.precioMensual || "-"}</p>
                        <p><span className="font-semibold">Habitaciones:</span> {values.numeroHabitaciones || "-"}</p>
                        <p><span className="font-semibold">Baños:</span> {values.numeroBanos || "-"}</p>
                        <p><span className="font-semibold">Parqueadero:</span> {
                            values.parqueadero === "true"
                                ? "Sí"
                                : values.parqueadero === "false"
                                    ? "No"
                                    : "-"
                        }</p>
                        <p><span className="font-semibold">Servicios:</span> {
                            Array.isArray(values.servicios)
                                ? values.servicios.join(", ")
                                : values.servicios || "-"
                        }</p>
                        <p className="text-gray-500">Si todo es correcto, presiona &quot;Guardar registro&quot;.</p>
                    </div>
                )}
            </fieldset>

            <div className="flex items-center justify-between mt-6 gap-4">
                <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={step === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>

                {step < totalSteps ? (
                    <button
                        type="button"
                        onClick={handleNextStep}
                        className="bg-gray-800 px-5 py-2 text-slate-300 uppercase font-bold rounded-lg hover:bg-gray-600 transition-all"
                    >
                        Siguiente
                    </button>
                ) : (
                    <input
                        type="submit"
                        value={isSubmitting ? "Guardando..." : "Guardar registro"}
                        disabled={isSubmitting}
                        className="bg-blue-700 px-5 py-2 text-white uppercase font-bold rounded-lg hover:bg-blue-600 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-700"
                    />
                )}
            </div>
        </form>
    );
};