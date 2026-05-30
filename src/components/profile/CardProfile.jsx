import storeProfile from "../../context/storeProfile"

export const CardProfile = () => {
    const { user } = storeProfile()

    const imagenPerfil =
        user?.avatarUrl ||
        "https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"

    return (
        <div className="mx-auto w-full rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-4">
                <img
                    src={imagenPerfil}
                    alt="img-client"
                    className="h-24 w-24 shrink-0 rounded-full border-4 border-slate-100 object-cover shadow-sm"
                    width={96}
                    height={96}
                />
                <div className="min-w-0 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-900 break-words">
                        {`${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Usuario"}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 items-stretch">
                <div className="sm:col-span-2 flex min-w-0 flex-col justify-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center">
                    <span className="text-sm font-semibold text-slate-600">Dirección</span>
                    <span className="mt-0.5 break-words whitespace-normal text-sm font-medium leading-snug text-slate-900">
                        {user?.direccion || "-"}
                    </span>
                </div>

                <div className="flex min-w-0 flex-col justify-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center">
                    <span className="text-sm font-semibold text-slate-600">Teléfono</span>
                    <span className="mt-0.5 break-words whitespace-normal text-sm font-medium leading-snug text-slate-900">
                        {user?.telefono || user?.celular || "-"}
                    </span>
                </div>

                <div className="flex min-w-0 flex-col justify-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center">
                    <span className="text-sm font-semibold text-slate-600">Correo</span>
                    <span className="mt-0.5 break-words whitespace-normal text-sm font-medium leading-snug text-slate-900">
                        {user?.email || "-"}
                    </span>
                </div>
            </div>
        </div>
    )
}