import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { toast } from 'react-toastify';
import storeAuth from '../context/storeAuth';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';



const Login = () => {
    const navigate = useNavigate()
    const location = useLocation();
    const [tipoAcceso, setTipoAcceso] = useState('arrendatario');
    const [showPassword, setShowPassword] = useState(false);
    
    const { register, handleSubmit, formState: { errors } } = useForm()
    const { token, setToken, setRol, setUser } = storeAuth();

    useEffect(() => {
        // Mantener el tipo de acceso actual en el estado; por defecto 'arrendatario'.
    }, []);

const loginUser = async (data) => {
    const loadingToast = toast.loading('Procesando solicitud...');

    try {
        const endpointCandidates =
            tipoAcceso === 'estudiante'
                ? ['loginEstudiante']
                : tipoAcceso === 'administrador'
                    ? ['loginAd']
                    : ['arrendatario/login'];

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
        navigate('/dashboard', { replace: true });
    } catch (error) {
        toast.dismiss(loadingToast);
        console.error("Error en el login:", error);
        const msg = error?.response?.data?.msg || error?.response?.data?.message || 'No se pudo iniciar sesión';
        toast.error(msg);
    }
};

    return (
        <div className="flex flex-col sm:flex-row h-screen bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
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
                        Inicio de sesión
                    </h1>
                    <small className="text-gray-500 block my-4 text-sm text-center">Ingresa tus datos</small>

                    <form onSubmit={handleSubmit(loginUser)}>
                        {/* Tipo de acceso */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de acceso</label>
                            <select
                                value={tipoAcceso}
                                onChange={(e) => setTipoAcceso(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
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
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
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
                                    placeholder="Crea una contraseña segura"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    {...register("password", { required: "La contraseña es obligatoria" })}
                                />
                                {errors.password && <p className="text-red-800">{errors.password.message}</p>}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute top-2.5 right-3 text-gray-500 hover:text-blue-600 transition-colors"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <FaRegEyeSlash className="w-5 h-5" /> : <FaRegEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Botón de iniciar sesión */}
                        <div className="my-4">
                            <button className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5">Iniciar sesión</button>
                        </div>
                    </form>

                    {/* Olvidaste tu contraseña */}
                    <div className="mt-6 text-xs text-center">
                        <Link to={`/forgot/${tipoAcceso}`} className="text-gray-500 underline hover:text-blue-700">¿Olvidaste tu contraseña?</Link>
                    </div>

                    {/* Enlaces */}
                    <div className="mt-6 text-sm flex justify-between items-center">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Regresar</Link>
                        <Link to="/register" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5">
                            Registrarse
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;