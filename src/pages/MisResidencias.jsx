import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import storeAuth from "../context/storeAuth";

const MisResidencias = () => {
    const navigate = useNavigate();
    const { fetchDataBackend } = useFetch();
    const { user, token, rol } = storeAuth();
    const [residencias, setResidencias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const cargarResidencias = async () => {
            if (!token || !user?._id) {
                setError("No se pudo identificar tu sesión.");
                setCargando(false);
                return;
            }

            try {
                setCargando(true);
                const url = `${import.meta.env.VITE_BACKEND_URL}/departamentos`;
                const response = await fetchDataBackend(url, null, "GET", {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                });

                const lista = Array.isArray(response) ? response : [];
                const filtradas = lista.filter((dep) => {
                    const propietarioId = typeof dep?.arrendatario === "object"
                        ? dep?.arrendatario?._id || dep?.arrendatario?.id
                        : dep?.arrendatario;

                    return String(propietarioId || "") === String(user._id || "");
                });

                setResidencias(filtradas);
            } catch (err) {
                console.error("Error al cargar mis residencias:", err);
                setError("No se pudieron cargar tus residencias.");
            } finally {
                setCargando(false);
            }
        };

        if (rol === "estudiante") {
            cargarResidencias();
        } else {
            setCargando(false);
            setError("Esta vista está disponible solo para estudiantes.");
        }
    }, [fetchDataBackend, rol, token, user?._id]);

    return (
        <div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="font-black text-4xl text-gray-500">Mis residencias</h1>
                    <hr className="my-4 border-t-2 border-gray-300" />
                    <p className="mb-8">Aquí verás las residencias asociadas a tu usuario.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/dashboard/crear")}
                    className="h-fit rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
                >
                    Crear residencia
                </button>
            </div>

            {cargando ? (
                <div className="p-4 text-sm text-blue-800 rounded-lg bg-blue-50">
                    <span className="font-medium">Cargando tus residencias...</span>
                </div>
            ) : error ? (
                <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                    <span className="font-medium">{error}</span>
                </div>
            ) : residencias.length === 0 ? (
                <div className="p-4 text-sm text-amber-800 rounded-lg bg-amber-50" role="alert">
                    <span className="font-medium">Aún no tienes residencias registradas.</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {residencias.map((dep) => (
                        <article key={dep._id} className="bg-white rounded-xl border border-gray-200 shadow-lg p-5 flex flex-col gap-3">
                            <img
                                src={dep?.imagenes?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
                                alt={`Imagen principal de ${dep.titulo}`}
                                className="w-full h-40 object-cover rounded-lg border border-gray-200"
                            />

                            <h3 className="text-lg font-bold text-gray-800 leading-tight">{dep.titulo}</h3>
                            <p className="text-sm text-gray-600 line-clamp-3">{dep.descripcion}</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Dirección:</span> {dep.direccion}</p>
                            <p className="text-sm text-blue-800 font-semibold">Precio: $ {dep.precioMensual}</p>

                            <button
                                type="button"
                                className="mt-auto inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                onClick={() => navigate(`/dashboard/visualizar/${dep._id}`)}
                            >
                                Ver detalles
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MisResidencias;