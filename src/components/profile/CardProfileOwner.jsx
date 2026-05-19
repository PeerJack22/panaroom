export const CardProfileOwner = () => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900 w-full max-w-md mx-auto">
            <div className="flex flex-col items-center mb-6">
                <img
                    src="https://cdn-icons-png.flaticon.com/512/4715/4715329.png"
                    alt="img-owner"
                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-100"
                    width={120}
                    height={120}
                />
                <h2 className="text-lg font-semibold mt-4 text-slate-900">Arrendador</h2>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Nombre completo</span>
                    <span className="text-sm font-medium text-slate-900">[Nombre]</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Cédula</span>
                    <span className="text-sm font-medium text-slate-900">[Cédula]</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Correo electrónico</span>
                    <span className="text-sm font-medium text-slate-900">[Correo]</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Teléfono</span>
                    <span className="text-sm font-medium text-slate-900">[Teléfono]</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Residencias registradas</span>
                    <span className="text-sm font-medium text-slate-900">[Cantidad o nombres]</span>
                </div>
            </div>
        </div>
    );
};