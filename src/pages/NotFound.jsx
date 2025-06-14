import noFound from '../assets/noFound.jpg';
import { Link } from 'react-router';

export const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 px-4">
            <img
                className="object-cover h-80 w-80 border-4 border-solid border-slate-600 shadow-lg"
                src={noFound}
                alt="Imagen no encontrada"
            />

            <div className="flex flex-col items-center justify-center text-center mt-10">
                <p className="text-3xl md:text-4xl font-bold text-blue-900">Página no encontrada</p>
                <p className="text-lg text-gray-600 mt-4">
                    No hemos podido encontrar lo que estás buscando
                </p>

                <Link
                    to="/"
                    className="mt-6 inline-block bg-blue-700 hover:bg-blue-600 text-white py-2 px-6 rounded-md transition-colors"
                >
                    Regresar
                </Link>
            </div>
        </div>
    );
};
