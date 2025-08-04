import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Form = () => {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();
    const { fetchDataBackend } = useFetch();

    const registerResidencia = async (data) => {
        // Verificar que al menos un servicio esté seleccionado
        if (!data.servicios || data.servicios.length === 0) {
        toast.error("Debes seleccionar al menos un servicio.");
        return;
        }

        const formData = new FormData();

        // Recorre todos los datos del formulario y los añade al formData
        Object.keys(data).forEach((key) => {
        if (key === "imagen" && data.imagen[0]) {
            formData.append("imagen", data.imagen[0]);
        } else if (key === "servicios") {
            // Para servicios, crea un arreglo de strings
            data.servicios.forEach((servicio) => {
            formData.append("serviciosIncluidos[]", servicio);
            });
        } else {
            formData.append(key, data[key]);
        }
        });

        try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/registro`;
        const storedUser = JSON.parse(localStorage.getItem("auth-token"));
        const headers = {
            Authorization: `Bearer ${storedUser.state.token}`,
        };

        const response = await fetchDataBackend(url, formData, "POST", headers);
        if (response) {
            toast.success("Residencia registrada exitosamente!");
            setTimeout(() => {
            navigate("/dashboard/listar");
            }, 2000);
        }
        } catch (error) {
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
        <ToastContainer />

        <fieldset className="border-2 border-gray-500 p-6 rounded-lg shadow-lg mt-10">
            <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">
            Información de la residencia
            </legend>

            {/* Titulo de la residencia */}
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

            {/* Descripción */}
            <div>
            <label className="mb-2 block text-sm font-semibold">Descripción</label>
            <textarea
                placeholder="Ingresa la descripción de forma general"
                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                {...register("descripcion", { required: "La descripción es obligatoria." })}
            />
            {errors.descripcion && <p className="text-red-500 text-xs italic">{errors.descripcion.message}</p>}
            </div>

            {/* Dirección */}
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

            {/* Ciudad */}
            <div>
            <label className="mb-2 block text-sm font-semibold">Ciudad</label>
            <input
                type="text"
                placeholder="Ingresar ciudad"
                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                {...register("ciudad", { required: "La ciudad es obligatoria." })}
            />
            {errors.ciudad && <p className="text-red-500 text-xs italic">{errors.ciudad.message}</p>}
            </div>

            {/* Preciomensual */}
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

            {/* Numero de habitaciones */}
            <div>
            <label className="mb-2 block text-sm font-semibold">Número de habitaciones</label>
            <input
                type="number"
                placeholder="Ingrese el número de habitaciones"
                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                {...register("numeroHabitaciones", {
                required: "El número de habitaciones es obligatorio.",
                min: { value: 1, message: "Debe haber al menos 1 habitación." },
                })}
            />
            {errors.numeroHabitaciones && <p className="text-red-500 text-xs italic">{errors.numeroHabitaciones.message}</p>}
            </div>

            <br />

            {/* Numero de banos */}
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

            <br />

            {/* Imagen de la residencia */}
            <div>
            <label className="mb-2 block text-sm font-semibold">Imagen de la residencia</label>
            <input
                type="file"
                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                {...register("imagen", { required: "Debes subir al menos una imagen." })}
            />
            {errors.imagen && <p className="text-red-500 text-xs italic">{errors.imagen.message}</p>}
            </div>

            {/* Servicios */}
            <div>
            <label className="mb-2 block text-sm font-semibold">Servicios incluidos</label>
            <div className="flex gap-6">
                {/* Agua */}
                <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    value="Agua"
                    {...register("servicios")}
                />
                Agua
                </label>
                {/* Luz */}
                <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    value="Luz"
                    {...register("servicios")}
                />
                Luz
                </label>
                {/* Internet */}
                <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    value="Internet"
                    {...register("servicios")}
                />
                Internet
                </label>
            </div>
            {errors.servicios && <p className="text-red-500 text-xs italic">{errors.servicios.message}</p>}
            </div>
        </fieldset>

        <input
            type="submit"
            className="bg-gray-800 w-full p-2 mt-5 text-slate-300 uppercase font-bold rounded-lg 
                    hover:bg-gray-600 cursor-pointer transition-all"
            value="Registrar"
        />
        </form>
    );
    };