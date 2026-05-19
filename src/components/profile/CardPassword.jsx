import { useForm } from "react-hook-form";
import storeProfile from "../../context/storeProfile";
import storeAuth from "../../context/storeAuth";

const CardPassword = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { user, updatePasswordProfile } = storeProfile();
    const { clearToken } = storeAuth();

    const updatePassword = async (data) => {
        const response = await updatePasswordProfile(data, user._id);
        if (response) {
            clearToken();
        }
    };

    return (
        <>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-xl mx-auto mt-10">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Actualizar contraseña</h1>
                <hr className="border-slate-200 mb-6" />

                <form onSubmit={handleSubmit(updatePassword)}>
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Contraseña actual
                        </label>
                        <input
                            type="password"
                            placeholder="Ingresa tu contraseña actual"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 bg-white outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("passwordactual", { required: "La contraseña actual es obligatoria" })}
                        />
                        {errors.passwordactual && <p className="mt-1 text-xs text-red-600">{errors.passwordactual.message}</p>}
                    </div>

                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Nueva contraseña
                        </label>
                        <input
                            type="password"
                            placeholder="Ingresa la nueva contraseña"
                            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 bg-white outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            {...register("passwordnuevo", { required: "La nueva contraseña es obligatoria" })}
                        />
                        {errors.passwordnuevo && <p className="mt-1 text-xs text-red-600">{errors.passwordnuevo.message}</p>}
                    </div>

                    <input
                        type="submit"
                        value="Cambiar"
                        className="w-full py-2 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 transition-colors font-semibold text-white uppercase cursor-pointer"
                    />
                </form>
            </div>
        </>
    );
};

export default CardPassword;