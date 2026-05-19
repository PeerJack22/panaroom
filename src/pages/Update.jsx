import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import useFetch from "../hooks/useFetch";
import storeAuth from "../context/storeAuth";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

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

const servicioOptions = [
    { label: "Agua", value: "Agua" },
    { label: "Luz", value: "Luz" },
    { label: "Internet", value: "Internet" },
];

const Update = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { fetchDataBackend } = useFetch();
    const { user, rol, token } = storeAuth();
    const [departamento, setDepartamento] = useState(location.state?.departamento || null);
    const [cargando, setCargando] = useState(!location.state?.departamento);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        clearErrors,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            titulo: "",
            descripcion: "",
            precioMensual: "",
            numeroHabitaciones: "",
            numeroBanos: "",
            serviciosIncluidos: [],
            alicuota: "false",
            alicoutaMonto: "",
            mascotas: "false",
            urlMapa: "",
            referencia: "",
            bodega: "false",
            parqueadero: "false",
            numParqueaderos: "0",
            guardiania: "false",
        },
    });

    const alicuotaActiva = watch("alicuota") === "true";
    const currentMapUrl = watch("urlMapa");
    const [selectedPoint, setSelectedPoint] = useState(null);

    const esPropietario = useMemo(() => {
        const arrendatarioId = typeof departamento?.arrendatario === "object"
            ? (departamento?.arrendatario?._id || departamento?.arrendatario?.id)
            : departamento?.arrendatario;

        return rol === "arrendatario" && String(arrendatarioId || "") === String(user?._id || "");
    }, [departamento, rol, user?._id]);

    useEffect(() => {
        const normalizarServicios = (valor) => {
            if (Array.isArray(valor)) {
                return valor
                    .map((item) => {
                        if (typeof item === "string") {
                            const texto = item.trim().toLowerCase();
                            return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
                        }
                        if (item && typeof item === "object") {
                            const texto = String(item.nombre || item.name || item.servicio || "").trim().toLowerCase();
                            return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
                        }
                        return "";
                    })
                    .filter(Boolean);
            }

            if (typeof valor === "string") {
                return valor
                    .split(",")
                    .map((item) => {
                        const texto = item.trim().toLowerCase();
                        return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
                    })
                    .filter(Boolean);
            }

            return [];
        };

        if (!departamento?.titulo && id) {
            const cargarDepartamento = async () => {
                try {
                    const storedUser = JSON.parse(localStorage.getItem("auth-token"));
                    const headers = {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${storedUser?.state?.token || token || ""}`,
                    };
                    const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/${id}`;
                    const response = await fetchDataBackend(url, null, "GET", headers);
                    const data = response?.data || response;
                    setDepartamento(data || null);
                } catch (error) {
                    console.error("Error al cargar el departamento:", error);
                    toast.error("No se pudo cargar la información del departamento.");
                } finally {
                    setCargando(false);
                }
            };

            cargarDepartamento();
            return;
        }

        if (departamento) {
            reset({
                titulo: departamento?.titulo || "",
                descripcion: departamento?.descripcion || "",
                precioMensual: departamento?.precioMensual ?? "",
                numeroHabitaciones: departamento?.numeroHabitaciones ?? "",
                numeroBanos: departamento?.numeroBanos ?? "",
                serviciosIncluidos: normalizarServicios(departamento?.serviciosIncluidos),
                alicuota: String(departamento?.alicuota ?? false),
                alicoutaMonto: departamento?.alicoutaMonto ?? "",
                mascotas: String(departamento?.mascotas ?? false),
                urlMapa: departamento?.urlMapa || "",
                referencia: departamento?.referencia || "",
                bodega: String(departamento?.bodega ?? false),
                parqueadero: String(departamento?.parqueadero ?? false),
                numParqueaderos: departamento?.numParqueaderos ?? "0",
                guardiania: String(departamento?.guardiania ?? false),
            });
            setCargando(false);
        }
    }, [departamento, fetchDataBackend, id, reset, token]);

    useEffect(() => {
        const coords = extractMarkerCoordinates(currentMapUrl);
        if (coords && isWithinEpnBounds(coords[0], coords[1])) {
            setSelectedPoint(coords);
            return;
        }

        setSelectedPoint(null);
    }, [currentMapUrl]);

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

    const guardarCambios = async (data) => {
        if (!departamento?._id) {
            toast.error("No se pudo identificar el departamento a actualizar.");
            return;
        }

        if (!esPropietario) {
            toast.error("Solo el arrendatario propietario puede actualizar este departamento.");
            return;
        }

        const serviciosSeleccionados = Array.isArray(data.serviciosIncluidos)
            ? data.serviciosIncluidos
            : data.serviciosIncluidos
                ? [data.serviciosIncluidos]
                : [];

        const payload = {
            titulo: String(data.titulo || "").trim(),
            descripcion: String(data.descripcion || "").trim(),
            precioMensual: Number(data.precioMensual) || 0,
            numeroHabitaciones: Number(data.numeroHabitaciones) || 0,
            numeroBanos: Number(data.numeroBanos) || 0,
            serviciosIncluidos: serviciosSeleccionados,
            alicuota: String(data.alicuota) === "true",
            alicoutaMonto: String(data.alicuota) === "true" ? Number(data.alicoutaMonto) || 0 : 0,
            mascotas: String(data.mascotas) === "true",
            urlMapa: String(data.urlMapa || "").trim(),
            referencia: String(data.referencia || "").trim(),
            bodega: String(data.bodega) === "true",
            parqueadero: String(data.parqueadero) === "true",
            numParqueaderos: Number(data.numParqueaderos) || 0,
            guardiania: String(data.guardiania) === "true",
        };

        const loadingToast = toast.loading("Actualizando departamento...");

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/actualizar/${departamento._id}`;
            const response = await axios.put(url, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token || JSON.parse(localStorage.getItem("auth-token"))?.state?.token || ""}`,
                },
            });

            toast.dismiss(loadingToast);
            toast.success(response?.data?.msg || "Departamento actualizado correctamente");
            navigate(`/dashboard/visualizar/${departamento._id}`);
        } catch (error) {
            toast.dismiss(loadingToast);
            const errorMessage =
                error?.response?.data?.msg ||
                error?.response?.data?.message ||
                "No se pudo actualizar el departamento";
            toast.error(errorMessage);
        }
    };

    if (cargando) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-slate-600">Cargando información del departamento...</p>
            </div>
        );
    }

    if (!departamento) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-amber-900">Departamento no encontrado</h1>
                <p className="mt-2 text-amber-800">No se pudo cargar la información para editar.</p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-4 inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                    Regresar
                </button>
            </div>
        );
    }

    if (!esPropietario) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-red-900">Acceso restringido</h1>
                <p className="mt-2 text-red-800">Solo el arrendatario propietario puede editar este departamento.</p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                    Regresar
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Actualizar departamento</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Modifica la información principal y guarda los cambios en el sistema.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                    Regresar
                </button>
            </div>

            <form onSubmit={handleSubmit(guardarCambios)} className="space-y-8">
                <section className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Título</label>
                        <input
                            type="text"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("titulo", { required: "El título es obligatorio." })}
                        />
                        {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción</label>
                        <textarea
                            rows="4"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("descripcion", { required: "La descripción es obligatoria." })}
                        />
                        {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Precio mensual</label>
                        <input
                            type="number"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("precioMensual", {
                                required: "El precio mensual es obligatorio.",
                                min: { value: 0, message: "El precio no puede ser negativo." },
                            })}
                        />
                        {errors.precioMensual && <p className="mt-1 text-xs text-red-600">{errors.precioMensual.message}</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Número de habitaciones</label>
                        <input
                            type="number"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("numeroHabitaciones", {
                                required: "Este campo es obligatorio.",
                                min: { value: 1, message: "Debe haber al menos 1 habitación." },
                            })}
                        />
                        {errors.numeroHabitaciones && <p className="mt-1 text-xs text-red-600">{errors.numeroHabitaciones.message}</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Número de baños</label>
                        <input
                            type="number"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("numeroBanos", {
                                required: "Este campo es obligatorio.",
                                min: { value: 1, message: "Debe haber al menos 1 baño." },
                            })}
                        />
                        {errors.numeroBanos && <p className="mt-1 text-xs text-red-600">{errors.numeroBanos.message}</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Número de parqueaderos</label>
                        <input
                            type="number"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("numParqueaderos")}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Referencia</label>
                        <input
                            type="text"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("referencia")}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Seleccionar punto en el mapa</label>
                        <div className="overflow-hidden rounded-xl border border-slate-300">
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
                        <p className="mt-2 text-xs text-slate-500">
                            Haz clic en el mapa para guardar la ubicación del lugar (zona aledaña a la EPN).
                        </p>
                        <input
                            type="hidden"
                            {...register("urlMapa", {
                                required: "Debes seleccionar la ubicación en el mapa.",
                                validate: (value) => {
                                    if (!String(value || "").includes("openstreetmap.org")) {
                                        return "No se pudo guardar la ubicación del mapa.";
                                    }

                                    const coords = extractMarkerCoordinates(value);
                                    if (!coords || !isWithinEpnBounds(coords[0], coords[1])) {
                                        return "La ubicación debe estar dentro de la zona aledaña a la EPN.";
                                    }

                                    return true;
                                },
                            })}
                        />
                        {errors.urlMapa && <p className="mt-2 text-xs text-red-600">{errors.urlMapa.message}</p>}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h2 className="text-lg font-bold text-slate-900">Servicios incluidos</h2>
                    <div className="mt-4 flex flex-wrap gap-4">
                        {servicioOptions.map((servicio) => (
                            <label key={servicio.value} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                                <input
                                    type="checkbox"
                                    value={servicio.label}
                                    {...register("serviciosIncluidos", {
                                        validate: (value) => {
                                            const seleccionados = Array.isArray(value) ? value : value ? [value] : [];
                                            return seleccionados.length > 0 || "Selecciona al menos un servicio.";
                                        },
                                    })}
                                />
                                {servicio.label}
                            </label>
                        ))}
                    </div>
                    {errors.serviciosIncluidos && <p className="mt-2 text-xs text-red-600">{errors.serviciosIncluidos.message}</p>}
                </section>

                <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Alicuota</label>
                        <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="true" {...register("alicuota", { required: true })} />
                                Sí
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="false" {...register("alicuota", { required: true })} />
                                No
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Mascotas</label>
                        <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="true" {...register("mascotas", { required: true })} />
                                Sí
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="false" {...register("mascotas", { required: true })} />
                                No
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Bodega</label>
                        <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="true" {...register("bodega", { required: true })} />
                                Sí
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="false" {...register("bodega", { required: true })} />
                                No
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Parqueadero</label>
                        <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="true" {...register("parqueadero", { required: true })} />
                                Sí
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="false" {...register("parqueadero", { required: true })} />
                                No
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Guardianía</label>
                        <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="true" {...register("guardiania", { required: true })} />
                                Sí
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" value="false" {...register("guardiania", { required: true })} />
                                No
                            </label>
                        </div>
                    </div>

                    {alicuotaActiva && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Monto de alícuota</label>
                            <input
                                type="number"
                                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                {...register("alicoutaMonto", {
                                    required: "Debes indicar el monto de alícuota.",
                                    min: { value: 0, message: "El monto no puede ser negativo." },
                                })}
                            />
                            {errors.alicoutaMonto && <p className="mt-1 text-xs text-red-600">{errors.alicoutaMonto.message}</p>}
                        </div>
                    )}
                </section>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Update;