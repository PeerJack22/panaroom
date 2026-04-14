import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import storeAuth from "../../context/storeAuth.jsx";

export const Form = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const totalSteps = 4;
    const {
        register,
        handleSubmit,
        trigger,
        watch,
        formState: { errors },
    } = useForm();
    const { fetchDataBackend } = useFetch();

    const { user, token } = storeAuth();

    const values = watch();

    const stepFields = {
        1: ["titulo", "descripcion", "direccion", "ciudad"],
        2: ["precioMensual", "numeroHabitaciones", "numeroBanos"],
        3: ["imagen"],
    };

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

    const registerResidencia = async (data) => {
        if (!user || !user._id) {
            toast.error("Error: ID de usuario no disponible. Por favor, reinicia la sesión.");
            navigate("/login");
            return;
        }

        if (!data.servicios || data.servicios.length === 0) {
            toast.error("Debes seleccionar al menos un servicio.");
            return;
        }

        const formData = new FormData();
        formData.append("arrendatario", user._id);

        Object.keys(data).forEach((key) => {
            if (key === "imagen" && data.imagen.length > 0) {
                // Permitir varias imágenes
                Array.from(data.imagen).forEach((img) => {
                    formData.append("imagenes", img);
                });
            } else if (key === "servicios") {
                data.servicios.forEach((servicio) => {
                    formData.append("serviciosIncluidos[]", servicio);
                });
            } else {
                formData.append(key, data[key]);
            }
        });

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/registro`;
            const headers = {
                Authorization: `Bearer ${token}`,
                // NO pongas "Content-Type": "application/json"
            };
            const response = await fetchDataBackend(url, formData, "POST", headers);
            if (response) {
                toast.success("Residencia registrada exitosamente!");
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

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Ciudad</label>
                            <input
                                type="text"
                                placeholder="Ingresar ciudad"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                                {...register("ciudad", { required: "La ciudad es obligatoria." })}
                            />
                            {errors.ciudad && <p className="text-red-500 text-xs italic">{errors.ciudad.message}</p>}
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
                                {...register("imagen", { required: "Debes subir al menos una imagen." })}
                            />
                            {errors.imagen && <p className="text-red-500 text-xs italic">{errors.imagen.message}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">Servicios incluidos</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" value="Agua" {...register("servicios")} />
                                    Agua
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" value="Luz" {...register("servicios")} />
                                    Luz
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" value="Internet" {...register("servicios")} />
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
                        <p><span className="font-semibold">Ciudad:</span> {values.ciudad || "-"}</p>
                        <p><span className="font-semibold">Precio mensual:</span> {values.precioMensual || "-"}</p>
                        <p><span className="font-semibold">Habitaciones:</span> {values.numeroHabitaciones || "-"}</p>
                        <p><span className="font-semibold">Baños:</span> {values.numeroBanos || "-"}</p>
                        <p><span className="font-semibold">Servicios:</span> {values.servicios?.length ? values.servicios.join(", ") : "-"}</p>
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
                        value="Guardar registro"
                        className="bg-blue-700 px-5 py-2 text-white uppercase font-bold rounded-lg hover:bg-blue-600 cursor-pointer transition-all"
                    />
                )}
            </div>
        </form>
    );
};