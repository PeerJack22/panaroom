import edificioPulgar from '../assets/edificioPulgar.png';
import { Link, useParams } from 'react-router';
import { useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

export const Confirm = () => {
    const { token } = useParams();

    const verifyToken = async () => {
        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/confirmar/${token}`;
            const respuesta = await axios.get(url);
            toast.success(respuesta?.data?.msg);
        } catch (error) {
            toast.error(error?.response?.data?.msg);
        }
    };

    useEffect(() => {
        verifyToken();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <ToastContainer />

            <img
                className="h-64 w-64 object-cover border-4 border-slate-600 shadow-md mb-8"
                src={edificioPulgar}
                alt="Confirmación"
            />

            <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 uppercase">¡Todo listo!</p>
                <p className="text-lg md:text-xl text-gray-600 mb-6">Tu cuenta ha sido confirmada. Ya puedes iniciar sesión.</p>
                
                <Link
                    to="/login"
                    className="inline-block bg-blue-700 hover:bg-blue-600 text-white py-2 px-6 rounded-md transition-colors cursor-pointer"
                >
                    Iniciar sesión
                </Link>
            </div>
        </div>
    );
};
