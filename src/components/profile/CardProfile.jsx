import storeProfile from "../../context/storeProfile"

export const CardProfile = () => {
    const {user} = storeProfile() 
    return (
        <div className="bg-gray-900 border border-gray-700 h-auto p-6 
                        flex flex-col items-center justify-between shadow-lg rounded-xl text-white">

            <div className="relative mb-6">
                <img
                    src="https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"
                    alt="img-client"
                    className="m-auto border-4 border-gray-600"
                    width={120}
                    height={120}
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 cursor-pointer hover:bg-cyan-500 shadow-md">
                    📷
                    <input type="file" accept="image/*" className="hidden" />
                </label>
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
    );
};
