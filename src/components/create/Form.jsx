import { useState } from "react";
import useFetch from "../../hooks/useFetch"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { toast, ToastContainer } from "react-toastify"


export const Form = () => {

    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm()
    const { fetchDataBackend } = useFetch()

    const registerResidencia = (data) => {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (key == "imagen"){
                formData.append("imagen", data.imagen[0])   
            } else {
                formData.append(key, data[key]);
            }
        })
        const url = `${import.meta.env.VITE_API_URL}/departamento/registro`;
        const storedUser = JSON.parse(localStorage.getItem('auth-token'));
        const headers = {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${storedUser.state.token}`
        }

        const response = fetchDataBackend(url, formData, "POST", headers);
        if (response){
            setTimeout(() => {
                navigate("/dashboard/listar");
            }, 2000);
        }
    }

    return (
        <form onSubmit={handleSubmit(registerResidencia)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <ToastContainer />
            
            {/* Información de la residencia */}
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
                    />
                </div>

                {/* Descripción */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Descripción</label>
                    <textarea
                        placeholder="Ingresa la descripción de forma general"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Dirección */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Dirección</label>
                    <input
                        type="text"
                        placeholder="Ingresar dirección"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Ciudad */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Ciudad</label>
                    <input
                        type="text"
                        placeholder="Ingresar ciudad"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Preciomensual */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Precio mensual</label>
                    <input
                        type="number"
                        placeholder="Ingresar precio mensual"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Numero de habitaciones */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Número de habitaciones</label>
                    <input 
                        type="number"
                        placeholder="Ingrese el número de habitaciones"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                    />
                </div>

                <br />
                
                {/* Numero de banos */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Número de baños</label>
                    <input 
                        type="number"
                        placeholder="Ingrese el número de baños"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                    />
                </div>

                <br />

                {/* Imagen de la residencia */}
                <label className="mb-2 block text-sm font-semibold">Imagen de la residencia</label>
                {/* Subir Imagen */}
                <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold">Subir Imagen</label>
                    <input
                        type="file"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Servicios */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Servicios incluidos</label>
                    <div className="flex gap-6">
                        {/* Agua */}
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="Agua"
                                name="servicio"
                            />
                            Agua
                        </label>
                        {/* Luz */}
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="Luz"
                                name="servicio"
                            />
                            Luz
                        </label>
                        {/* Internet */}
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="Internet"
                                name="servicio"
                            />
                            Internet
                        </label>
                    </div>
                </div>

                
            </fieldset>

            {/* Botón de submit */}
            <input
                type="submit"
                className="bg-gray-800 w-full p-2 mt-5 text-slate-300 uppercase font-bold rounded-lg 
                hover:bg-gray-600 cursor-pointer transition-all"
                value="Registrar"
            />
        </form>

    )
} 