import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import { ToastContainer } from 'react-toastify';
import storeAuth from '../context/storeAuth';

const Login = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm()
    const { fetchDataBackend } = useFetch()
    const { setToken, setRol } = storeAuth()

const loginUser = async (data) => {
    const isAdmin = data.email === 'admin@gmail.com';
    const url = `${import.meta.env.VITE_BACKEND_URL}/${isAdmin ? 'loginAd' : 'login'}`;

    const response = await fetchDataBackend(url, data, 'POST');

    if (response) {
        setToken(response.token);
        setRol(response.rol);

        // Redirige dependiendo del rol
        if (isAdmin) {
            navigate('/dashboard');
        } else {
            navigate('/dashboard');
        }
    }
};


    return (
        <div className="flex flex-col sm:flex-row h-screen">
            <ToastContainer />
            {/* Imagen de fondo */}
            <div className="w-full sm:w-1/2 h-1/3 sm:h-screen bg-[url('/public/images/edificio2.jpg')] 
                bg-no-repeat bg-cover bg-center hidden sm:block" />

            {/* Contenedor de formulario */}
            <div className="w-full sm:w-1/2 h-screen bg-white flex justify-center items-center px-6">
                <div className="md:w-4/5 sm:w-full">
                    <h1 className="text-3xl font-bold mb-2 text-center uppercase text-blue-800">Bienvenido(a) de nuevo</h1>
                    <small className="text-gray-500 block my-4 text-sm text-center">Ingresa tus datos porfavor</small>

                    <form onSubmit={handleSubmit(loginUser)}>
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
                                onClick={() => window.location.href = "http://localhost:5000/auth/google"}
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
