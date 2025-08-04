import { useState } from "react";


export const Form = () => {

    const [stateAvatar, setStateAvatar] = useState({
        generatedImage: "https://darwinsdata.com/wp-content/uploads/2023/09/ab15dcbbe1660b5ac94e320424cdd322.jpg",
        prompt: "",
        loading: false
    })

    const [selectedOption , setSelectedOption ] = useState("ia")


    

    return (
        <form className="space-y-6">

            <fieldset className="border-2 border-gray-500 p-6 rounded-lg shadow-lg">
                <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">
                    Información del Departamento
                </legend>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Título</label>
                    <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        placeholder="Nombre del departamento"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Descripción</label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Descripción general"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Dirección</label>
                    <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        placeholder="Dirección exacta"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Ciudad</label>
                    <input
                        type="text"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleChange}
                        placeholder="Ciudad"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Precio mensual (USD)</label>
                    <input
                        type="number"
                        name="precioMensual"
                        value={formData.precioMensual}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Número de habitaciones</label>
                    <input
                        type="number"
                        name="numeroHabitaciones"
                        value={formData.numeroHabitaciones}
                        onChange={handleChange}
                        min={1}
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Número de baños</label>
                    <input
                        type="number"
                        name="numeroBanos"
                        value={formData.numeroBanos}
                        onChange={handleChange}
                        min={1}
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Servicios incluidos</label>
                    <div className="flex flex-wrap gap-4 mb-5">
                        {["Agua", "Luz", "Internet", "TV por cable"].map(servicio => (
                            <label key={servicio} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    value={servicio}
                                    checked={formData.serviciosIncluidos.includes(servicio)}
                                    onChange={handleCheck}
                                />
                                {servicio}
                            </label>
                        ))}
                    </div>
                </div>
            </fieldset>

            <fieldset className="border-2 border-gray-500 p-6 rounded-lg shadow-lg mt-10">
                <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">
                    Imagen de la residencia
                </legend>

                <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            value="ia"
                            checked={selectedOption === "ia"}
                            onChange={() => setSelectedOption("ia")}
                        />
                        Generar con IA
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            value="upload"
                            checked={selectedOption === "upload"}
                            onChange={() => setSelectedOption("upload")}
                        />
                        Subir Imagen
                    </label>
                </div>

                {selectedOption === "ia" && (
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold">Prompt para IA</label>
                        <input
                            type="text"
                            placeholder="Ingresa el prompt"
                            className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                            value={stateAvatar.prompt}
                            onChange={(e) => setStateAvatar(prev => ({ ...prev, prompt: e.target.value }))}
                        />
                        <button
                            type="button"
                            className="mt-2 py-1 px-8 bg-gray-600 text-slate-300 border rounded-xl hover:scale-105 hover:bg-gray-900 hover:text-white"
                        >
                            Generar con IA
                        </button>
                        <div className="mt-4">
                            <img src={stateAvatar.generatedImage} alt="IA imagen" width={100} height={100} />
                        </div>
                    </div>
                )}

                {selectedOption === "upload" && (
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold">Subir Imagen</label>
                        <input
                            type="file"
                            className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                        />
                    </div>
                )}
            </fieldset>

            <input
                type="submit"
                className="bg-gray-800 w-full p-2 mt-5 text-slate-300 uppercase font-bold rounded-lg hover:bg-gray-600 cursor-pointer transition-all"
                value="Registrar"
            />
        </form>

    )
}