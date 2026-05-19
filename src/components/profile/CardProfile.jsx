import storeProfile from "../../context/storeProfile"

export const CardProfile = () => {
    const { user } = storeProfile()

    const imagenPerfil =
        user?.avatarUrl ||
        "https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900 max-w-xl mx-auto">
            <div className="relative mb-6 flex justify-center">
                <img
                    src={imagenPerfil}
                    alt="img-client"
                    className="w-28 h-28 rounded-lg object-cover border-4 border-slate-100"
                    width={120}
                    height={120}
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Nombre</span>
                    <span className="text-sm font-medium text-slate-900">{user?.nombre || "-"}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Apellido</span>
                    <span className="text-sm font-medium text-slate-900">{user?.apellido || "-"}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Dirección</span>
                    <span className="text-sm font-medium text-slate-900">{user?.direccion || "-"}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Teléfono</span>
                    <span className="text-sm font-medium text-slate-900">{user?.telefono || user?.celular || "-"}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Correo</span>
                    <span className="text-sm font-medium text-slate-900">{user?.email || "-"}</span>
                </div>
            </div>
        </div>
    )
}