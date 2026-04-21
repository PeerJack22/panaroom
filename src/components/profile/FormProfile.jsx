import { useEffect, useState } from "react";
import storeProfile from "../../context/storeProfile";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FormularioPerfil = () => {
    const { user, updateProfile } = storeProfile();

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
            const imageUrl = URL.createObjectURL(file);
            setUploadedImagePreview(imageUrl);
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
            formData.append("telefono", data.telefono || "");
            formData.append("email", data.email);
            formData.append("profileImageOption", "upload");
            
            // Añadir solo imagen subida
            if (data.imagenPerfil && data.imagenPerfil[0]) {
                formData.append("avatarArren", data.imagenPerfil[0]);
                console.log("Imagen a subir:", data.imagenPerfil[0].name, data.imagenPerfil[0].size);
            }

            // Mostrar todos los campos del FormData para depuración
            for (let [key, value] of formData.entries()) {
                if (key !== "avatarArren") {
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
                celular: user?.telefono,
                email: user?.email,
            });

            if (user?.avatarUrl) {
                // Mostrar la imagen existente del usuario
                setUploadedImagePreview(user.avatarUrl);
            }
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

            <div className="mb-6">
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
                                className="w-24 h-24 object-cover rounded-full"
                            />
                        </div>
                    )}
                </div>
            </div>

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