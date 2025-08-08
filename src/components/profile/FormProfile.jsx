import { useState } from "react";
import { useForm } from "react-hook-form";
import storeProfile from "../../context/storeProfile";

export const FormularioPerfil = () => {
    const { user, updateProfile } = storeProfile();

    const [selectedOption, setSelectedOption] = useState("upload");
    const [stateProfileAvatar, setStateProfileAvatar] = useState({
        prompt: "",
        generatedImage: "",
        loading: false,
    });
    const [uploadedPreview, setUploadedPreview] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
        nombre: user?.nombre || "",
        apellido: user?.apellido || "",
        direccion: user?.direccion || "",
        celular: user?.celular || "",
        email: user?.email || "",
        },
    });

    const onSubmit = (data) => {
        console.log("Datos enviados:", data);
        updateProfile(data);
    };

    return (
        <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-gray-900 border border-gray-700 p-6 rounded-lg text-white"
        >
        {/* Nombre */}
        <div className="mb-4">
            <label className="block mb-1">Nombre</label>
            <input
            type="text"
            {...register("nombre", { required: "Este campo es obligatorio" })}
            className="w-full rounded-md border border-gray-500 bg-gray-800 p-2"
            />
            {errors.nombre && (
            <p className="text-red-500 text-sm">{errors.nombre.message}</p>
            )}
        </div>

        {/* Apellido */}
        <div className="mb-4">
            <label className="block mb-1">Apellido</label>
            <input
            type="text"
            {...register("apellido", { required: "Este campo es obligatorio" })}
            className="w-full rounded-md border border-gray-500 bg-gray-800 p-2"
            />
            {errors.apellido && (
            <p className="text-red-500 text-sm">{errors.apellido.message}</p>
            )}
        </div>

        {/* Dirección */}
        <div className="mb-4">
            <label className="block mb-1">Dirección</label>
            <input
            type="text"
            {...register("direccion")}
            className="w-full rounded-md border border-gray-500 bg-gray-800 p-2"
            />
        </div>

        {/* Teléfono */}
        <div className="mb-4">
            <label className="block mb-1">Teléfono</label>
            <input
            type="text"
            {...register("celular")}
            className="w-full rounded-md border border-gray-500 bg-gray-800 p-2"
            />
        </div>

        {/* Correo */}
        <div className="mb-4">
            <label className="block mb-1">Correo</label>
            <input
            type="email"
            {...register("email")}
            className="w-full rounded-md border border-gray-500 bg-gray-800 p-2"
            />
        </div>

        {/* Imagen de perfil: IA o subida */}
        <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-300">
            Imagen de perfil
            </label>

            {/* Opciones */}
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

            {/* Imagen con IA */}
            {selectedOption === "ia" && (
            <div className="mt-4">
                <input
                type="text"
                placeholder="Ingresa el prompt"
                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                value={stateProfileAvatar.prompt}
                onChange={(e) =>
                    setStateProfileAvatar((prev) => ({
                    ...prev,
                    prompt: e.target.value,
                    }))
                }
                />
                <button
                type="button"
                className="mt-3 py-1 px-6 bg-gray-600 text-slate-300 rounded-xl hover:scale-105 duration-300 hover:bg-gray-900 hover:text-white"
                disabled={stateProfileAvatar.loading}
                onClick={() => {
                    setStateProfileAvatar((prev) => ({
                    ...prev,
                    generatedImage:
                        "https://via.placeholder.com/150?text=IA+Image",
                    }));
                }}
                >
                {stateProfileAvatar.loading ? "Generando..." : "Generar con IA"}
                </button>

                {stateProfileAvatar.generatedImage && (
                <img
                    src={stateProfileAvatar.generatedImage}
                    alt="Avatar Generado"
                    className="mt-4 w-24 h-24 object-cover rounded-full border border-gray-500"
                />
                )}
            </div>
            )}

            {/* Subir Imagen */}
            {selectedOption === "upload" && (
            <div className="mt-4">
                <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                {...register("imagenPerfil")}
                onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    setUploadedPreview(previewUrl);
                    } else {
                    setUploadedPreview(null);
                    }
                }}
                />

                {uploadedPreview && (
                <img
                    src={uploadedPreview}
                    alt="Vista previa subida"
                    className="mt-4 w-24 h-24 object-cover rounded-full border border-gray-500"
                />
                )}
            </div>
            )}
        </div>

        {/* Botón Guardar */}
        <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 rounded-md hover:bg-blue-700"
        >
            Guardar
        </button>
        </form>
    );
    };


export default FormularioPerfil;
