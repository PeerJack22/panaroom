import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MdInfo } from 'react-icons/md';
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
        <div className="min-h-full bg-slate-50 py-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div className="w-full flex flex-col px-2 md:px-4">
                <header className="mb-6">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Mis residencias</h1>
                    <p className="mt-2 text-sm text-slate-500">Este módulo te permite gestionar tus residencias contratadas.</p>
                    <hr className="mt-4 border-slate-200" />
                </header>

                {!cargando && !error && residencias.length > 0 && (
                    <div className="w-full mt-5 mb-4 p-5 rounded-2xl bg-white shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Filtrar por título"
                                value={filtroNombre}
                                onChange={(e) => setFiltroNombre(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
                            />

                            <select
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
                            >
                                <option value="">Todas las categorías</option>
                                <option value="departamento">Departamento</option>
                                <option value="suit">Suite</option>
                            </select>

                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
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
                            <article key={dep._id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
                                <img
                                    src={dep?.imagenes?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
                                    alt={`Imagen principal de ${dep.titulo}`}
                                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                />

                                <div className="p-6 flex flex-col flex-1 gap-3">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{dep.titulo}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-3">{dep.descripcion}</p>
                                    <p className="text-sm text-gray-700"><span className="font-semibold">Dirección:</span> {dep.direccion}</p>
                                    <p className="text-sm text-blue-700 font-semibold">Precio: $ {dep.precioMensual}</p>

                                    <div className="mt-auto flex items-center justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            title="Más información"
                                            aria-label="Más información"
                                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50"
                                            onClick={() => navigate(`/dashboard/visualizar/${dep._id}`)}
                                        >
                                            <MdInfo className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MisResidencias;