import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import storeAuth from '../context/storeAuth';

const Login = () => {
    const navigate = useNavigate()
    const location = useLocation();
    const isStudentLogin = location.pathname === '/loginEstudiante';
    const [tipoAcceso, setTipoAcceso] = useState(isStudentLogin ? 'estudiante' : 'arrendatario');
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm()
    const { setToken, setRol, setUser } = storeAuth(); 

useEffect(() => {
    setTipoAcceso(isStudentLogin ? 'estudiante' : 'arrendatario');
}, [isStudentLogin]);

const loginUser = async (data) => {
    const loadingToast = toast.loading('Procesando solicitud...');

    try {
        const endpointCandidates =
            tipoAcceso === 'estudiante'
                ? ['loginEstudiante']
                : tipoAcceso === 'administrador'
                    ? ['loginAd']
                    : ['login'];

        let response = null;
        let lastError = null;

        for (const endpoint of endpointCandidates) {
            try {
                const url = `${import.meta.env.VITE_BACKEND_URL}/${endpoint}`;
                const { data: loginResponse } = await axios.post(url, data, {
                    headers: { 'Content-Type': 'application/json' },
                });
                response = loginResponse;
                break;
            } catch (error) {
                lastError = error;
                const status = error?.response?.status;
                if (status !== 401) break;
            }
        }

        if (!response) {
            const backendMsg =
                lastError?.response?.data?.msg ||
                lastError?.response?.data?.message ||
                'No se pudo iniciar sesión. Verifica tus credenciales.';
            toast.dismiss(loadingToast);
            toast.error(backendMsg);
            return;
        }

        const rolRecibido = String(response.rol || '').toLowerCase();

        if (tipoAcceso === 'estudiante' && rolRecibido !== 'estudiante') {
            toast.dismiss(loadingToast);
            toast.error('Seleccionaste Estudiante, pero la cuenta no es de estudiante.');
            return;
        }

        if (tipoAcceso === 'arrendatario' && rolRecibido === 'estudiante') {
            toast.dismiss(loadingToast);
            toast.error('Seleccionaste Arrendatario, pero la cuenta es de estudiante.');
            return;
        }

        if (tipoAcceso === 'administrador' && rolRecibido !== 'administrador') {
            toast.dismiss(loadingToast);
            toast.error('Seleccionaste Administrador, pero la cuenta no es de administrador.');
            return;
        }

        if (tipoAcceso !== 'administrador' && rolRecibido === 'administrador') {
            toast.dismiss(loadingToast);
            toast.error('Seleccionaste un tipo de acceso incorrecto para una cuenta de administrador.');
            return;
        }

        setToken(response.token);
        setRol(response.rol);

        // Construye el objeto user manualmente
        const user = {
            _id: response._id,
            nombre: response.nombre,
            apellido: response.apellido,
            direccion: response.direccion,
            celular: response.celular,
            // agrega aquí cualquier otro dato que necesites
        };
        setUser(user);

        toast.dismiss(loadingToast);
        navigate('/dashboard');
    } catch (error) {
        toast.dismiss(loadingToast);
        console.error("Error en el login:", error);
        const msg = error?.response?.data?.msg || error?.response?.data?.message || 'No se pudo iniciar sesión';
        toast.error(msg);
    }
};

    return (
        <div className="flex flex-col sm:flex-row h-screen">
            <ToastContainer />
            {/* Imagen LCP visible y detectable desde el HTML */}
            <div className="w-full sm:w-1/2 h-1/3 sm:h-screen hidden sm:block">
                <img
                    src="/images/edificio2.webp"
                    alt="Edificio del proyecto PanaRoom"
                    className="w-full h-full object-cover object-center"
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                />
            </div>

            {/* Contenedor de formulario */}
            <div className="w-full sm:w-1/2 h-screen bg-white flex justify-center items-center px-6">
                <div className="md:w-4/5 sm:w-full">
                    <h1 className="text-3xl font-bold mb-2 text-center uppercase text-blue-800">
                        Login
                    </h1>
                    <small className="text-gray-500 block my-4 text-sm text-center">Ingresa tus datos porfavor</small>

                    <form onSubmit={handleSubmit(loginUser)}>
                        {/* Tipo de acceso */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de acceso</label>
                            <select
                                value={tipoAcceso}
                                onChange={(e) => setTipoAcceso(e.target.value)}
                                className="w-full rounded-md border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2 px-3 text-gray-700 bg-white"
                            >
                                <option value="arrendatario">Arrendatario</option>
                                <option value="estudiante">Estudiante</option>
                                <option value="administrador">Administrador</option>
                            </select>
                        </div>

                        {/* Correo electrónico */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
                            <input
                                type="email"
                                placeholder="Ingresa tu correo"
                                className="w-full rounded-md border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2 px-3 text-gray-700"
                                {...register("email", { required: "El correo es obligatorio" })}
                            />
                            {errors.email && <p className="text-red-800">{errors.email.message}</p>}
                        </div>

                        {/* Contraseña */}
                        <div className="mb-4 relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="********************"
                                    className="w-full rounded-md border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2 px-3 pr-10 text-gray-700"
                                    {...register("password", { required: "La contraseña es obligatoria" })}
                                />
                                {errors.password && <p className="text-red-800">{errors.password.message}</p>}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute top-2.5 right-3 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A9.956 9.956 0 0112 19c-4.418 0-8.165-2.928-9.53-7a10.005 10.005 0 0119.06 0 9.956 9.956 0 01-1.845 3.35M9.9 14.32a3 3 0 114.2-4.2m.5 3.5l3.8 3.8m-3.8-3.8L5.5 5.5" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9.95 0a9.96 9.96 0 0119.9 0m-19.9 0a9.96 9.96 0 0119.9 0M3 3l18 18" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Botón de iniciar sesión */}
                        <div className="my-4">
                            <button className="py-2 w-full block text-center bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition duration-300">Iniciar sesión</button>
                        </div>

                        {/* Separador Ó */}
                        <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="mx-4 text-gray-500">Ó</span>
                            <div className="flex-grow border-t border-gray-300"></div>
                        </div>

                        {/* Botón de Google */}
                        <div className="my-4">
                            <button
                                onClick={() => {
                                    toast.info('Redirigiendo a Google...', {
                                        position: "top-right",
                                        autoClose: 2000
                                    });
                                    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
                                }}
                                className="py-2 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl shadow hover:bg-gray-100 transition duration-300"
                            >
                                <img
                                    src="https://developers.google.com/identity/images/g-logo.png"
                                    alt="Logo Google"
                                    className="w-6 h-6"
                                />
                                <span className="text-gray-700 font-medium">Iniciar sesión con Google</span>
                            </button>
                        </div>
                    </form>

                    {/* Olvidaste tu contraseña */}
                    <div className="mt-6 text-xs text-center">
                        <Link to="/forgot/id" className="text-gray-500 underline hover:text-blue-700">¿Olvidaste tu contraseña?</Link>
                    </div>

                    {/* Enlaces */}
                    <div className="mt-6 text-sm flex justify-between items-center">
                        <Link to="/" className="text-gray-500 underline hover:text-blue-700">Regresar</Link>
                        <Link to="/register" className="py-2 px-5 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition duration-300">
                            Registrarse
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;