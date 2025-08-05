import { useEffect, useState } from "react";
import storeProfile from "../../context/storeProfile";
import { useForm } from "react-hook-form";
import { generateAvatar, convertBlobToBase64 } from "../../helpers/consultarIA"; 
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FormularioPerfil = () => {
    const { user, updateProfile } = storeProfile();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setValue,
        watch,
    } = useForm();

    const [stateProfileAvatar, setStateProfileAvatar] = useState({
        prompt: "",
        loading: false,
        generatedImage: null,
    });

    const selectedOption = watch("profileImageOption");
    const uploadedImage = watch("imagenPerfil");

    // Función para generar la imagen con IA
    const handleGenerateImage = async () => {
        if (!stateProfileAvatar.prompt) {
            toast.error("Por favor, ingresa una descripción para generar la imagen.");
            return;
        }

        setStateProfileAvatar((prev) => ({ ...prev, loading: true }));
        try {
            const blob = await generateAvatar(stateProfileAvatar.prompt);
            if (blob && blob.type.startsWith("image/")) {
                const imageUrl = URL.createObjectURL(blob);
                const base64Image = await convertBlobToBase64(blob);
                setStateProfileAvatar((prev) => ({
                    ...prev,
                    generatedImage: imageUrl,
                    loading: false,
                }));
                // Mapea al campo del modelo 'avatarArrenIA'
                setValue("avatarArrenIA", base64Image);
                toast.success("Imagen generada con éxito!");
            } else {
                toast.error("Error al generar la imagen. Inténtalo de nuevo más tarde.");
                setStateProfileAvatar((prev) => ({ ...prev, generatedImage: null, loading: false }));
            }
        } catch (error) {
            console.error("Error generating avatar:", error);
            toast.error("Error al generar la imagen. Inténtalo de nuevo más tarde.");
            setStateProfileAvatar((prev) => ({ ...prev, generatedImage: null, loading: false }));
        }
    };

    // Función para manejar la actualización del perfil
    const updateUser = async (data) => {
        const formData = new FormData();
        
        // Mapea los campos del formulario a los del modelo
        if (data.profileImageOption === "upload" && data.imagenPerfil && data.imagenPerfil[0]) {
            formData.append("avatarArren", data.imagenPerfil[0]); // Subir imagen
        } else if (data.profileImageOption === "ia" && data.avatarArrenIA) {
            formData.append("avatarArrenIA", data.avatarArrenIA); // Imagen de IA
        }

        // Agrega el resto de los campos de texto
        formData.append("nombre", data.nombre);
        formData.append("apellido", data.apellido);
        formData.append("direccion", data.direccion);
        formData.append("celular", data.celular);
        formData.append("email", data.email);
        formData.append("profileImageOption", data.profileImageOption);

        updateProfile(formData, user._id);
    };

    // Inicializa el formulario con los datos del usuario
    useEffect(() => {
        if (user) {
            reset({
                nombre: user?.nombre,
                apellido: user?.apellido,
                direccion: user?.direccion,
                celular: user?.celular,
                email: user?.email,
                profileImageOption: user?.avatarType || "upload",
            });

            if (user?.avatarType === "ia" && user?.avatarArrenIA) {
                setStateProfileAvatar((prev) => ({ ...prev, generatedImage: user.avatarArrenIA }));
                setValue("avatarArrenIA", user.avatarArrenIA); 
            }
        }
    }, [user, reset, setValue]);

    return (
        <form
            onSubmit={handleSubmit(updateUser)}
            className="bg-gray-900 p-6 rounded-xl shadow-lg text-white max-w-xl mx-auto mt-10"
        >
            <h2 className="text-2xl font-bold text-slate-200 mb-6">Editar perfil</h2>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                Nombre
                </label>
                <input
                    type="text"
                    placeholder="Ingresa tu nombre"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("nombre", { required: "El nombre es obligatorio" })}
                />
                {errors.nombre && <p className="text-red-800">{errors.nombre.message}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                Apellido
                </label>
                <input
                    type="text"
                    placeholder="Ingresa tu apellido"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("apellido", { required: "El apellido es obligatorio" })}
                />
                {errors.apellido && <p className="text-red-800">{errors.apellido.message}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                Dirección
                </label>
                <input
                    type="text"
                    placeholder="Ingresa tu dirección"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("direccion", { required: "La dirección es obligatoria" })}
                />
                {errors.direccion && <p className="text-red-800">{errors.direccion.message}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                Teléfono
                </label>
                <input
                    type="number"
                    placeholder="Ingresa tu teléfono"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("celular", { required: "El celular es obligatorio" })}
                />
                {errors.celular && <p className="text-red-800">{errors.celular.message}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                Correo electrónico
                </label>
                <input
                    type="email"
                    placeholder="Ingresa tu correo"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("email", { required: "El correo es obligatorio" })}
                />
                {errors.email && <p className="text-red-800">{errors.email.message}</p>}
            </div>

            {user?.rol !== "administrador" && (
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                        Imagen de perfil
                    </label>

                    <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2 text-gray-300">
                        <input
                            type="radio"
                            value="ia"
                            {...register("profileImageOption", {
                                required: "Seleccione una opción",
                            })}
                        />
                        Generar con IA
                        </label>

                        <label className="flex items-center gap-2 text-gray-300">
                        <input
                            type="radio"
                            value="upload"
                            {...register("profileImageOption", {
                                required: "Seleccione una opción",
                            })}
                        />
                        Subir Imagen
                        </label>
                    </div>
                    {errors.profileImageOption && (
                        <p className="text-red-800">{errors.profileImageOption.message}</p>
                    )}

                    {selectedOption === "ia" && (
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-semibold text-gray-300">
                                Prompt
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    placeholder="Ej. mujer joven con gafas"
                                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={stateProfileAvatar.prompt}
                                    onChange={(e) =>
                                        setStateProfileAvatar((prev) => ({
                                        ...prev,
                                        prompt: e.target.value,
                                        }))
                                    }
                                    disabled={stateProfileAvatar.loading}
                                />
                                <button
                                    type="button"
                                    className="py-2 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 duration-300"
                                    onClick={handleGenerateImage}
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

                    {selectedOption === "upload" && (
                        <div className="mt-4">
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                {...register("imagenPerfil")}
                            />
                        </div>
                    )}
                </div>
            )}

            <input
                type="submit"
                value="Actualizar"
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold uppercase rounded-lg transition-all"
            />
            <ToastContainer position="bottom-right" theme="dark" />
        </form>
    );
};

export default FormularioPerfil;