import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import useFetch from "../hooks/useFetch";
import storeAuth from "../context/storeAuth";

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
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            titulo: "",
            descripcion: "",
            precioMensual: "",
            numeroHabitaciones: "",
            numeroBanos: "",
            disponible: "true",
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
                        if (typeof item === "string") return item.trim().toLowerCase();
                        if (item && typeof item === "object") {
                            return String(item.nombre || item.name || item.servicio || "").trim().toLowerCase();
                        }
                        return "";
                    })
                    .filter(Boolean);
            }

            if (typeof valor === "string") {
                return valor
                    .split(",")
                    .map((item) => item.trim().toLowerCase())
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
                disponible: String(departamento?.disponible ?? true),
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
            disponible: String(data.disponible) === "true",
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
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Disponible</label>
                        <select
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("disponible", { required: true })}
                        >
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                        </select>
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
                        <label className="mb-2 block text-sm font-semibold text-slate-700">URL del mapa</label>
                        <input
                            type="url"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("urlMapa", { required: "La URL del mapa es obligatoria." })}
                        />
                        {errors.urlMapa && <p className="mt-1 text-xs text-red-600">{errors.urlMapa.message}</p>}
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