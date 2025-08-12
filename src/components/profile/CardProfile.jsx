import storeProfile from "../../context/storeProfile"

export const CardProfile = () => {
    const { user } = storeProfile()

    // Selección de imagen de perfil: primero la subida (avatarUrl), luego la generada por IA, luego default
    const imagenPerfil =
        user?.avatarUrl ||
        user?.avatarArrenIA ||
        "https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"

    return (
        <div className="bg-gray-900 border border-gray-700 h-auto p-6 
                        flex flex-col items-center justify-between shadow-lg rounded-xl text-white">

        <div className="relative mb-6">
            <img
                src={imagenPerfil}
                alt="img-client"
                className="m-auto border-4 border-gray-600 object-cover rounded-full"
                width={120}
                height={120}
            />
            {/* Etiqueta si la imagen es generada por IA */}
            {user?.avatarType === "ia" && (
                <p className="text-xs text-gray-400 mt-2 text-center">Imagen generada por IA</p>
            )}
        </div>

        <div className="self-start mb-2">
            <b className="text-gray-300">Nombre:</b>
            <p className="inline-block ml-3 text-white">{user?.nombre}</p>
        </div>
        <div className="self-start mb-2">
            <b className="text-gray-300">Apellido:</b>
            <p className="inline-block ml-3 text-white">{user?.apellido}</p>
        </div>
        <div className="self-start mb-2">
            <b className="text-gray-300">Dirección:</b>
            <p className="inline-block ml-3 text-white">{user?.direccion}</p>
        </div>
        <div className="self-start mb-2">
            <b className="text-gray-300">Teléfono:</b>
            <p className="inline-block ml-3 text-white">{user?.celular}</p>
        </div>
        <div className="self-start">
            <b className="text-gray-300">Correo:</b>
            <p className="inline-block ml-3 text-white">{user?.email}</p>
        </div>
        </div>
    )
}
