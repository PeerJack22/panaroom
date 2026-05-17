import passwordRecovery from '../assets/passwordRecovery.jpg';
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
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-white px-4"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">Reestablecer contraseña</h1>
            <p className="text-sm md:text-base text-gray-600 mb-6 text-center">Por favor, ingresa tu nueva contraseña</p>

            <img
                className="h-40 w-40 md:h-48 md:w-48 object-cover rounded-2xl border border-gray-200 shadow-sm mb-8"
                src={passwordRecovery}
                alt="Recuperar contraseña"
            />

            {tokenback && (
                <form
                    onSubmit={handleSubmit(changePassword)}
                    className="w-full max-w-sm bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
                >
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nueva contraseña</label>
                        <input
                            type="password"
                            placeholder="Ingresa tu nueva contraseña"
                            {...register("password", { required: "La contraseña es obligatoria" })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
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
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                        />
                        {errors.confirmpassword && (
                            <p className="text-sm text-red-600 mt-1">{errors.confirmpassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar'}
                    </button>

                    <div className="mt-4 border-t border-gray-200" />
                </form>
            )}
        </div>
    );
};

export default Reset;
