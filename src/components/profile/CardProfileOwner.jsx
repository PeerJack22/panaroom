export const CardProfileOwner = () => {
    return (
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-lg text-white w-full max-w-md mx-auto">
            
            <div className="flex flex-col items-center mb-6">
                <img 
                    src="https://cdn-icons-png.flaticon.com/512/4715/4715329.png" 
                    alt="img-owner" 
                    className="rounded-full border-4 border-blue-700" 
                    width={120} 
                    height={120} 
                />
                <h2 className="text-lg font-semibold mt-4">Arrendador</h2>
            </div>

            <div className="mb-3">
                <b className="text-blue-400">Nombre completo:</b>
                <p className="ml-2 inline-block text-gray-300">[Nombre]</p>
            </div>
            <div className="mb-3">
                <b className="text-blue-400">Cédula:</b>
                <p className="ml-2 inline-block text-gray-300">[Cédula]</p>
            </div>
            <div className="mb-3">
                <b className="text-blue-400">Correo electrónico:</b>
                <p className="ml-2 inline-block text-gray-300">[Correo]</p>
            </div>
            <div className="mb-3">
                <b className="text-blue-400">Teléfono:</b>
                <p className="ml-2 inline-block text-gray-300">[Teléfono]</p>
            </div>
            <div className="mb-1">
                <b className="text-blue-400">Residencias registradas:</b>
                <p className="ml-2 inline-block text-gray-300">[Cantidad o nombres de residencias]</p>
            </div>
        </div>
    );
};
