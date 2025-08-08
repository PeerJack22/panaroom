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
                setValue("avatarProfileIA", base64Image);
                toast.success("Imagen generada con éxito!");
            } else {
                toast.error("Error al generar la imagen. Inténtalo de nuevo más tarde.");
                setStateProfileAvatar((prev) => ({
                    ...prev,
                    generatedImage: null,
                    loading: false,
                }));
            }
        } catch (error) {
            console.error("Error generating avatar:", error);
            toast.error("Error al generar la imagen. Inténtalo de nuevo más tarde.");
            setStateProfileAvatar((prev) => ({
                ...prev,
                generatedImage: null,
                loading: false,
            }));
        }
    };

    const updateUser = async (data) => {
        if (!user?._id) {
            toast.error("No se pudo actualizar: Usuario no encontrado.");
            return;
        }

        const formData = new FormData();

        Object.keys(data).forEach((key) => {
            if (key === "imagenPerfil" && data.profileImageOption === "upload") {
                if (data.imagenPerfil[0]) {
                    formData.append("avatarArren", data.imagenPerfil[0]);
                }
            } else if (key === "avatarProfileIA" && data.profileImageOption === "ia") {
                formData.append("avatarArrenIA", data[key]);
            } else {
                formData.append(key, data[key]);
            }
        });

        updateProfile(formData, user._id);
    };

    useEffect(() => {
        if (user) {
            reset({
                nombre: user?.nombre || "",
                apellido: user?.apellido || "",
                direccion: user?.direccion || "",
                celular: user?.celular || "",
                email: user?.email || "",
                profileImageOption: user?.avatarType || "upload",
            });

            if (user?.avatarType === "ia" && user?.avatarUrl) {
                setStateProfileAvatar((prev) => ({
                    ...prev,
                    generatedImage: user.avatarUrl,
                }));
                setValue("avatarProfileIA", user.avatarUrl);
            }
        }
    }, [user, reset, setValue]);

    return (
        <form
            onSubmit={handleSubmit(updateUser)}
            className="bg-gray-900 p-6 rounded-xl shadow-lg text-white max-w-xl mx-auto mt-10"
        >
            <h2 className="text-2xl font-bold text-slate-200 mb-6">Editar perfil</h2>

            {/* Nombre */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Nombre</label>
                <input
                    type="text"
                    {...register("nombre", { required: "El nombre es obligatorio" })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4"
                />
                {errors.nombre && <p className="text-red-800">{errors.nombre.message}</p>}
            </div>

            {/* Apellido */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Apellido</label>
                <input
                    type="text"
                    {...register("apellido", { required: "El apellido es obligatorio" })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4"
                />
                {errors.apellido && <p className="text-red-800">{errors.apellido.message}</p>}
            </div>

            {/* Dirección */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Dirección</label>
                <input
                    type="text"
                    {...register("direccion", { required: "La dirección es obligatoria" })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4"
                />
                {errors.direccion && <p className="text-red-800">{errors.direccion.message}</p>}
            </div>

            {/* Teléfono */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Teléfono</label>
                <input
                    type="number"
                    {...register("celular", { required: "El celular es obligatorio" })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4"
                />
                {errors.celular && <p className="text-red-800">{errors.celular.message}</p>}
            </div>

            {/* Email */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Correo electrónico</label>
                <input
                    type="email"
                    {...register("email", { required: "El correo es obligatorio" })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-6"
                />
                {errors.email && <p className="text-red-800">{errors.email.message}</p>}
            </div>

            {/* Imagen de perfil */}
            {user?.rol !== "administrador" && (
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-300">Imagen de perfil</label>
                    <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2 text-gray-300">
                            <input type="radio" value="ia" {...register("profileImageOption")} />
                            Generar con IA
                        </label>
                        <label className="flex items-center gap-2 text-gray-300">
                            <input type="radio" value="upload" {...register("profileImageOption")} />
                            Subir Imagen
                        </label>
                    </div>

                    {selectedOption === "ia" && (
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-semibold text-gray-300">Prompt</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    value={stateProfileAvatar.prompt}
                                    onChange={(e) =>
                                        setStateProfileAvatar((prev) => ({
                                            ...prev,
                                            prompt: e.target.value,
                                        }))
                                    }
                                    disabled={stateProfileAvatar.loading}
                                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateImage}
                                    disabled={stateProfileAvatar.loading}
                                    className="py-2 px-6 bg-blue-600 rounded-xl"
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
                                {...register("imagenPerfil")}
                                className="block w-full text-sm text-gray-500"
                            />
                        </div>
                    )}
                </div>
            )}

            <input
                type="submit"
                value="Actualizar"
                className="w-full py-2 bg-blue-700 text-white font-semibold uppercase rounded-lg"
            />
            <ToastContainer position="bottom-right" theme="dark" />
        </form>
    );
};

export default FormularioPerfil;
