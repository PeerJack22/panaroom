import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import storeAuth from "../context/storeAuth";
import storeProfile from "../context/storeProfile";

const STORAGE_KEY = "feedback-items-mock";

const getStoredItems = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveItems = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const formatDate = (isoDate) => {
    try {
        return new Date(isoDate).toLocaleString("es-EC");
    } catch {
        return isoDate;
    }
};

const Feedback = () => {
    const { rol } = storeAuth();
    const { user } = storeProfile();

    const [tipo, setTipo] = useState("queja");
    const [asunto, setAsunto] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [items, setItems] = useState(getStoredItems);

    const roleNormalized = String(rol || "").toLowerCase();
    const isStudent = roleNormalized === "estudiante";
    const isAdmin = roleNormalized === "administrador";

    const myItems = useMemo(() => {
        const userId = user?._id || user?.id;
        return items.filter((item) => item.userId === userId);
    }, [items, user]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const asuntoTrim = asunto.trim();
        const mensajeTrim = mensaje.trim();

        if (!asuntoTrim || !mensajeTrim) {
            toast.error("Completa asunto y mensaje");
            return;
        }

        const newItem = {
            id: crypto?.randomUUID?.() || `${Date.now()}`,
            tipo,
            asunto: asuntoTrim,
            mensaje: mensajeTrim,
            createdAt: new Date().toISOString(),
            userId: user?._id || user?.id || "sin-id",
            userName: `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Usuario",
            estado: "pendiente",
        };

        const updated = [newItem, ...items];
        setItems(updated);
        saveItems(updated);
        setAsunto("");
        setMensaje("");
        setTipo("queja");
        toast.success("Tu mensaje fue registrado correctamente");
    };

    if (!isStudent && !isAdmin) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
                <h1 className="font-black text-3xl text-gray-700">Quejas y sugerencias</h1>
                <p className="mt-4 text-gray-600">Este módulo está disponible para estudiantes y administradores.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="font-black text-4xl text-gray-500">Quejas y sugerencias</h1>
            <hr className="my-4 border-t-2 border-gray-300" />

            {isStudent && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="bg-white border border-gray-200 rounded-xl shadow p-5">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Enviar un mensaje</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="queja">Queja</option>
                                    <option value="sugerencia">Sugerencia</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto</label>
                                <input
                                    type="text"
                                    value={asunto}
                                    onChange={(e) => setAsunto(e.target.value)}
                                    placeholder="Escribe el asunto"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje</label>
                                <textarea
                                    value={mensaje}
                                    onChange={(e) => setMensaje(e.target.value)}
                                    rows={5}
                                    placeholder="Cuéntanos lo que sucede o tu sugerencia"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Enviar
                            </button>
                        </form>
                    </section>

                    <section className="bg-white border border-gray-200 rounded-xl shadow p-5">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Mis envíos</h2>
                        {!myItems.length ? (
                            <p className="text-gray-500">Aún no has enviado quejas o sugerencias.</p>
                        ) : (
                            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                {myItems.map((item) => (
                                    <article key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-semibold text-gray-800">{item.asunto}</p>
                                            <span className="text-xs rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 uppercase">
                                                {item.tipo}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{item.mensaje}</p>
                                        <p className="text-xs text-gray-500 mt-2">{formatDate(item.createdAt)}</p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {isAdmin && (
                <section className="bg-white border border-gray-200 rounded-xl shadow p-5">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Bandeja de quejas y sugerencias</h2>
                    {!items.length ? (
                        <p className="text-gray-500">No existen mensajes registrados.</p>
                    ) : (
                        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                            {items.map((item) => (
                                <article key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-semibold text-gray-800">{item.asunto}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 uppercase">
                                                {item.tipo}
                                            </span>
                                            <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 uppercase">
                                                {item.estado}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{item.mensaje}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Enviado por {item.userName} • {formatDate(item.createdAt)}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default Feedback;