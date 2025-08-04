import { useEffect } from "react"
import storeProfile from "../../context/storeProfile"
import { useForm } from "react-hook-form"

const FormularioPerfil = () => {

    const { user,updateProfile } = storeProfile()
    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    const updateUser = async(data) => {
        updateProfile(data,user._id)
    }

    const [selectedProfileOption, setSelectedProfileOption] = useState("");
    const [stateProfileAvatar, setStateProfileAvatar] = useState({
        prompt: "",
        loading: false,
        generatedImage: null,
    });

    useEffect(() => {
        if (user) {
            reset({
                nombre: user?.nombre,
                apellido: user?.apellido,
                direccion: user?.direccion,
                celular: user?.celular,
                email: user?.email,
            })
        }
    }, [user])

    return (
        <form onSubmit={handleSubmit(updateUser)} className="bg-gray-900 p-6 rounded-xl shadow-lg text-white max-w-xl mx-auto mt-10">
            <h2 className="text-2xl font-bold text-slate-200 mb-6">Editar perfil</h2>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Nombre</label>
                <input
                    type="text"
                    placeholder="Ingresa tu nombre"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("nombre", { required: "El nombre es obligatorio" })}
                />
                
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Apellido</label>
                <input
                    type="text"
                    placeholder="Ingresa tu apellido"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("apellido", { required: "El apellido es obligatorio" })}
                />
                {errors.apellido && <p className="text-red-800">{errors.apellido.message}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Dirección</label>
                <input
                    type="text"
                    placeholder="Ingresa tu dirección"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("direccion", { required: "La dirección es obligatoria" })}
                />
                {errors.direccion && <p className="text-red-800">{errors.direccion.message}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Teléfono</label>
                <input
                    type="number"
                    placeholder="Ingresa tu teléfono"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("celular", { required: "El celular es obligatorio" })}
                />
                {errors.celular && <p className="text-red-800">{errors.celular.message}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Correo electrónico</label>
                <input
                    type="email"
                    placeholder="Ingresa tu correo"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("email", { required: "El correo es obligatorio" })}
                />
                {errors.email && <p className="text-red-800">{errors.email.message}</p>}
            </div>

            {/* Subir imagen normal o con IA para perfil */}
            <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-300">Imagen de perfil</label>

                {/* Opción: IA o subida */}
                <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 text-gray-300">
                        <input
                            type="radio"
                            name="profileImageOption"
                            value="ia"
                            checked={selectedProfileOption === "ia"}
                            onChange={() => setSelectedProfileOption("ia")}
                        />
                        Generar con IA
                    </label>

                    <label className="flex items-center gap-2 text-gray-300">
                        <input
                            type="radio"
                            name="profileImageOption"
                            value="upload"
                            checked={selectedProfileOption === "upload"}
                            onChange={() => setSelectedProfileOption("upload")}
                        />
                        Subir Imagen
                    </label>
                </div>

                {/* Imagen generada con IA */}
                {selectedProfileOption === "ia" && (
                    <div className="mt-4">
                        <label className="mb-2 block text-sm font-semibold text-gray-300">Prompt</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="Ej. mujer joven con gafas"
                                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-700"
                                value={stateProfileAvatar.prompt}
                                onChange={(e) => setStateProfileAvatar(prev => ({ ...prev, prompt: e.target.value }))}
                            />
                            <button
                                type="button"
                                className="py-1 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 duration-300"
                                disabled={stateProfileAvatar.loading}
                            >
                                {stateProfileAvatar.loading ? "Generando..." : "Generar"}
                            </button>
                        </div>

                        {stateProfileAvatar.generatedImage && (
                            <img
                                src={stateProfileAvatar.generatedImage}
                                alt="Avatar Generado"
                                className="mt-4 w-24 h-24 object-cover rounded-full"
                            />
                        )}
                    </div>
                )}

                {/* Subida manual de imagen */}
                {selectedProfileOption === "upload" && (
                    <div className="mt-4">
                        <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
            </div>

            <input
                type="submit"
                value="Actualizar"
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold uppercase rounded-lg transition-all"
            />
        </form>
    );
};

export default FormularioPerfil;
