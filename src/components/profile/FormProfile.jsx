import { useState, useEffect } from "react";
import storeProfile from "../../context/storeProfile";

export const FormularioPerfil = () => {
    const { user, profile, updateProfile } = storeProfile();
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        direccion: "",
        celular: "",
        email: "",
        imagen: "",
    });

    const [selectedOption, setSelectedOption] = useState("upload");
    const [preview, setPreview] = useState("");

    useEffect(() => {
        profile(); // Trae los datos del backend
    }, []);

    useEffect(() => {
        if (user) {
        setFormData({
            nombre: user.nombre || "",
            apellido: user.apellido || "",
            direccion: user.direccion || "",
            celular: user.celular || "",
            email: user.email || "",
            imagen: user.imagen || "",
        });
        setPreview(user.imagen || "");
        }
    }, [user]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile(formData, user?._id); // Aquí debes asegurarte que user tenga el _id
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre */}
        <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3"
            />
        </div>

        {/* Apellido */}
        <div>
            <label className="block text-sm font-medium">Apellido</label>
            <input
            type="text"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3"
            />
        </div>

        {/* Dirección */}
        <div>
            <label className="block text-sm font-medium">Dirección</label>
            <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3"
            />
        </div>

        {/* Teléfono */}
        <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <input
            type="text"
            name="celular"
            value={formData.celular}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3"
            />
        </div>

        {/* Correo */}
        <div>
            <label className="block text-sm font-medium">Correo</label>
            <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3"
            />
        </div>

        {/* Imagen */}
        <label className="mb-2 block text-sm font-semibold">
            Imagen de perfil
        </label>
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

        {/* Subir Imagen */}
        {selectedOption === "upload" && (
            <div>
            <input
                type="file"
                name="imagen"
                accept="image/*"
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
            />
            </div>
        )}

        {/* Imagen con IA */}
        {selectedOption === "ia" && (
            <div>
            <input
                type="text"
                placeholder="Escribe el prompt"
                className="block w-full rounded-md border border-gray-300 py-1 px-2"
            />
            <button
                type="button"
                className="py-1 px-4 bg-blue-600 text-white rounded-md mt-2"
            >
                Generar con IA
            </button>
            </div>
        )}

        {/* Preview */}
        {preview && (
            <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Vista previa:</p>
            <img
                src={preview}
                alt="Vista previa"
                className="w-32 h-32 object-cover rounded-md border"
            />
            </div>
        )}

        {/* Botón */}
        <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md"
        >
            Guardar cambios
        </button>
        </form>
    );
};


export default FormularioPerfil;
