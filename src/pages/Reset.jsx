import passwordRecovery from '../assets/passwordRecovery.jpg';
import { ToastContainer } from 'react-toastify';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';

const roleToPrefix = {
    administrador: 'administrador',
    arrendatario: 'arrendatario',
    estudiante: 'estudiante',
};

const normalizeRole = (value) => {
    const role = String(value || '').toLowerCase();
    return roleToPrefix[role] ? role : null;
};

const getCandidatePrefixes = (roleParam) => {
    const normalizedRole = normalizeRole(roleParam);
    if (normalizedRole) return [roleToPrefix[normalizedRole]];
    return ['administrador', 'arrendatario', 'estudiante'];
};

const Reset = () => {
    const { token, rol } = useParams();
    const navigate = useNavigate();
    const [tokenback, setTokenBack] = useState(false);
    const [resolvedPrefix, setResolvedPrefix] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const changePassword = async (data) => {
        if (!token || !resolvedPrefix || isSubmitting) return;

        setIsSubmitting(true);
        const loadingToast = toast.loading('Procesando solicitud...');

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/${resolvedPrefix}/nuevopassword/${token}`;
            const response = await axios.post(url, data, {
                headers: { 'Content-Type': 'application/json' },
            });

            toast.dismiss(loadingToast);
            toast.success(response?.data?.msg || 'Contraseña actualizada correctamente');

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            toast.dismiss(loadingToast);
            const errorMessage =
                error?.response?.data?.msg ||
                error?.response?.data?.message ||
                'No se pudo actualizar la contraseña';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenBack(false);
                return;
            }

            const prefixes = getCandidatePrefixes(rol);

            for (const prefix of prefixes) {
                try {
                    const url = `${import.meta.env.VITE_BACKEND_URL}/${prefix}/recuperarpassword/${token}`;
                    await axios.get(url);
                    setResolvedPrefix(prefix);
                    setTokenBack(true);
                    return;
                } catch {
                    // Probar siguiente prefijo cuando falle la validación en este rol.
                }
            }

            setTokenBack(false);
            toast.error('El enlace de recuperación no es válido o expiró.');
        };

        verifyToken();
    }, [token, rol]);

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
                        disabled={isSubmitting}
                        className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-gray-500 text-white py-2 rounded-md transition-colors cursor-pointer"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default Reset;
