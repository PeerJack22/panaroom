import storeProfile from "../../context/storeProfile"

export const CardProfile = () => {
    const { user } = storeProfile()

    const imagenPerfil =
        user?.avatarUrl ||
        "https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900 max-w-xl mx-auto">
            <div className="flex flex-col items-center">
                <img
                    src={imagenPerfil}
                    alt="img-client"
                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                    width={120}
                    height={120}
                />
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{`${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Usuario"}</h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-slate-600 block">Nombre</span>
                    <span className="text-sm font-medium text-slate-900 block mt-1">{user?.nombre || "-"}</span>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-slate-600 block">Apellido</span>
                    <span className="text-sm font-medium text-slate-900 block mt-1">{user?.apellido || "-"}</span>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-slate-600 block">Dirección</span>
                    <span className="text-sm font-medium text-slate-900 block mt-1">{user?.direccion || "-"}</span>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-slate-600 block">Teléfono</span>
                    <span className="text-sm font-medium text-slate-900 block mt-1">{user?.telefono || user?.celular || "-"}</span>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-slate-600 block">Correo</span>
                    <span className="text-sm font-medium text-slate-900 block mt-1">{user?.email || "-"}</span>
                </div>
            </div>
        </div>
    )
}