import { useState } from "react";


export const Form = () => {

    const [stateAvatar, setStateAvatar] = useState({
        generatedImage: "https://darwinsdata.com/wp-content/uploads/2023/09/ab15dcbbe1660b5ac94e320424cdd322.jpg",
        prompt: "",
        loading: false
    })

    const [selectedOption , setSelectedOption ] = useState("ia")


    

    return (
        <form>
            
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
                
                {/* Numero de banos */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Número de baños</label>
                    <input 
                        type="number"
                        placeholder="Ingrese el número de baños"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                    />
                </div>

                {/* Imagen de la residencia */}
                <label className="mb-2 block text-sm font-semibold">Imagen de la residencia</label>
                <div className="flex gap-4 mb-2">
                    {/* Opción: Imagen con IA */}
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            value="ia"
                        />
                        Generar con IA
                    </label>

                    {/* Opción: Subir Imagen */}
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            value="upload"
                        />
                        Subir Imagen
                    </label>
                </div>

                {/* Imagen con IA */}
                {selectedOption === "ia" && (
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold">Imagen con IA</label>
                        <div className="flex items-center gap-10 mb-5">
                            <input
                                type="text"
                                placeholder="Ingresa el prompt"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                                value={stateAvatar.prompt}
                                onChange={(e) => setStateAvatar(prev => ({ ...prev, prompt: e.target.value }))}
                            />
                            <button
                                type="button"
                                className="py-1 px-8 bg-gray-600 text-slate-300 border rounded-xl hover:scale-110 duration-300 hover:bg-gray-900 hover:text-white sm:w-80"
                                disabled={stateAvatar.loading}
                            >
                                {stateAvatar.loading ? "Generando..." : "Generar con IA"}
                            </button>
                        </div>
                        {stateAvatar.generatedImage && (
                            <img src={stateAvatar.generatedImage} alt="Avatar IA" width={100} height={100} />
                        )}
                    </div>
                )}

                {/* Subir Imagen */}
                {selectedOption === "upload" && (
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold">Subir Imagen</label>
                        <input
                            type="file"
                            className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        />
                    </div>
                )}

                {/* Tipo de residencia */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Tipo</label>
                    <select
                        id='prioridad'
                        className='block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5'
                    >
                        <option value="">--- Seleccionar ---</option>
                        <option value="apt_p">Apartamento pequeño</option>
                        <option value="apt_g">Apartamento grande</option>
                        <option value="otro">Otro</option>
                    </select>
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