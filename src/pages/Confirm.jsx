import edificioPulgar from '../assets/edificioPulgar.png';
import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

export const Confirm = () => {
    const { token } = useParams();
    const [confirmStatus, setConfirmStatus] = useState('loading');
    const [confirmMessage, setConfirmMessage] = useState('Verificando tu cuenta...');

    const verifyToken = useCallback(async () => {
        const endpoints = [
            `${import.meta.env.VITE_BACKEND_URL}/confirmar/${token}`,
            `${import.meta.env.VITE_BACKEND_URL}/confirmarEstudiante/${token}`,
        ];

        let lastError;

        for (const url of endpoints) {
            try {
                const respuesta = await axios.get(url);
                const msg = respuesta?.data?.msg || 'Cuenta confirmada correctamente.';
                setConfirmStatus('success');
                setConfirmMessage(msg);
                toast.success(msg);
                return;
            } catch (error) {
                lastError = error;
            }
        }

        const msg = lastError?.response?.data?.msg || 'No se pudo confirmar la cuenta. El enlace puede haber expirado.';
        setConfirmStatus('error');
        setConfirmMessage(msg);
        toast.error(msg);
    }, [token]);

    useEffect(() => {
        verifyToken();
    }, [verifyToken]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <ToastContainer />

            <img
                className="h-64 w-64 object-cover border-4 border-slate-600 shadow-md mb-8"
                src={edificioPulgar}
                alt="Confirmación"
            />

            <div className="text-center">
                {confirmStatus === 'loading' && (
                    <>
                        <p className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 uppercase">Verificando cuenta</p>
                        <p className="text-lg md:text-xl text-gray-600 mb-6">{confirmMessage}</p>
                    </>
                )}

                {confirmStatus === 'success' && (
                    <>
                        <p className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 uppercase">¡Todo listo!</p>
                        <p className="text-lg md:text-xl text-gray-600 mb-6">{confirmMessage}</p>
                        <Link
                            to="/loginEstudiante"
                            className="inline-block bg-blue-700 hover:bg-blue-600 text-white py-2 px-6 rounded-md transition-colors cursor-pointer"
                        >
                            Iniciar sesión
                        </Link>
                    </>
                )}

                {confirmStatus === 'error' && (
                    <>
                        <p className="text-3xl md:text-4xl font-bold text-red-700 mb-4 uppercase">No se pudo confirmar</p>
                        <p className="text-lg md:text-xl text-gray-600 mb-6">{confirmMessage}</p>
                        <Link
                            to="/register"
                            className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-6 rounded-md transition-colors cursor-pointer"
                        >
                            Volver a registrarme
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};
