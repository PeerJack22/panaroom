import { useEffect, useState } from "react";
import storeProfile from "../../context/storeProfile";
import storeAuth from "../../context/storeAuth";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FormularioPerfil = () => {
    const { user, updateProfile, profile } = storeProfile();
    const { rol } = storeAuth();
    const isAdmin = rol === "administrador";

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    // Estado para controlar el envío del formulario
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estado para la previsualización de la imagen subida
    const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

    // Manejar cambio de archivo para mostrar previsualización
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (uploadedImagePreview && !uploadedImagePreview.includes("http")) {
                URL.revokeObjectURL(uploadedImagePreview);
            }
            const imageUrl = URL.createObjectURL(file);
            setUploadedImagePreview(imageUrl);
        }
    };

    const updateUser = async (data) => {
        if (isSubmitting) return; // Evitar múltiples envíos
        
        setIsSubmitting(true);
        const fieldName = isAdmin ? "telefono" : "celular";
        try {
            const formData = new FormData();

            // Añadir campos de texto
            formData.append("nombre", data.nombre);
            formData.append("apellido", data.apellido);
            formData.append("direccion", data.direccion || "");
            // Admin usa "telefono", arrendatario y estudiante usan "celular"
            const fieldName = isAdmin ? "telefono" : "celular";
            formData.append(fieldName, data.celular || "");
            formData.append("email", data.email);
            
            if (!isAdmin) {
                // Solo indicar opción upload si hay archivo
                if (data.imagenPerfil && data.imagenPerfil[0]) {
                    formData.append("profileImageOption", "upload");
                    formData.append("avatarArren", data.imagenPerfil[0]);
                }
            }

            // Intento principal con FormData
            const respuesta = await updateProfile(formData, user._id);
            // Forzar recarga del perfil desde el backend para sincronizar el store
            try { await profile(); } catch { /* ignore */ }
            const usuarioActualizado = storeProfile.getState().user;
            const nuevaUrl = usuarioActualizado?.avatarUrl || respuesta?.data?.avatarUrl || respuesta?.data?.user?.avatarUrl || respuesta?.data?.perfil?.avatarUrl;
            if (nuevaUrl) setUploadedImagePreview(nuevaUrl);
            toast.success("Perfil actualizado correctamente", { toastId: "profile-update-success" });
        } catch (error) {
            console.error("Error al actualizar el perfil (FormData):", error);
            // Si hay una imagen y el intento con FormData falla, reintentar enviando la imagen como base64
            try {
                if (!isAdmin && data.imagenPerfil && data.imagenPerfil[0]) {
                    const file = data.imagenPerfil[0];
                    const toBase64 = (file) => new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = (err) => reject(err);
                        reader.readAsDataURL(file);
                    });

                    toast.info("Reintentando subida de imagen como base64...", { toastId: "profile-retry-base64" });
                    const base64 = await toBase64(file);

                    // Construir payload JSON que el backend acepta en la rama 'ia' (profileImageOption: 'ia')
                    const payload = {
                        nombre: data.nombre,
                        apellido: data.apellido,
                        direccion: data.direccion || "",
                        [fieldName]: data.celular || "",
                        email: data.email,
                        profileImageOption: 'ia',
                        avatarArrenIA: base64,
                    };

                    // Reintento con JSON (backend en controlador soporta avatarArrenIA)
                    const respuesta2 = await updateProfile(payload, user._id);
                    try { await profile(); } catch { /* ignore */ }
                    const usuarioActualizado2 = storeProfile.getState().user;
                    const nuevaUrl2 = usuarioActualizado2?.avatarUrl || respuesta2?.data?.avatarUrl || respuesta2?.data?.user?.avatarUrl || respuesta2?.data?.perfil?.avatarUrl;
                    if (nuevaUrl2) setUploadedImagePreview(nuevaUrl2);
                    toast.success("Perfil actualizado (subida base64) correctamente", { toastId: "profile-update-success-2" });
                } else {
                    throw error;
                }
            } catch (err2) {
                console.error("Error reintentando subida base64:", err2);
                toast.error(err2.response?.data?.msg || 'Error al actualizar el perfil. Inténtalo de nuevo más tarde.', { toastId: "profile-update-error" });
            }
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
                celular: user?.telefono || user?.celular,
                email: user?.email,
            });

            // Si el usuario no tiene avatar, limpiamos la preview anterior.
            setUploadedImagePreview(user?.avatarUrl || null);
        } else {
            setUploadedImagePreview(null);
        }
    }, [user, reset]);

    // Limpiar URL de objetos cuando el componente se desmonte
    useEffect(() => {
        return () => {
            // Limpiar URLs creadas con createObjectURL
            if (uploadedImagePreview && !uploadedImagePreview.includes('http')) {
                URL.revokeObjectURL(uploadedImagePreview);
            }
        };
    }, [uploadedImagePreview]);

    return (
        <form
            onSubmit={handleSubmit(updateUser)}
            className="bg-gray-900 p-6 rounded-xl shadow-lg text-white max-w-xl mx-auto"
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

            {!isAdmin && <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-300">Imagen de perfil</label>
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
                                className="w-24 h-24 object-cover"
                            />
                        </div>
                    )}
                </div>
            </div>}

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