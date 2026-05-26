import storeProfile from "../../context/storeProfile"

export const CardProfile = () => {
    const { user } = storeProfile()

    const imagenPerfil =
        user?.avatarUrl ||
        "https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-slate-900 max-w-xl mx-auto h-full">
            <div className="flex flex-col items-center">
                <img
                    src={imagenPerfil}
                    alt="img-client"
                    className="h-20 w-20 rounded-full border-4 border-slate-300 object-cover shadow-sm"
                    width={120}
                    height={120}
                />
                <h2 className="mt-3 text-base font-semibold text-slate-900">{`${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Usuario"}</h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 items-stretch">
                <div className="sm:col-span-2 flex flex-col justify-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center">
                    <span className="text-xs font-semibold text-slate-600">Dirección</span>
                    <span className="mt-1 text-sm font-medium text-slate-900">{user?.direccion || "-"}</span>
                </div>

                <div className="flex flex-col justify-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center">
                    <span className="text-xs font-semibold text-slate-600">Teléfono</span>
                    <span className="mt-1 text-sm font-medium text-slate-900">{user?.telefono || user?.celular || "-"}</span>
                </div>

                <div className="flex flex-col justify-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center">
                    <span className="text-xs font-semibold text-slate-600">Correo</span>
                    <span className="mt-1 text-sm font-medium text-slate-900">{user?.email || "-"}</span>
                </div>
            </div>
        </div>
    )
}