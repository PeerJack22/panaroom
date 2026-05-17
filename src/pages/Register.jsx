import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";

export const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const registro = async (data) => {
        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/registroEstudiante`;
            const respuesta = await axios.post(url, data);
            toast.success(respuesta.data.msg);
        } catch (error) {
            toast.error(error.response?.data?.msg || "Error al registrarse");
        }
    };

    return (
        <div
            className="flex flex-col sm:flex-row min-h-screen bg-white"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
            {/* Formulario */}
            <div className="w-full sm:w-1/2 flex justify-center items-center px-6 md:px-10 py-10 md:py-12 bg-white">
                <div className="w-full max-w-md">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-center sm:text-left">
                        Registro estudiante
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base text-center sm:text-left mb-8">
                        Crea tu cuenta de estudiante y confirma tu correo para iniciar sesión
                    </p>

                    <form onSubmit={handleSubmit(registro)} className="space-y-4">
                        {[
                            { label: "Nombre", name: "nombre", type: "text", placeholder: "Ingresa tu nombre" },
                            { label: "Apellido", name: "apellido", type: "text", placeholder: "Ingresa tu apellido" },
                            { label: "Dirección", name: "direccion", type: "text", placeholder: "Ingresa tu dirección de domicilio" },
                            { label: "Celular", name: "celular", type: "number", placeholder: "Ingresa tu celular" },
                            { label: "Correo electrónico", name: "email", type: "email", placeholder: "Ingresa tu correo electrónico" },
                        ].map(({ label, name, type, placeholder }) => (
                            <div key={name}>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                                <input
                                    type={type}
                                    placeholder={placeholder}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    {...register(name, { required: `El ${label.toLowerCase()} es obligatorio` })}
                                />
                                {errors[name] && <p className="text-sm text-red-600 mt-1">{errors[name].message}</p>}
                            </div>
                        ))}

                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                            <div className="relative mt-1">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Crea una contraseña segura"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    {...register("password", { required: "La contraseña es obligatoria" })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute top-2.5 right-3 text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.875 18.825A9.956 9.956 0 0112 19c-4.418 0-8.165-2.928-9.53-7a10.005 10.005 0 0119.06 0 9.956 9.956 0 01-1.845 3.35M9.9 14.32a3 3 0 114.2-4.2m.5 3.5l3.8 3.8m-3.8-3.8L5.5 5.5"
                                            />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9.95 0a9.96 9.96 0 0119.9 0m-19.9 0a9.96 9.96 0 0119.9 0M3 3l18 18"
                                            />
                                        </svg>
                                    )}
                                </button>
                                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md mt-6">
                            Registrarse
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-600 flex justify-between items-center">
                        <p>¿Ya tienes una cuenta?</p>
                        <Link
                            to="/loginEstudiante"
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-xl font-semibold transition-all shadow-sm"
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>

            {/* Imagen lateral decorativa */}
            <div className="hidden sm:block sm:w-1/2 relative">
                <img
                    src="/images/apartamento1.webp"
                    alt="Apartamento de referencia"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    sizes="50vw"
                />
                <div className="absolute inset-0 bg-blue-900/20" />
            </div>
        </div>
    );
};