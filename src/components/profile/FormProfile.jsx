import { useEffect, useState } from "react";
import storeProfile from "../../context/storeProfile";
import storeAuth from "../../context/storeAuth";
import { useForm } from "react-hook-form";
import axios from "axios";
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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

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
        if (isSubmitting) return;
        setIsSubmitting(true);
        const fieldName = isAdmin ? "telefono" : "celular";
        try {
            const payload = {
                nombre: data.nombre,
                apellido: data.apellido,
                direccion: data.direccion || "",
                [fieldName]: data.celular || "",
            };

            const respuesta = await updateProfile(payload, user._id);

            const file = data.imagenPerfil?.[0];
            if (file && (rol === "estudiante" || rol === "arrendatario")) {
                const uploadUrl = rol === "estudiante"
                    ? `${import.meta.env.VITE_BACKEND_URL}/estudiante/subirimagen`
                    : `${import.meta.env.VITE_BACKEND_URL}/arrendatario/subirimagen`;

                if (uploadUrl) {
                    const imageFormData = new FormData();
                    imageFormData.append("imagen", file);

                    const storedUser = JSON.parse(localStorage.getItem("auth-token"));
                    const token = storedUser?.state?.token;

                    const uploadResponse = await axios.post(uploadUrl, imageFormData, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    const updatedUser = uploadResponse?.data?.estudiante || uploadResponse?.data?.arrendatario;
                    const nuevaUrl = updatedUser?.avatarUrl || respuesta?.data?.avatarUrl || respuesta?.data?.user?.avatarUrl;
                    if (nuevaUrl) setUploadedImagePreview(nuevaUrl);
                }
            }

            try { await profile(); } catch { /* ignore */ }
            const usuarioActualizado = storeProfile.getState().user;
            const nuevaUrlFinal = usuarioActualizado?.avatarUrl || respuesta?.data?.avatarUrl || respuesta?.data?.user?.avatarUrl || respuesta?.data?.perfil?.avatarUrl;
            if (nuevaUrlFinal) setUploadedImagePreview(nuevaUrlFinal);
            toast.success("Perfil actualizado correctamente", { toastId: "profile-update-success" });
        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            toast.error(error.response?.data?.msg || 'Error al actualizar el perfil. Inténtalo de nuevo más tarde.', { toastId: "profile-update-error" });
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

            setUploadedImagePreview(user?.avatarUrl || null);
        } else {
            setUploadedImagePreview(null);
        }
    }, [user, reset]);

    useEffect(() => {
        return () => {
            if (uploadedImagePreview && !uploadedImagePreview.includes('http')) {
                URL.revokeObjectURL(uploadedImagePreview);
            }
        };
    }, [uploadedImagePreview]);

    return (
        <form
            onSubmit={handleSubmit(updateUser)}
            className="flex h-full max-w-none flex-col rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm"
        >
            <h2 className="mb-3 text-lg font-bold text-slate-900">Editar perfil</h2>

            <div className="flex flex-col gap-6">
                {/* Columna de Datos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Nombre</label>
                        <input
                            type="text"
                            placeholder="Ingresa tu nombre"
                            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("nombre", { 
                                required: "El nombre es obligatorio",
                                maxLength: { value: 10, message: "Máximo 10 caracteres" },
                                pattern: { value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, message: "Solo letras permitidas" }
                            })}
                        />
                        {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Apellido</label>
                        <input
                            type="text"
                            placeholder="Ingresa tu apellido"
                            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("apellido", { 
                                required: "El apellido es obligatorio",
                                maxLength: { value: 10, message: "Máximo 10 caracteres" },
                                pattern: { value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, message: "Solo letras permitidas" }
                            })}
                        />
                        {errors.apellido && <p className="mt-1 text-xs text-red-600">{errors.apellido.message}</p>}
                    </div>

                    <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Dirección</label>
                        <input
                            type="text"
                            placeholder="Ingresa tu dirección"
                            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("direccion", { 
                                required: "La dirección es obligatoria",
                                maxLength: { value: 20, message: "Máximo 20 caracteres" }
                            })}
                        />
                        {errors.direccion && <p className="mt-1 text-xs text-red-600">{errors.direccion.message}</p>}
                    </div>

                    <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Teléfono</label>
                        <input
                            type="text"
                            placeholder="Ingresa tu teléfono"
                            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("celular", { 
                                required: "El celular es obligatorio",
                                minLength: { value: 10, message: "Debe tener 10 dígitos" },
                                maxLength: { value: 10, message: "Debe tener 10 dígitos" },
                                pattern: { value: /^[0-9]+$/, message: "Solo números permitidos" }
                            })}
                        />
                        {errors.celular && <p className="mt-1 text-xs text-red-600">{errors.celular.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-slate-600">Correo electrónico</label>
                        <input
                            type="email"
                            placeholder="Ingresa tu correo"
                            className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-slate-500 outline-none cursor-not-allowed"
                            readOnly
                            {...register("email")}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                    </div>
                </div>

                {/* Columna de Imagen (Solo si no es Admin) */}
                {!isAdmin && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col">
                        <label className="mb-1 block text-sm font-semibold text-slate-600">
                            Imagen de perfil
                        </label>
                        <div className="mt-2 flex-1 flex flex-col justify-center">
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:bg-blue-600 file:px-5 file:py-1.5 file:text-sm file:font-semibold file:text-white file:transition-all file:hover:bg-blue-700 file:hover:shadow-blue-600/30 file:shadow-lg file:transform file:hover:-translate-y-0.5 outline-none focus:ring-2 focus:ring-blue-100"
                                {...register("imagenPerfil", {
                                    validate: {
                                        lessThan10MB: files => !files[0] || files[0].size <= 10000000 || 'El archivo debe ser menor a 10MB',
                                        acceptedFormats: files => !files[0] || ['image/jpeg', 'image/png', 'image/gif'].includes(files[0].type) || 'Solo se aceptan imágenes (PNG, JPEG, GIF)'
                                    },
                                    onChange: handleFileChange
                                })}
                            />
                            {errors.imagenPerfil && <p className="mt-1 text-xs text-red-600">{errors.imagenPerfil.message}</p>}

                            {uploadedImagePreview && (
                                <div className="mt-4 flex flex-col items-center text-center gap-3">
                                    <img
                                        src={uploadedImagePreview}
                                        alt="Imagen subida"
                                        className="h-28 w-28 rounded-full border-4 border-white shadow-md object-cover"
                                    />
                                    <p className="text-xs text-slate-500 max-w-[150px]">Puedes cambiar la imagen cuando quieras.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-3">
                <input
                    type="submit"
                    value={isSubmitting ? "Actualizando..." : "Actualizar"}
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-lg hover:bg-blue-700 hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                    />
            </div>
            
        </form>
    );
};

export default FormularioPerfil;