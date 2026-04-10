import { MdDeleteForever, MdInfo} from "react-icons/md";
import useFetch from "../../hooks/useFetch";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Table = () => {
    const { fetchDataBackend } = useFetch();
    const [departamentos, setDepartamentos] = useState([]);
    const [filters, setFilters] = useState({
        arriendoMin: "",
        arriendoMax: "",
        habitaciones: "",
        banos: "",
        servicios: [],
    });
    const [abiertoServicios, setAbiertoServicios] = useState(false);
    const opcionesServicios = ["luz", "agua", "internet"];
    const navigate = useNavigate();

    const storedUser = JSON.parse(localStorage.getItem("auth-token"));
    const userRol = storedUser?.state?.rol || "";
    const userId = storedUser?.state?.id || "";
    const userToken = storedUser?.state?.token || "";

    useEffect(() => {
        if (!userToken) return;

        const listarDepartamentos = async () => {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamentos`;
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
            };
            const response = await fetchDataBackend(url, null, "GET", headers);
            setDepartamentos(response || []);
        };

        listarDepartamentos();
    }, [fetchDataBackend, userToken]);

    const deleteDepartamento = async (id) => {
        const confirmDelete = confirm("¿Estás seguro de eliminar este departamento?");
        if (confirmDelete) {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/eliminar/${id}`;
            const headers = {
                Authorization: `Bearer ${userToken}`,
            };
            try {
                await fetchDataBackend(url, null, "DELETE", headers);
                setDepartamentos((prev) => prev.filter(dep => dep._id !== id));
                toast.success("Departamento eliminado correctamente");
            } catch (error) {
                console.error("Error al eliminar:", error);
                toast.error("Error al eliminar el departamento");
            }
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const toggleServicio = (servicio) => {
        setFilters((prev) => {
            const yaExiste = prev.servicios.includes(servicio);
            return {
                ...prev,
                servicios: yaExiste
                    ? prev.servicios.filter((s) => s !== servicio)
                    : [...prev.servicios, servicio],
            };
        });
    };

    const removerServicio = (servicio) => {
        setFilters((prev) => ({
            ...prev,
            servicios: prev.servicios.filter((s) => s !== servicio),
        }));
    };

    const getServiciosDepartamento = (dep) => {
        if (Array.isArray(dep?.serviciosIncluidos)) {
            return dep.serviciosIncluidos.map((s) => String(s).toLowerCase());
        }

        if (typeof dep?.serviciosIncluidos === "string") {
            return dep.serviciosIncluidos
                .toLowerCase()
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }

        const servicios = [];
        if (dep?.luz) servicios.push("luz");
        if (dep?.agua) servicios.push("agua");
        if (dep?.internet) servicios.push("internet");
        return servicios;
    };

    const departamentosFiltrados = departamentos.filter((dep) => {
        const precio = Number(dep?.precioMensual);
        const min = filters.arriendoMin === "" ? null : Number(filters.arriendoMin);
        const max = filters.arriendoMax === "" ? null : Number(filters.arriendoMax);
        const matchArriendo =
            (min === null || precio >= min) &&
            (max === null || precio <= max);

        const matchHabitaciones =
            !filters.habitaciones ||
            Number(dep?.numeroHabitaciones) === Number(filters.habitaciones);

        const matchBanos =
            !filters.banos ||
            Number(dep?.numeroBanos) === Number(filters.banos);

        const serviciosDep = getServiciosDepartamento(dep);
        const matchServicio =
            !filters.servicios.length ||
            filters.servicios.every((serv) => serviciosDep.includes(serv));

        return matchArriendo && matchHabitaciones && matchBanos && matchServicio;
    });

    return (
        <>
            <ToastContainer />

            <div className="w-full mt-5 mb-4 p-4 rounded-lg bg-white shadow-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input
                        type="number"
                        min="0"
                        name="arriendoMin"
                        value={filters.arriendoMin}
                        onChange={handleFilterChange}
                        placeholder="Cantidad minima"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />

                    <input
                        type="number"
                        min="0"
                        name="arriendoMax"
                        value={filters.arriendoMax}
                        onChange={handleFilterChange}
                        placeholder="Cantidad maxima"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />

                    <input
                        type="number"
                        min="0"
                        name="habitaciones"
                        value={filters.habitaciones}
                        onChange={handleFilterChange}
                        placeholder="Numero de habitaciones"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />

                    <input
                        type="number"
                        min="0"
                        name="banos"
                        value={filters.banos}
                        onChange={handleFilterChange}
                        placeholder="Numero de baños"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />

                    <div className="relative">
                        <div className="w-full rounded-md border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 px-2 py-1 min-h-[42px] flex items-center gap-2">
                            <div
                                className="flex-1 flex flex-wrap gap-2 cursor-pointer"
                                onClick={() => setAbiertoServicios(!abiertoServicios)}
                            >
                                {filters.servicios.length === 0 && (
                                    <span className="text-gray-500 px-2 py-1">Servicios incluidos</span>
                                )}

                                {filters.servicios.map((servicio) => (
                                    <span
                                        key={servicio}
                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium"
                                    >
                                        {servicio.charAt(0).toUpperCase() + servicio.slice(1)}
                                        <button
                                            type="button"
                                            className="text-blue-800 hover:text-blue-900"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removerServicio(servicio);
                                            }}
                                            aria-label={`Quitar ${servicio}`}
                                        >
                                            x
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setAbiertoServicios(!abiertoServicios)}
                                className="px-2 text-gray-500 hover:text-gray-700"
                                aria-label="Abrir opciones de servicios"
                            >
                                {abiertoServicios ? "▴" : "▾"}
                            </button>
                        </div>

                        {abiertoServicios && (
                            <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                                {opcionesServicios.map((servicio) => (
                                    <button
                                        key={servicio}
                                        type="button"
                                        onClick={() => toggleServicio(servicio)}
                                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                                    >
                                        <span>{servicio.charAt(0).toUpperCase() + servicio.slice(1)}</span>
                                        {filters.servicios.includes(servicio) && <span className="text-blue-700 font-semibold">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!departamentos.length ? (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                    <span className="font-medium">No existen registros</span>
                </div>
            ) : !departamentosFiltrados.length ? (
                <div className="p-4 mb-4 text-sm text-amber-800 rounded-lg bg-amber-50" role="alert">
                    <span className="font-medium">No hay resultados con esos filtros</span>
                </div>
            ) : (
                <table className="w-full mt-5 table-auto shadow-lg bg-white">
                    <thead className="bg-gray-800 text-slate-400">
                        <tr>
                            {["N°", "Título", "Descripción", "Dirección", "Precio", "Habitaciones", "Baños", "Estado", "Acciones"].map((header) => (
                                <th key={header} className="p-2">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {departamentosFiltrados.map((dep, index) => (
                            <tr className="hover:bg-gray-300 text-center" key={dep._id}>
                                <td>{index + 1}</td>
                                <td>{dep.titulo}</td>
                                <td>{dep.descripcion}</td>
                                <td>{dep.direccion}</td>
                                <td>$ {dep.precioMensual}</td>
                                <td>{dep.numeroHabitaciones}</td>
                                <td>{dep.numeroBanos}</td>
                                <td>
                                    <span className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${dep.disponible ? "bg-blue-100 text-green-500" : "bg-red-100 text-red-500"}`}>
                                        {dep.disponible ? "Disponible" : "No disponible"}
                                    </span>
                                </td>
                                <td className="py-2 text-center">
                                    <MdInfo
                                        title="Más información"
                                        className="h-7 w-7 text-slate-800 cursor-pointer inline-block mr-2 hover:text-green-600"
                                        onClick={() => navigate(`/dashboard/visualizar/${dep._id}`)}
                                    />
                                    {(userRol === "administrador" || (userRol === "arrendador" && dep.creador === userId)) && (
                                        <MdDeleteForever
                                            title="Eliminar"
                                            className="h-7 w-7 text-red-900 cursor-pointer inline-block hover:text-red-600"
                                            onClick={() => deleteDepartamento(dep._id)}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
};

export default Table;
