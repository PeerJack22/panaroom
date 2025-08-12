import { useEffect, useState } from "react";
import storeProfile from "../../context/storeProfile";
import { useForm } from "react-hook-form";
import { generateAvatar, convertBlobToBase64 } from "../../helpers/consultarIA";
import { toast } from "react-toastify";
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

    // Estado para el avatar generado por IA
    const [stateProfileAvatar, setStateProfileAvatar] = useState({
        prompt: "",
        loading: false,
        generatedImage: null,
    });

    // Estado para controlar el envío del formulario
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estado para la previsualización de la imagen subida
    const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

    // Solo observamos la opción seleccionada que sí usamos
    const selectedOption = watch("profileImageOption");

    // Manejar cambio de archivo para mostrar previsualización
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setUploadedImagePreview(imageUrl);
        }
    };

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
                throw new Error("Error al generar la imagen");
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
        if (isSubmitting) return; // Evitar múltiples envíos
        
        setIsSubmitting(true);
        try {
            const formData = new FormData();

            // Añadir campos de texto
            formData.append("nombre", data.nombre);
            formData.append("apellido", data.apellido);
            formData.append("direccion", data.direccion || "");
            formData.append("celular", data.celular || "");
            formData.append("email", data.email);
            formData.append("profileImageOption", data.profileImageOption);
            
            // Añadir la imagen según la opción seleccionada
            if (data.profileImageOption === "upload" && data.imagenPerfil && data.imagenPerfil[0]) {
                formData.append("avatarArren", data.imagenPerfil[0]);
                console.log("Imagen a subir:", data.imagenPerfil[0].name, data.imagenPerfil[0].size);
            } else if (data.profileImageOption === "ia" && data.avatarProfileIA) {
                formData.append("avatarArrenIA", data.avatarProfileIA);
                console.log("Imagen IA a guardar:", data.avatarProfileIA.substring(0, 50) + "...");
            }

            // Mostrar todos los campos del FormData para depuración
            for (let [key, value] of formData.entries()) {
                if (key !== "avatarArren" && key !== "avatarArrenIA") {
                    console.log(`FormData campo: ${key} = ${value}`);
                } else {
                    console.log(`FormData campo: ${key} = [Contenido del archivo]`);
                }
            }

            await updateProfile(formData, user._id);
            
            // Si updateProfile ya muestra un toast, comenta esta línea
            toast.success("Perfil actualizado correctamente", {
                toastId: "profile-update-success" // Usar un ID único para evitar duplicados
            });
        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            toast.error("Error al actualizar el perfil. Inténtalo de nuevo más tarde.", {
                toastId: "profile-update-error" // Usar un ID único para evitar duplicados
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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

            if (user?.avatarType === "ia" && user?.avatarUrl) {
                setStateProfileAvatar((prev) => ({
                    ...prev,
                    generatedImage: user.avatarUrl,
                }));
                setValue("avatarProfileIA", user.avatarUrl);
            } else if (user?.avatarType === "upload" && user?.avatarUrl) {
                // Mostrar la imagen existente del usuario
                setUploadedImagePreview(user.avatarUrl);
            }
        }
    }, [user, reset, setValue]);

    // Limpiar URL de objetos cuando el componente se desmonte
    useEffect(() => {
        return () => {
            // Limpiar URLs creadas con createObjectURL
            if (uploadedImagePreview && !uploadedImagePreview.includes('http')) {
                URL.revokeObjectURL(uploadedImagePreview);
            }
            if (stateProfileAvatar.generatedImage && !stateProfileAvatar.generatedImage.includes('http')) {
                URL.revokeObjectURL(stateProfileAvatar.generatedImage);
            }
        };
    }, [uploadedImagePreview, stateProfileAvatar.generatedImage]);

    // Evitar renderizar el componente si el usuario es administrador
    if (user?.rol === "administrador") {
        return null;
    }

    return (
        <form
            onSubmit={handleSubmit(updateUser)}
            className="bg-gray-900 p-6 rounded-xl shadow-lg text-white max-w-xl mx-auto mt-10"
        >
            <h2 className="text-2xl font-bold text-slate-200 mb-6">Editar perfil</h2>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Nombre</label>
                <input
                    type="text"
                    placeholder="Ingresa tu nombre"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("nombre", { required: "El nombre es obligatorio" })}
                />
                {errors.nombre && <p className="text-red-800">{errors.nombre.message}</p>}
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

            {user?.rol !== "administrador" && (
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-300">Imagen de perfil</label>
                    <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2 text-gray-300">
                            <input
                                type="radio"
                                value="ia"
                                {...register("profileImageOption", { required: "Seleccione una opción" })}
                            />
                            Generar con IA
                        </label>
                        <label className="flex items-center gap-2 text-gray-300">
                            <input
                                type="radio"
                                value="upload"
                                {...register("profileImageOption", { required: "Seleccione una opción" })}
                            />
                            Subir Imagen
                        </label>
                    </div>
                    {errors.profileImageOption && (
                        <p className="text-red-800">{errors.profileImageOption.message}</p>
                    )}

                    {selectedOption === "ia" && (
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-semibold text-gray-300">Prompt</label>
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
                                {...register("imagenPerfil", {
                                    validate: {
                                        lessThan10MB: files => !files[0] || files[0].size <= 10000000 || 'El archivo debe ser menor a 10MB',
                                        acceptedFormats: files => !files[0] || ['image/jpeg', 'image/png', 'image/gif'].includes(files[0].type) || 'Solo se aceptan imágenes (PNG, JPEG, GIF)'
                                    },
                                    onChange: handleFileChange
                                })}
                            />
                            {errors.imagenPerfil && <p className="text-red-800">{errors.imagenPerfil.message}</p>}
                            
                            {/* Previsualización de la imagen subida */}
                            {uploadedImagePreview && (
                                <div className="mt-4">
                                    <img
                                        src={uploadedImagePreview}
                                        alt="Imagen subida"
                                        className="w-24 h-24 object-cover rounded-full"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <input
                type="submit"
                value={isSubmitting ? "Actualizando..." : "Actualizar"}
                disabled={isSubmitting}
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold uppercase rounded-lg transition-all disabled:opacity-50"
            />
            
        </form>
    );
};

export default FormularioPerfil;