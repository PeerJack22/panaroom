import { useEffect, useState } from "react";
import storeProfile from "../../context/storeProfile";

const FormularioPerfil = () => {
    const { user, profile, updateProfile } = storeProfile();

    // Estado local del formulario
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        direccion: "",
        celular: "",
        email: "",
        imagen: null
    });

    // Estado para previsualizar la imagen
    const [preview, setPreview] = useState(null);

    // Cargar perfil al montar
    useEffect(() => {
        profile();
    }, [profile]);

    // Prellenar formulario cuando llegue el usuario
    useEffect(() => {
        if (user) {
            setFormData({
                nombre: user.nombre || "",
                apellido: user.apellido || "",
                direccion: user.direccion || "",
                celular: user.celular || "",
                email: user.email || "",
                imagen: null
            });
            setPreview(user.imagen || null);
        }
    }, [user]);

    // Manejar cambios de inputs
    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "imagen" && files.length > 0) {
            const file = files[0];
            setFormData({ ...formData, imagen: file });
            setPreview(URL.createObjectURL(file));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Enviar formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataToSend = new FormData();
        for (let key in formData) {
            if (formData[key] !== null) {
                formDataToSend.append(key, formData[key]);
            }
        }

        // Usar el id desde user para evitar undefined
        if (!user?._id) {
            console.error("No se encontró el ID del usuario");
            return;
        }

        await updateProfile(formDataToSend, user._id);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-gray-800 p-6 rounded-xl shadow-md space-y-4"
        >
            <h2 className="text-white text-lg font-semibold">Editar Perfil</h2>

            {/* Imagen con preview */}
            <div>
                <label className="text-gray-300 block mb-1">Imagen de perfil</label>
                {preview && (
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-full mb-2"
                    />
                )}
                <input
                    type="file"
                    name="imagen"
                    accept="image/*"
                    onChange={handleChange}
                    className="text-white"
                />
            </div>

            {/* Nombre */}
            <div>
                <label className="text-gray-300 block mb-1">Nombre</label>
                <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
                />
            </div>

            {/* Apellido */}
            <div>
                <label className="text-gray-300 block mb-1">Apellido</label>
                <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
                />
            </div>

            {/* Dirección */}
            <div>
                <label className="text-gray-300 block mb-1">Dirección</label>
                <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
                />
            </div>

            {/* Celular */}
            <div>
                <label className="text-gray-300 block mb-1">Celular</label>
                <input
                    type="text"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
                />
            </div>

            {/* Email */}
            <div>
                <label className="text-gray-300 block mb-1">Correo</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
                />
            </div>

            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
                Guardar cambios
            </button>
        </form>
    );
};

export default FormularioPerfil;
