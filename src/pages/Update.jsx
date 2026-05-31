import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import useFetch from "../hooks/useFetch";
import storeAuth from "../context/storeAuth";
import { Marker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

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
    const [step, setStep] = useState(1);

    const {
        register,
        handleSubmit,
        reset,
        trigger,
        setValue,
        clearErrors,
        watch,
        setError,
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
            metodoPago: {
                tipoBanco: "",
                cuentaBancaria: "",
                numeroCedula: ""
            }
        },
    });

    const values = watch();
    const alicuotaActiva = values.alicuota === "true";
    const tieneParqueadero = values.parqueadero === "true";
    const currentMapUrl = values.urlMapa;
    const [selectedPoint, setSelectedPoint] = useState(null);
    const getValueByPath = (object, path) => {
        if (!object || !path) return undefined;
        return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);
    };
    const resolveNumParqueaderos = (source) => {
        const valor = source?.numParqueaderos ?? source?.numeroParqueaderos ?? source?.parqueaderos;
        return valor !== undefined && valor !== null && String(valor).trim() !== "" ? String(valor) : "";
    };
    const resolveAlicuotaMonto = (source) => {
        const valor = source?.alicoutaMonto ?? source?.montoAlicuota ?? source?.montoAlicuota;
        return valor !== undefined && valor !== null && String(valor).trim() !== "" ? String(valor) : "";
    };
    const resolveMetodoPago = (source) => {
        const raw = source?.metodoPago;
        if (raw && typeof raw === "object") {
            return {
                tipoBanco: raw?.tipoBanco || raw?.banco || "",
                cuentaBancaria: raw?.cuentaBancaria || raw?.numeroCuenta || "",
                numeroCedula: raw?.numeroCedula || raw?.cedula || "",
            };
        }

        if (typeof raw === "string") {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    return {
                        tipoBanco: parsed?.tipoBanco || parsed?.banco || "",
                        cuentaBancaria: parsed?.cuentaBancaria || parsed?.numeroCuenta || "",
                        numeroCedula: parsed?.numeroCedula || parsed?.cedula || "",
                    };
                }
            } catch {
                // Si no es JSON válido, seguir con los campos planos
            }
        }

        return {
            tipoBanco: source?.tipoBanco || source?.banco || "",
            cuentaBancaria: source?.cuentaBancaria || source?.numeroCuenta || "",
            numeroCedula: source?.numeroCedula || source?.cedula || "",
        };
    };
    const cambios = useMemo(() => {
        const fieldLabels = {
            titulo: 'Título',
            descripcion: 'Descripción',
            precioMensual: 'Cuota mensual',
            numeroHabitaciones: 'Número de habitaciones',
            numeroBanos: 'Número de baños',
            serviciosIncluidos: 'Servicios incluidos',
            alicuota: 'Alícuota',
            alicoutaMonto: 'Monto alícuota',
            mascotas: 'Mascotas',
            urlMapa: 'Ubicación (mapa)',
            referencia: 'Referencia',
            bodega: 'Bodega',
            parqueadero: 'Parqueadero',
            numParqueaderos: 'Número de parqueaderos',
            guardiania: 'Guardianía',
            'metodoPago.tipoBanco': 'Tipo de banco',
            'metodoPago.cuentaBancaria': 'Cuenta bancaria',
            'metodoPago.numeroCedula': 'Cédula método de pago',
        };
        if (!departamento) return {};
        const fields = [
            'titulo','descripcion','precioMensual','numeroHabitaciones','numeroBanos','serviciosIncluidos',
            'alicuota','alicoutaMonto','mascotas','urlMapa','referencia','bodega','parqueadero','numParqueaderos','guardiania'
        ];
        fields.push('metodoPago.tipoBanco', 'metodoPago.cuentaBancaria', 'metodoPago.numeroCedula');

        const normalize = (key, val) => {
            if (key === 'precioMensual' || key === 'numeroHabitaciones' || key === 'numeroBanos' || key === 'alicoutaMonto' || key === 'numParqueaderos') {
                return Number(val || 0);
            }
            if (key === 'alicuota' || key === 'mascotas' || key === 'bodega' || key === 'parqueadero' || key === 'guardiania') {
                // compare as booleans
                return String(val) === 'true';
            }
            if (key === 'serviciosIncluidos') {
                const arr = Array.isArray(val) ? val.map(String) : (val ? [String(val)] : []);
                return arr.map(s=>s.trim()).filter(Boolean).sort().join('|');
            }
            return String(val || '').trim();
        };

        const result = {};
        fields.forEach((f) => {
            const oldRaw = getValueByPath(departamento, f);
            const newRaw = getValueByPath(values, f);
            const oldN = normalize(f, oldRaw);
            const newN = normalize(f, newRaw);
            if (oldN !== newN) {
                // human-friendly display
                let displayOld;
                let displayNew;
                if (f === 'serviciosIncluidos') {
                    displayOld = Array.isArray(oldRaw) ? oldRaw.join(', ') : (oldRaw || '-');
                    displayNew = Array.isArray(newRaw) ? newRaw.join(', ') : (newRaw || '-');
                } else if (['alicuota','mascotas','bodega','parqueadero','guardiania'].includes(f)) {
                    displayOld = oldRaw ? 'Sí' : 'No';
                    displayNew = String(newRaw) === 'true' || newRaw === true ? 'Sí' : 'No';
                } else if (['precioMensual','numeroHabitaciones','numeroBanos','alicoutaMonto','numParqueaderos'].includes(f)) {
                    displayOld = (oldRaw !== undefined && oldRaw !== null && oldRaw !== '') ? String(oldRaw) : '-';
                    displayNew = (newRaw !== undefined && newRaw !== null && newRaw !== '') ? String(newRaw) : '-';
                } else {
                    displayOld = String(oldRaw ?? '-') || '-';
                    displayNew = String(newRaw ?? '-') || '-';
                }

                result[f] = { before: displayOld, after: displayNew, label: fieldLabels[f] || f };
            }
        });
        return result;
    }, [departamento, values]);
    const totalSteps = 4;
    const getFieldsForStep = (currentStep) => {
        if (currentStep === 1) {
            return ["titulo", "descripcion", "referencia", "urlMapa"];
        }

        if (currentStep === 2) {
            return [
                "numeroHabitaciones",
                "numeroBanos",
                "parqueadero",
                ...(tieneParqueadero ? ["numParqueaderos"] : []),
                "bodega",
                "guardiania",
                "mascotas",
            ];
        }

        if (currentStep === 3) {
            return ["serviciosIncluidos"];
        }

        if (currentStep === 4) {
            return [
                "precioMensual",
                "alicuota",
                ...(alicuotaActiva ? ["alicoutaMonto"] : []),
                "metodoPago.tipoBanco",
                "metodoPago.cuentaBancaria",
                "metodoPago.numeroCedula",
            ];
        }

        return [];
    };

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
                alicoutaMonto: resolveAlicuotaMonto(departamento),
                mascotas: String(departamento?.mascotas ?? false),
                urlMapa: departamento?.urlMapa || "",
                referencia: departamento?.referencia || "",
                bodega: String(departamento?.bodega ?? false),
                parqueadero: String(departamento?.parqueadero ?? false),
                numParqueaderos: resolveNumParqueaderos(departamento),
                guardiania: String(departamento?.guardiania ?? false),
                metodoPago: resolveMetodoPago(departamento)
            });
            // Asegurar que el campo numParqueaderos tenga el valor correcto en el formulario
            setValue("numParqueaderos", resolveNumParqueaderos(departamento), { shouldDirty: false, shouldValidate: true });
            setValue("alicoutaMonto", resolveAlicuotaMonto(departamento), { shouldDirty: false, shouldValidate: true });
            setCargando(false);
        }
    }, [departamento, fetchDataBackend, id, reset, token, setValue]);

    useEffect(() => {
        const coords = extractMarkerCoordinates(currentMapUrl);
        if (coords && isWithinEpnBounds(coords[0], coords[1])) {
            setSelectedPoint(coords);
            return;
        }

        setSelectedPoint(null);
    }, [currentMapUrl]);

    useEffect(() => {
        if (!cargando && departamento && !tieneParqueadero) {
            setValue("numParqueaderos", resolveNumParqueaderos(departamento), { shouldValidate: true });
        }
    }, [tieneParqueadero, setValue, cargando, departamento]);

    useEffect(() => {
        if (!cargando && departamento && !alicuotaActiva) {
            setValue("alicoutaMonto", resolveAlicuotaMonto(departamento), { shouldValidate: true });
        }
    }, [alicuotaActiva, setValue, cargando, departamento]);

    const handleNextStep = async () => {
        const fields = getFieldsForStep(step);
        if (fields?.length) {
            const canContinue = await trigger(fields);
            if (!canContinue) {
                toast.error("Completa los campos obligatorios antes de continuar.");
                return;
            }
        }

        if (step === 1) {
            const tituloActual = String(values.titulo || "").trim();
            const tituloOriginal = String(departamento?.titulo || "").trim();
            const tituloNormalizado = tituloActual.toLowerCase();

            if (tituloActual && tituloNormalizado !== tituloOriginal.toLowerCase()) {
                try {
                    const storedUser = JSON.parse(localStorage.getItem("auth-token") || "null");
                    const authToken = token || storedUser?.state?.token || null;
                    const headers = { "Content-Type": "application/json" };
                    if (authToken) headers.Authorization = `Bearer ${authToken}`;

                    const url = `${import.meta.env.VITE_BACKEND_URL}/departamentos`;
                    const response = await fetchDataBackend(url, null, "GET", headers);
                    const lista = Array.isArray(response)
                        ? response
                        : Array.isArray(response?.data)
                            ? response.data
                            : [];

                    const existeTitulo = lista.some((dep) => {
                        const tituloDep = String(dep?.titulo || "").trim().toLowerCase();
                        const idDep = dep?._id || dep?.id;
                        if (!tituloDep) return false;
                        if (String(idDep || "") === String(departamento?._id || id || "")) return false;
                        return tituloDep === tituloNormalizado;
                    });

                    if (existeTitulo) {
                        setError("titulo", {
                            type: "validate",
                            message: "Ya existe una residencia con ese título.",
                        });
                        toast.warn("Ya existe una residencia con ese título.");
                        return;
                    }
                } catch (error) {
                    const status = error?.response?.status || error?.status || null;
                    if (status === 401 || status === 403) {
                        setError("titulo", {
                            type: "validate",
                            message: "Acceso denegado. Por favor inicia sesión nuevamente.",
                        });
                        toast.error("Acceso denegado. Por favor inicia sesión nuevamente.");
                        return;
                    }

                    console.warn("No se pudo verificar si el título ya existe:", error);
                }
            }
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

        // Construir payload y asegurar que numParqueaderos respete el valor existente si el campo está vacío
        const calcularNumParqueaderos = () => {
            if (String(data.parqueadero) === "true") {
                // Si el campo del formulario tiene un valor válido (no vacío), úsalo
                const raw = data.numParqueaderos;
                if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
                    const n = Number(raw);
                    return Number.isFinite(n) ? n : (Number(departamento?.numParqueaderos) || 0);
                }
                // Si el formulario dejó el campo vacío, mantener el valor actual del departamento si existe
                return Number.isFinite(Number(departamento?.numParqueaderos)) ? Number(departamento.numParqueaderos) : 0;
            }
            return 0;
        };

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
            numParqueaderos: calcularNumParqueaderos(),
            guardiania: String(data.guardiania) === "true",
            metodoPago: {
                tipoBanco: data.metodoPago.tipoBanco,
                cuentaBancaria: data.metodoPago.cuentaBancaria,
                numeroCedula: data.metodoPago.numeroCedula,
            }
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
                    ← Regresar
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
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Actualizar departamento</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Ajusta la información y revisa cada bloque antes de guardar.
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

            <div className="mb-8">
                <div className="flex items-center justify-between gap-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="flex items-center flex-1">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${n <= step ? "bg-blue-700 border-blue-700 text-white" : "bg-white border-slate-300 text-slate-500"}`}>
                                {n}
                            </div>
                            {n < 6 && (
                                <div className={`h-1 flex-1 mx-2 rounded ${n < step ? "bg-blue-700" : "bg-slate-200"}`} />
                            )}
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-sm text-slate-500">Paso {step} de {totalSteps}</p>
            </div>

            <form onSubmit={handleSubmit(guardarCambios)}>
                <fieldset className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <legend className="rounded-full bg-white px-4 py-1 text-lg font-bold text-slate-800 shadow-sm">
                        {step === 1 && "Información básica"}
                        {step === 2 && "Ubicación"}
                        {step === 3 && "Características"}
                        {step === 4 && "Costos y Pago"}
                        {step === 5 && "Imágenes"}
                        {step === 6 && "Confirmación"}
                    </legend>

                    {step === 1 && (
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Título</label>
                                <input type="text" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("titulo", { 
                                    required: "El título es obligatorio.",
                                    maxLength: { value: 30, message: "Máximo 30 caracteres." },
                                    pattern: { value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, message: "Solo letras y espacios permitidos." },
                                    validate: val => val.trim().length > 0 || "No puede estar vacío."
                                })} />
                                {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción</label>
                                <textarea rows="4" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("descripcion", { 
                                    required: "La descripción es obligatoria.",
                                    maxLength: { value: 60, message: "Máximo 60 caracteres." },
                                    validate: val => val.trim().length > 0 || "No puede estar vacío."
                                })} />
                                {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p>}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Referencia</label>
                                <input type="text" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("referencia", {
                                    maxLength: { value: 20, message: "Máximo 20 caracteres." },
                                    validate: val => !val || val.trim().length > 0 || "No puede consistir solo de espacios."
                                })} />
                                {errors.referencia && <p className="mt-1 text-xs text-red-600">{errors.referencia.message}</p>}
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
                                            <Marker position={selectedPoint} icon={redPinIcon} />
                                        )}
                                    </MapContainer>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Haz clic en el mapa para guardar la ubicación del lugar.</p>
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
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Número de habitaciones</label>
                                <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("numeroHabitaciones", { 
                                    required: "Este campo es obligatorio.", 
                                    min: { value: 1, message: "Mínimo 1." },
                                    max: { value: 10, message: "Máximo 10." }
                                })} />
                                {errors.numeroHabitaciones && <p className="mt-1 text-xs text-red-600">{errors.numeroHabitaciones.message}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Número de baños</label>
                                <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("numeroBanos", { 
                                    required: "Este campo es obligatorio.", 
                                    min: { value: 1, message: "Mínimo 1." },
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
                                        min: { value: 1, message: "Mínimo 1." },
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
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Mascotas</label>
                                <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="true" {...register("mascotas", { required: "Indica si se permiten mascotas." })} />Sí</label>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" value="false" {...register("mascotas", { required: "Indica si se permiten mascotas." })} />No</label>
                                </div>
                                {errors.mascotas && <p className="mt-1 text-xs text-red-600">{errors.mascotas.message}</p>}
                            </div>

                            <div className="md:col-span-2 lg:col-span-3">
                                <h2 className="text-sm font-bold text-slate-700 mb-2">Servicios incluidos</h2>
                                <div className="flex flex-wrap gap-4">
                                    {servicioOptions.map((servicio) => (
                                        <label key={servicio.value} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                                            <input type="checkbox" value={servicio.label} {...register("serviciosIncluidos", { validate: (v) => v.length > 0 || "Selecciona al menos uno." })} />
                                            {servicio.label}
                                        </label>
                                    ))}
                                </div>
                                {errors.serviciosIncluidos && <p className="mt-2 text-xs text-red-600">{errors.serviciosIncluidos.message}</p>}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-5">
                                <h3 className="text-sm font-bold uppercase text-slate-700">Cargos mensuales</h3>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Cuota mensual</label>
                                    <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" {...register("precioMensual", { required: "Obligatorio.", min: 1 })} />
                                    {errors.precioMensual && <p className="mt-1 text-xs text-red-600">{errors.precioMensual.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold">Alícuota</label>
                                        <div className="flex gap-4 rounded-xl border border-slate-300 bg-white px-4 py-3">
                                            <label className="inline-flex items-center gap-2 text-xs"><input type="radio" value="true" {...register("alicuota")} />Sí</label>
                                            <label className="inline-flex items-center gap-2 text-xs"><input type="radio" value="false" {...register("alicuota")} />No</label>
                                        </div>
                                    </div>
                                    {alicuotaActiva && (
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold">Monto de alícuota</label>
                                            <input type="number" className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" {...register("alicoutaMonto", { required: alicuotaActiva, min: 1 })} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-700 uppercase">Método de pago</h3>
                                <input type="text" placeholder="Tipo de banco" maxLength={40} className="block w-full rounded-xl border border-slate-300 px-4 py-2 text-sm" {...register("metodoPago.tipoBanco", { required: "Obligatorio", maxLength: { value: 40, message: "Máximo 40 caracteres." } })} />
                                <input type="text" placeholder="Número de cuenta" maxLength={20} className="block w-full rounded-xl border border-slate-300 px-4 py-2 text-sm" {...register("metodoPago.cuentaBancaria", { required: "Obligatorio", maxLength: { value: 20, message: "Máximo 20 caracteres." } })} />
                                <input type="text" placeholder="Cédula" maxLength={15} className="block w-full rounded-xl border border-slate-300 px-4 py-2 text-sm" {...register("metodoPago.numeroCedula", { required: "Obligatorio", maxLength: { value: 15, message: "Máximo 15 caracteres." } })} />
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="text-center py-10">
                            <p className="text-slate-500 italic">La actualización de imágenes se realiza desde el visor de detalles.</p>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cambios detectados</p>
                                {Object.keys(cambios).length === 0 ? (
                                    <p className="mt-2 text-sm text-slate-600">No hay cambios para guardar.</p>
                                ) : (
                                    <div className="mt-3 grid gap-2">
                                        {Object.entries(cambios).map(([key, val]) => (
                                            <div key={key} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3">
                                                <div className="text-sm text-slate-700">{val.label || key}</div>
                                                <div className="text-sm text-slate-600 text-right">
                                                    <div><span className="text-slate-400">Antes:</span> {val.before}</div>
                                                    <div><span className="text-slate-400">Ahora:</span> {val.after}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Resumen rápido</p>
                                    <p className="mt-2 text-lg font-bold text-slate-900">{Object.keys(cambios).length} cambio(s)</p>
                                    {Object.keys(cambios).length > 0 && (
                                        <ul className="mt-3 text-sm text-slate-600 list-disc list-inside">
                                            {Object.values(cambios).map((c, i) => (
                                                <li key={i}>{c.label || Object.keys(cambios)[i]}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <p className="md:col-span-2 xl:col-span-3 text-sm text-slate-500">Si todo está correcto, presiona &quot;Guardar cambios&quot;.</p>
                        </div>
                    )}
                </fieldset>

                <div className="mt-6 flex items-center justify-between gap-4">
                    <button type="button" onClick={handlePreviousStep} disabled={step === 1} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
                    {step < totalSteps ? (
                        <button type="button" onClick={handleNextStep} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-slate-100 transition-colors hover:bg-slate-700">Siguiente</button>
                    ) : (
                        <input type="submit" value={isSubmitting ? "Guardando..." : "Guardar cambios"} disabled={isSubmitting || Object.keys(cambios).length === 0} className="cursor-pointer rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" />
                    )}
                </div>
            </form>
        </div>
    );
};

export default Update;