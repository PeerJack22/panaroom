import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import storeAuth from "../context/storeAuth";

const MisResidencias = () => {
    const navigate = useNavigate();
    const { fetchDataBackend } = useFetch();
    const { token, rol } = storeAuth();
    const [residencias, setResidencias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");

    useEffect(() => {
        const cargarResidencias = async () => {
            if (!token) {
                setError("No se pudo identificar tu sesión.");
                setCargando(false);
                return;
            }

            try {
                setCargando(true);
                const url = `${import.meta.env.VITE_BACKEND_URL}/estudiante/departamentos`;
                const response = await fetchDataBackend(url, null, "GET", {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                });

                const lista = Array.isArray(response) ? response : [];
                setResidencias(lista);
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
    }, [fetchDataBackend, rol, token]);

    // Obtener categorías únicas para el filtro
    const categorias = useMemo(() => {
        const cats = residencias
            .map((dep) => dep.categoria)
            .filter((cat) => cat && cat.trim() !== "");
        return [...new Set(cats)].sort();
    }, [residencias]);

    // Filtrar residencias según nombre y categoría
    const residenciasFiltradas = useMemo(() => {
        return residencias.filter((dep) => {
            const coincideNombre =
                !filtroNombre ||
                (dep.titulo || "").toLowerCase().includes(filtroNombre.toLowerCase());
            const coincideCategoria = !filtroCategoria || dep.categoria === filtroCategoria;

            return coincideNombre && coincideCategoria;
        });
    }, [residencias, filtroNombre, filtroCategoria]);

    const limpiarFiltros = () => {
        setFiltroNombre("");
        setFiltroCategoria("");
    };

    return (
        <div>
            <div>
                <h1 className="font-black text-4xl text-gray-500">Mis residencias</h1>
                <hr className="my-4 border-t-2 border-gray-300" />
                <p className="mb-6">Módulo para gestionar tus residencias asignadas.</p>
            </div>

            {!cargando && !error && residencias.length > 0 && (
                <div className="w-full mt-5 mb-4 p-4 rounded-lg bg-white shadow-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Filtrar por título"
                            value={filtroNombre}
                            onChange={(e) => setFiltroNombre(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="w-full md:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            )}

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
                    <span className="font-medium">Aún no tienes residencias asignadas.</span>
                </div>
            ) : residenciasFiltradas.length === 0 ? (
                <div className="p-4 text-sm text-amber-800 rounded-lg bg-amber-50" role="alert">
                    <span className="font-medium">No se encontraron residencias que coincidan con tus filtros.</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {residenciasFiltradas.map((dep) => (
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