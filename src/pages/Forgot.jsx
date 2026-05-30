import { Link } from 'react-router';
import useFetch from '../hooks/useFetch'
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';


const getRecoverEndpointByRole = (roleParam) => {
    const role = String(roleParam || '').toLowerCase();

    if (role === 'administrador' || role === 'admin') {
        return 'administrador/recuperarpassword';
    }

    if (role === 'estudiante') {
        return 'estudiante/recuperarpassword';
    }

    return 'arrendatario/recuperarpassword';
};

export const Forgot = () => {

    const { register, handleSubmit, formState: { errors } } = useForm()
    const { fetchDataBackend } = useFetch()
    const { id } = useParams();

    const initialRole = ["administrador", "estudiante", "arrendatario"].includes(String(id || '').toLowerCase())
        ? String(id).toLowerCase()
        : "";

    const sendMail = (data) => {
        if (!data?.email) return;
        if (!data?.rol) return;

        const endpoint = getRecoverEndpointByRole(data.rol);
        const url = `${import.meta.env.VITE_BACKEND_URL}/${endpoint}`
        fetchDataBackend(url, data,'POST')
    }

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {/* Sección del formulario */}
            <div className="w-full max-w-md flex justify-center items-center">
                <div className="w-full rounded-2xl border border-gray-200 shadow-sm p-8 bg-white">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center text-gray-900">¿Olvidaste tu contraseña?</h1>
                    <p className="text-gray-600 text-sm md:text-base text-center mb-6">Ingresa tu correo para restablecerla</p>

                    <form onSubmit={handleSubmit(sendMail)}>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de acceso</label>
                            <select
                                defaultValue={initialRole}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                {...register("rol", { required: "El tipo de acceso es obligatorio" })}
                            >
                                <option value="arrendatario">Arrendatario</option>
                                <option value="estudiante">Estudiante</option>
                                <option value="administrador">Administrador</option>
                            </select>
                            {errors.rol && <p className="text-red-800">{errors.rol.message}</p>}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                            {...register("email", { required: "El correo electrónico es obligatorio" })}
                            />
                            {errors.email && <p className="text-red-800">{errors.email.message}</p>}
                        </div>

                        <div className="mb-6">
                            <button
                                className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5">
                            Enviar correo
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 border-t border-gray-200 pt-4 text-sm flex justify-between items-center">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Regresar</Link>
                        <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
