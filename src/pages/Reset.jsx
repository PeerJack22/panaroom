import passwordRecovery from '../assets/passwordRecovery.jpg';
import { ToastContainer } from 'react-toastify';
import { useEffect, useState } from 'react';
import useFetch from '../hooks/useFetch';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';

const Reset = () => {
    const { fetchDataBackend } = useFetch();
    const { token } = useParams();
    const navigate = useNavigate();
    const [tokenback, setTokenBack] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const changePassword = (data) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/nuevopassword/${token}`;
        fetchDataBackend(url, data, 'POST');
        setTimeout(() => {
            navigate('/login');   
        }, 3000);
    };

    useEffect(() => {
        const verifyToken = async () => {
            const url = `${import.meta.env.VITE_BACKEND_URL}/recuperarpassword/${token}`;
            fetchDataBackend(url, null, 'GET');
            setTokenBack(true);
        };
        verifyToken();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <ToastContainer />
            
            <h1 className="text-3xl font-bold text-blue-900 text-center mb-2 uppercase">Reestablecer contraseña</h1>
            <p className="text-sm text-gray-600 mb-6 text-center">Por favor, ingresa tu nueva contraseña</p>

            <img
                className="h-64 w-64 object-cover border-4 border-slate-600 shadow-md mb-8"
                src={passwordRecovery}
                alt="Recuperar contraseña"
            />

            {tokenback && (
                <form
                    onSubmit={handleSubmit(changePassword)}
                    className="w-full max-w-sm bg-white p-6 rounded-md shadow-md"
                >
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nueva contraseña</label>
                        <input
                            type="password"
                            placeholder="Ingresa tu nueva contraseña"
                            {...register("password", { required: "La contraseña es obligatoria" })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
                        />
                        {errors.password && (
                            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar contraseña</label>
                        <input
                            type="password"
                            placeholder="Repite tu contraseña"
                            {...register("confirmpassword", { required: "La confirmación es obligatoria" })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
                        />
                        {errors.confirmpassword && (
                            <p className="text-sm text-red-600 mt-1">{errors.confirmpassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-md transition-colors cursor-pointer"
                    >
                        Enviar
                    </button>
                </form>
            )}
        </div>
    );
};

export default Reset;
