import { useState } from "react";

export const FormResidencia = () => {

    const [selectedOption, setSelectedOption] = useState("upload");

    return (
        <form>
            {/* Información de la residencia */}
            <fieldset className="border-2 border-gray-500 p-6 rounded-lg shadow-lg">
                <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">
                    Información de la Residencia
                </legend>

                {/* Nombre de la residencia */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Nombre de la residencia</label>
                    <input
                        type="text"
                        placeholder="Ingresa el nombre"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Descripción */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Descripción</label>
                    <textarea
                        placeholder="Describe la residencia"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        rows={4}
                    />
                </div>

                {/* Precio */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Precio mensual ($)</label>
                    <input
                        type="number"
                        placeholder="Ingresa el precio"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Dirección */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Dirección</label>
                    <input
                        type="text"
                        placeholder="Ingresa la dirección"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Ubicación con mapa (placeholder) */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Ubicación (Mapa)</label>
                    <input
                        type="text"
                        placeholder="Ingresa ubicación o coordenadas"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                    <div className="bg-gray-200 rounded-md h-64 flex items-center justify-center text-gray-500">
                        Mapa de ubicación aquí (integración futura)
                    </div>
                </div>

                {/* Capacidad */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Capacidad</label>
                    <input
                        type="number"
                        placeholder="Número de estudiantes"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                {/* Servicios incluidos */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Servicios incluidos</label>
                    <textarea
                        placeholder="Ej. agua, luz, internet, etc."
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        rows={3}
                    />
                </div>

                {/* Imagen de la residencia */}
                <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold">Subir Imagen de la residencia</label>
                    <input
                        type="file"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>
            </fieldset>

            {/* Botón de submit */}
            <input
                type="submit"
                className="bg-gray-800 w-full p-2 mt-5 text-slate-300 uppercase font-bold rounded-lg 
                hover:bg-gray-600 cursor-pointer transition-all"
                value="Registrar Residencia"
            />
        </form>
    )
}
