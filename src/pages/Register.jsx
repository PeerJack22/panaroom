import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

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
            className="min-h-screen sm:h-screen sm:overflow-hidden flex flex-col sm:flex-row bg-white"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
            {/* Formulario */}
            <div className="w-full sm:w-1/2 sm:h-screen flex justify-center items-center px-6 md:px-8 py-6 md:py-8 bg-white">
                <div className="w-full max-w-md">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">
                        Registro estudiante
                    </h1>
                    <p className="text-gray-600 text-sm text-center sm:text-left mb-5">
                        Crea tu cuenta de estudiante y confirma tu correo para iniciar sesión
                    </p>

                    <form onSubmit={handleSubmit(registro)} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Ingresa tu nombre"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    {...register("nombre", { required: "El nombre es obligatorio" })}
                                />
                                {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido</label>
                                <input
                                    type="text"
                                    placeholder="Ingresa tu apellido"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    {...register("apellido", { required: "El apellido es obligatorio" })}
                                />
                                {errors.apellido && <p className="text-sm text-red-600 mt-1">{errors.apellido.message}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    placeholder="Ingresa tu dirección de domicilio"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    {...register("direccion", { required: "La dirección es obligatoria" })}
                                />
                                {errors.direccion && <p className="text-sm text-red-600 mt-1">{errors.direccion.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Celular</label>
                                <input
                                    type="number"
                                    placeholder="Ingresa tu celular"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    {...register("celular", { required: "El celular es obligatorio" })}
                                />
                                {errors.celular && <p className="text-sm text-red-600 mt-1">{errors.celular.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
                                <input
                                    type="email"
                                    placeholder="Ingresa tu correo electrónico"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    {...register("email", { required: "El correo electrónico es obligatorio" })}
                                />
                                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                            </div>
                        </div>

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
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <FaRegEyeSlash className="w-5 h-5" /> : <FaRegEye className="w-5 h-5" />}
                                </button>
                                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <button className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5 mt-4">
                            Registrarse
                        </button>
                    </form>

                    <div className="mt-4 border-t border-gray-200 pt-3 text-center text-sm text-gray-600 flex justify-between items-center">
                        <p>¿Ya tienes una cuenta?</p>
                        <Link
                            to="/loginEstudiante"
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>

            {/* Imagen lateral decorativa */}
            <div className="hidden sm:block sm:w-1/2 sm:h-screen relative">
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