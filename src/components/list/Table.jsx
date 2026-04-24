import { MdToggleOn, MdToggleOff, MdInfo} from "react-icons/md";
import useFetch from "../../hooks/useFetch";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Table = () => {
    const { fetchDataBackend } = useFetch();
    const [departamentos, setDepartamentos] = useState([]);
    const [filters, setFilters] = useState({
        arriendoMin: "",
        arriendoMax: "",
        habitaciones: "",
        banos: "",
        categoria: "",
        servicios: [],
    });
    const [abiertoPrecio, setAbiertoPrecio] = useState(false);
    const [abiertoServicios, setAbiertoServicios] = useState(false);
    const [abiertoMasFiltros, setAbiertoMasFiltros] = useState(false);
    const [filtrosAdicionales, setFiltrosAdicionales] = useState({
        alicuotaIncluida: "",
        parqueadero: "",
        inmobiliario: "",
    });
    const [filtrosAdicionalesAplicados, setFiltrosAdicionalesAplicados] = useState({
        alicuotaIncluida: "",
        parqueadero: "",
        inmobiliario: "",
    });
    const opcionesServicios = ["luz", "agua", "internet"];
    const navigate = useNavigate();

    const storedUser = JSON.parse(localStorage.getItem("auth-token"));
    const userRol = storedUser?.state?.rol || "";
    const userId = storedUser?.state?.id || "";
    const userToken = storedUser?.state?.token || "";
    const isArrendatario = userRol === "arrendatario" || userRol === "arrendador";
    const isAdminOrArrendatario = userRol === "administrador" || isArrendatario;

    const [adminFilters, setAdminFilters] = useState({
        titulo: "",
        estado: "",
    });
    const [paginaActual, setPaginaActual] = useState(1);
    const elementosPorPagina = 6;

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

    const toggleDisponibilidad = async () => {
        toast.info("Esta funcionalidad está en desarrollo. Pronto podrás activar/desactivar departamentos.");
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

    const handleFiltroAdicionalChange = (campo, valor) => {
        setFiltrosAdicionales((prev) => ({ ...prev, [campo]: valor }));
    };

    const limpiarFiltrosAdicionales = () => {
        const vacio = {
            alicuotaIncluida: "",
            parqueadero: "",
            inmobiliario: "",
        };
        setFiltrosAdicionales(vacio);
        setFiltrosAdicionalesAplicados(vacio);
    };

    const aplicarFiltrosAdicionales = () => {
        setFiltrosAdicionalesAplicados(filtrosAdicionales);
        setAbiertoMasFiltros(false);
    };

    const contarFiltrosAdicionalesAplicados = Object.values(filtrosAdicionalesAplicados)
        .filter(Boolean)
        .length;

    const textoPrecio = () => {
        if (!filters.arriendoMin && !filters.arriendoMax) return "Precio";
        if (filters.arriendoMin && filters.arriendoMax) return `$${filters.arriendoMin} - $${filters.arriendoMax}`;
        if (filters.arriendoMin) return `Desde $${filters.arriendoMin}`;
        return `Hasta $${filters.arriendoMax}`;
    };

    const normalizarServicio = (valor) => {
        if (!valor) return null;
        const texto = String(valor).trim().toLowerCase();
        return texto || null;
    };

    const getServiciosDepartamento = (dep) => {
        if (Array.isArray(dep?.serviciosIncluidos)) {
            return dep.serviciosIncluidos
                .map((item) => {
                    if (typeof item === "string") return normalizarServicio(item);
                    if (item && typeof item === "object") {
                        return normalizarServicio(item.nombre || item.name || item.servicio);
                    }
                    return null;
                })
                .filter(Boolean);
        }

        if (typeof dep?.serviciosIncluidos === "string") {
            return dep.serviciosIncluidos
                .toLowerCase()
                .split(",")
                .map((s) => normalizarServicio(s))
                .filter(Boolean);
        }

        const servicios = [];
        if (dep?.luz) servicios.push("luz");
        if (dep?.agua) servicios.push("agua");
        if (dep?.internet) servicios.push("internet");
        return servicios;
    };

    const tieneParqueadero = (valor) => {
        if (valor === true || valor === 1) return true;
        if (typeof valor === "string") {
            const normalizado = valor.trim().toLowerCase();
            return ["true", "1", "si", "sí"].includes(normalizado);
        }
        return false;
    };

    const departamentosFiltrados = departamentos.filter((dep) => {
        if (isAdminOrArrendatario) {
            if (isArrendatario && String(dep?.creador || "") !== String(userId || "")) {
                return false;
            }

            const tituloFiltro = String(adminFilters.titulo || "").trim().toLowerCase();
            const tituloDepartamento = String(dep?.titulo || "").toLowerCase();
            const matchTitulo = !tituloFiltro || tituloDepartamento.includes(tituloFiltro);

            const estadoFiltro = adminFilters.estado;
            const matchEstado =
                !estadoFiltro ||
                (estadoFiltro === "habilitado" ? dep?.disponible !== false : dep?.disponible === false);

            return matchTitulo && matchEstado;
        }

        // Estudiante: solo departamentos disponibles
        if (dep?.disponible === false) return false;
        
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

        const categoriaNormalizada = String(dep?.categoria || "").trim().toLowerCase();
        const matchCategoria =
            !filters.categoria ||
            !categoriaNormalizada ||
            categoriaNormalizada === filters.categoria;

        const serviciosDep = getServiciosDepartamento(dep);
        const matchServicio =
            !filters.servicios.length ||
            filters.servicios.every((serv) => serviciosDep.includes(serv));

        const filtroParqueadero = filtrosAdicionalesAplicados.parqueadero;
        const tieneParqueaderoDepartamento = tieneParqueadero(dep?.parqueadero);
        const matchParqueadero =
            !filtroParqueadero ||
            (filtroParqueadero === "si"
                ? tieneParqueaderoDepartamento
                : !tieneParqueaderoDepartamento);

        return matchArriendo && matchHabitaciones && matchBanos && matchCategoria && matchServicio && matchParqueadero;
    });

    const limpiarFiltrosAdmin = () => {
        setAdminFilters({ titulo: "", estado: "" });
    };

    useEffect(() => {
        setPaginaActual(1);
    }, [departamentosFiltrados.length]);

    const totalPaginas = Math.max(1, Math.ceil(departamentosFiltrados.length / elementosPorPagina));
    const indiceInicial = (paginaActual - 1) * elementosPorPagina;
    const departamentosPaginados = departamentosFiltrados.slice(indiceInicial, indiceInicial + elementosPorPagina);

    const paginasVisibles = (() => {
        const total = totalPaginas;
        const actual = Math.min(paginaActual, total);
        if (total <= 5) {
            return Array.from({ length: total }, (_, index) => index + 1);
        }

        if (actual <= 3) {
            return [1, 2, 3, 4, "...", total];
        }

        if (actual >= total - 2) {
            return [1, "...", total - 3, total - 2, total - 1, total];
        }

        return [1, "...", actual - 1, actual, actual + 1, "...", total];
    })();

    const cambiarPagina = (pagina) => {
        const siguiente = Math.min(Math.max(pagina, 1), totalPaginas);
        setPaginaActual(siguiente);
    };

    return (
        <>
            <div className="w-full mt-5 mb-4 p-4 rounded-lg bg-white shadow-lg border border-gray-200">
                {isAdminOrArrendatario ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            value={adminFilters.titulo}
                            onChange={(e) => setAdminFilters((prev) => ({ ...prev, titulo: e.target.value }))}
                            placeholder="Filtrar por título"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <select
                            value={adminFilters.estado}
                            onChange={(e) => setAdminFilters((prev) => ({ ...prev, estado: e.target.value }))}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        >
                            <option value="">Todos los departamentos</option>
                            <option value="habilitado">Habilitados</option>
                            <option value="deshabilitado">Deshabilitados</option>
                        </select>

                        <button
                            type="button"
                            onClick={limpiarFiltrosAdmin}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setAbiertoPrecio(!abiertoPrecio)}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <span>{textoPrecio()}</span>
                                <span className="text-gray-500">{abiertoPrecio ? "▴" : "▾"}</span>
                            </button>

                            {abiertoPrecio && (
                                <div className="absolute z-20 mt-1 w-[320px] rounded-md border border-gray-300 bg-white shadow-lg p-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            name="arriendoMin"
                                            value={filters.arriendoMin}
                                            onChange={handleFilterChange}
                                            placeholder="Mín"
                                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            name="arriendoMax"
                                            value={filters.arriendoMax}
                                            onChange={handleFilterChange}
                                            placeholder="Máx"
                                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFilters((prev) => ({ ...prev, arriendoMin: "", arriendoMax: "" }))}
                                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAbiertoPrecio(false)}
                                            className="px-3 py-1.5 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-600"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <input
                            type="number"
                            min="0"
                            name="habitaciones"
                            value={filters.habitaciones}
                            onChange={handleFilterChange}
                            placeholder="Número de habitaciones"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <input
                            type="number"
                            min="0"
                            name="banos"
                            value={filters.banos}
                            onChange={handleFilterChange}
                            placeholder="Número de baños"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <select
                            name="categoria"
                            value={filters.categoria}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        >
                            <option value="">Todas las categorías</option>
                            <option value="departamento">Departamento</option>
                            <option value="suite">Suite</option>
                        </select>

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

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setAbiertoMasFiltros((prev) => !prev)}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <span>Más filtros</span>
                                {contarFiltrosAdicionalesAplicados > 0 && (
                                    <span className="inline-flex min-w-[22px] justify-center rounded-full bg-blue-700 px-2 py-0.5 text-xs font-semibold text-white">
                                        {contarFiltrosAdicionalesAplicados}
                                    </span>
                                )}
                                <span className="text-gray-500">{abiertoMasFiltros ? "▴" : "▾"}</span>
                            </button>

                            {abiertoMasFiltros && (
                                <div className="absolute right-0 z-30 mt-12 w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
                                    <div className="mb-3 border-b border-gray-200 pb-2">
                                        <h3 className="text-sm font-semibold text-gray-800">Más filtros</h3>
                                    </div>

                                    <div className="max-h-64 space-y-4 overflow-y-auto pr-2">
                                        <div>
                                            <p className="mb-2 text-sm font-medium text-gray-700">Precio mensual incluye alicuota</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-700">
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="alicuotaIncluida"
                                                        checked={filtrosAdicionales.alicuotaIncluida === "si"}
                                                        onChange={() => handleFiltroAdicionalChange("alicuotaIncluida", "si")}
                                                    />
                                                    Si
                                                </label>
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="alicuotaIncluida"
                                                        checked={filtrosAdicionales.alicuotaIncluida === "no"}
                                                        onChange={() => handleFiltroAdicionalChange("alicuotaIncluida", "no")}
                                                    />
                                                    No
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="mb-2 text-sm font-medium text-gray-700">Parqueadero</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-700">
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="parqueadero"
                                                        checked={filtrosAdicionales.parqueadero === "si"}
                                                        onChange={() => handleFiltroAdicionalChange("parqueadero", "si")}
                                                    />
                                                    Si
                                                </label>
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="parqueadero"
                                                        checked={filtrosAdicionales.parqueadero === "no"}
                                                        onChange={() => handleFiltroAdicionalChange("parqueadero", "no")}
                                                    />
                                                    No
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="mb-2 text-sm font-medium text-gray-700">Inmobiliario</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-700">
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="inmobiliario"
                                                        checked={filtrosAdicionales.inmobiliario === "si"}
                                                        onChange={() => handleFiltroAdicionalChange("inmobiliario", "si")}
                                                    />
                                                    Si
                                                </label>
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="inmobiliario"
                                                        checked={filtrosAdicionales.inmobiliario === "no"}
                                                        onChange={() => handleFiltroAdicionalChange("inmobiliario", "no")}
                                                    />
                                                    No
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-200 pt-3">
                                        <button
                                            type="button"
                                            onClick={limpiarFiltrosAdicionales}
                                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Limpiar filtro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={aplicarFiltrosAdicionales}
                                            className="rounded-md bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
                <div className="mt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departamentosPaginados.map((dep) => (
                            <article key={dep._id} className="bg-white rounded-xl border border-gray-200 shadow-lg p-5 flex flex-col gap-3">
                                <img
                                    src={dep?.imagenes?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
                                    alt={`Imagen principal de ${dep.titulo}`}
                                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                />

                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-lg font-bold text-gray-800 leading-tight">{dep.titulo}</h3>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-3">{dep.descripcion}</p>

                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Dirección:</span> {dep.direccion}
                                </p>

                                <p className="text-sm text-blue-800 font-semibold">Precio: $ {dep.precioMensual}</p>

                                <div className="mt-auto flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        title="Más información"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                                        onClick={() => navigate(`/dashboard/visualizar/${dep._id}`)}
                                    >
                                        <MdInfo className="h-5 w-5" />
                                        Ver más
                                    </button>

                                    {userRol === "administrador" && (
                                        <button
                                            type="button"
                                            title={dep?.disponible === false ? "Activar" : "Desactivar"}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
                                                dep?.disponible === false
                                                    ? "border-green-300 text-green-700 hover:bg-green-50"
                                                    : "border-red-300 text-red-700 hover:bg-red-50"
                                            }`}
                                            onClick={toggleDisponibilidad}
                                        >
                                            {dep?.disponible === false ? (
                                                <>
                                                    <MdToggleOff className="h-5 w-5" />
                                                    Activar
                                                </>
                                            ) : (
                                                <>
                                                    <MdToggleOn className="h-5 w-5" />
                                                    Desactivar
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {(userRol === "arrendador" && dep.creador === userId && dep?.disponible === false) && (
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-300 text-red-700 bg-red-50 text-sm font-medium">
                                            <MdToggleOff className="h-5 w-5" />
                                            Desactivado
                                        </span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>

                    {departamentosFiltrados.length > elementosPorPagina && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(1)}
                                    disabled={paginaActual === 1}
                                    className="h-8 min-w-8 px-2 rounded-full border border-gray-300 bg-white text-gray-600 text-xs font-semibold transition-colors hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Primera página"
                                >
                                    &laquo;
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(paginaActual - 1)}
                                    disabled={paginaActual === 1}
                                    className="h-8 min-w-8 px-2 rounded-full border border-gray-300 bg-white text-gray-600 text-xs font-semibold transition-colors hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Página anterior"
                                >
                                    &lsaquo;
                                </button>

                                {paginasVisibles.map((pagina, index) =>
                                    pagina === "..." ? (
                                        <span key={`ellipsis-${index}`} className="px-1.5 text-gray-400 text-xs select-none">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={pagina}
                                            type="button"
                                            onClick={() => cambiarPagina(pagina)}
                                            className={`h-8 min-w-8 px-2 rounded-full text-xs font-semibold transition-colors border ${
                                                pagina === paginaActual
                                                    ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                                                    : "bg-white text-gray-600 border-gray-300 hover:bg-blue-50"
                                            }`}
                                        >
                                            {pagina}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(paginaActual + 1)}
                                    disabled={paginaActual === totalPaginas}
                                    className="h-8 min-w-8 px-2 rounded-full border border-gray-300 bg-white text-gray-600 text-xs font-semibold transition-colors hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Página siguiente"
                                >
                                    &rsaquo;
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(totalPaginas)}
                                    disabled={paginaActual === totalPaginas}
                                    className="h-8 min-w-8 px-2 rounded-full border border-gray-300 bg-white text-gray-600 text-xs font-semibold transition-colors hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Última página"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default Table;
