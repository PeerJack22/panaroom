import { useForm } from "react-hook-form";
import { ToastContainer } from 'react-toastify';
import storeProfile from "../../context/storeProfile";
import storeAuth from "../../context/storeAuth";

const CardPassword = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { user, updatePasswordProfile } = storeProfile();
    const { clearToken } = storeAuth();

    // Verificar si el usuario es administrador o si tiene googleId
    if (user?.rol === "administrador" || user?.googleId) {
        return null; // No renderiza nada si es administrador o tiene googleId
    }

    const updatePassword = async (data) => {
        const response = await updatePasswordProfile(data, user._id);
        if (response) {
            clearToken();
        }
    };

    return (
        <>
            <ToastContainer />
            <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white max-w-xl mx-auto mt-10">
                <h1 className="text-2xl font-bold text-slate-200 mb-4">Actualizar contraseña</h1>
                <hr className="border-gray-600 mb-6" />

                <form onSubmit={handleSubmit(updatePassword)}>
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contraseña actual
                        </label>
                        <input
                            type="password"
                            placeholder="Ingresa tu contraseña actual"
                            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register("passwordactual", { required: "La contraseña actual es obligatoria" })}
                        />
                        {errors.passwordactual && <p className="text-red-800">{errors.passwordactual.message}</p>}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nueva contraseña
                        </label>
                        <input
                            type="password"
                            placeholder="Ingresa la nueva contraseña"
                            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register("passwordnuevo", { required: "La nueva contraseña es obligatoria" })}
                        />
                        {errors.passwordnuevo && <p className="text-red-800">{errors.passwordnuevo.message}</p>}
                    </div>

                    <input
                        type="submit"
                        value="Cambiar"
                        className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 transition-all rounded-lg font-semibold text-white uppercase cursor-pointer"
                    />
                </form>
            </div>
        </>
    );
};

export default CardPassword;
