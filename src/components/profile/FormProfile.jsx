const FormularioPerfil = () => {
    return (
        <form className="bg-gray-900 p-6 rounded-xl shadow-lg text-white max-w-xl mx-auto mt-10">
            <h2 className="text-2xl font-bold text-slate-200 mb-6">Editar perfil</h2>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Nombre</label>
                <input
                    type="text"
                    placeholder="Ingresa tu nombre"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Apellido</label>
                <input
                    type="text"
                    placeholder="Ingresa tu apellido"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Dirección</label>
                <input
                    type="text"
                    placeholder="Ingresa tu dirección"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Teléfono</label>
                <input
                    type="number"
                    placeholder="Ingresa tu teléfono"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Correo electrónico</label>
                <input
                    type="email"
                    placeholder="Ingresa tu correo"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <input
                type="submit"
                value="Actualizar"
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold uppercase rounded-lg transition-all"
            />
        </form>
    );
};

export default FormularioPerfil;
