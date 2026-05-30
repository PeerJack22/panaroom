import { useForm } from "react-hook-form";
import { useState } from "react";
import storeProfile from "../../context/storeProfile";
import storeAuth from "../../context/storeAuth";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const CardPassword = () => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
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
            <div className="mx-auto mt-0 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-3 shadow-sm xl:mt-auto">
                <h1 className="mb-2 text-base font-bold text-slate-900">Actualizar contraseña</h1>
                <hr className="mb-3 border-slate-200" />

                <form onSubmit={handleSubmit(updatePassword)}>
                    <div className="mb-3">
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Contraseña actual
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="Ingresa tu contraseña actual"
                                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 pr-10 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                {...register("passwordactual", { required: "La contraseña actual es obligatoria" })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                className="absolute top-3 right-3 text-gray-500 hover:text-blue-600 transition-colors"
                                aria-label={showCurrentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                            >
                                {showCurrentPassword ? <FaRegEyeSlash className="w-5 h-5" /> : <FaRegEye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.passwordactual && <p className="mt-1 text-xs text-red-600">{errors.passwordactual.message}</p>}
                    </div>

                    <div className="mb-3">
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Nueva contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Ingresa la nueva contraseña"
                                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 pr-10 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                {...register("passwordnuevo", { 
                                    required: "La nueva contraseña es obligatoria",
                                    minLength: { value: 8, message: "Mínimo 8 caracteres" },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/,
                                        message: "Debe incluir mayúscula, minúscula, número y carácter especial"
                                    }
                                })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                className="absolute top-3 right-3 text-gray-500 hover:text-blue-600 transition-colors"
                                aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                            >
                                {showNewPassword ? <FaRegEyeSlash className="w-5 h-5" /> : <FaRegEye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.passwordnuevo && <p className="mt-1 text-xs text-red-600">{errors.passwordnuevo.message}</p>}
                    </div>

                    <input
                        type="submit"
                        value="Cambiar"
                        className="w-full rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-lg hover:bg-blue-700 hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                    />
                </form>
            </div>
        </>
    );
};

export default CardPassword;