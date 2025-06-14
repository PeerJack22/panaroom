import { Link } from 'react-router';
import useFetch from '../hooks/useFetch'
import { useForm } from 'react-hook-form';
import { ToastContainer} from 'react-toastify'


export const Forgot = () => {

    const { register, handleSubmit, formState: { errors } } = useForm()
    const { fetchDataBackend } = useFetch()

    const sendMail = (data) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/recuperarpassword`
        fetchDataBackend(url, data,'POST')
    }
    
    sendMail()

    return (
        <div className="flex flex-col sm:flex-row h-screen bg-gray-100">

            <ToastContainer/> 

            {/* Sección del formulario */}
            <div className="w-full sm:w-1/2 flex justify-center items-center px-6">
                <div className="w-full max-w-md rounded-lg p-8">
                    <h1 className="text-3xl font-bold mb-2 text-center uppercase text-cyan-400">¿Olvidaste tu contraseña?</h1>
                    <p className="text-gray-500 text-sm text-center mb-6">Ingresa tu correo para restablecerla</p>

                    <form onSubmit={handleSubmit(sendMail)}>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-700"
                            {...register("email", { required: "El correo electrónico es obligatorio" })}
                            />
                            {errors.email && <p className="text-red-800">{errors.email.message}</p>}
                        </div>

                        <div className="mb-6">
                            <button
                                className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-md transition-colors cursor-pointer">
                            Enviar correo
                            </button>
                        </div>
                    </form>

                    <div className="text-sm flex justify-between items-center border-t pt-4">
                        <p className="text-gray-600">¿Ya tienes una cuenta?</p>
                        <Link
                            to="/login"
                            className="bg-blue-700 hover:bg-blue-600 text-white py-1.5 px-4 rounded-md transition-colors cursor-pointer"
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>

            {/* Imagen lateral */}
            <div className="hidden sm:block sm:w-1/2 h-1/3 sm:h-full bg-[url('/public/images/password.jpg')] bg-no-repeat bg-cover bg-center"></div>
        </div>
    );
};
