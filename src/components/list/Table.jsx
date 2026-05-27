import { MdToggleOn, MdToggleOff, MdInfo, MdDelete, MdEdit } from "react-icons/md";
import axios from "axios";
import useFetch from "../../hooks/useFetch";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirm } from "../../utils/swal";

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
        alicuota: "",
        parqueadero: "",
        mascotas: "",
    });
    const [filtrosAdicionalesAplicados, setFiltrosAdicionalesAplicados] = useState({
        alicuota: "",
        parqueadero: "",
        mascotas: "",
    });
    const opcionesServicios = ["luz", "agua", "internet"];
    const navigate = useNavigate();

    const storedUser = JSON.parse(localStorage.getItem("auth-token"));
    const userRol = storedUser?.state?.rol || "";
    const userId = storedUser?.state?.user?._id || "";
    const userToken = storedUser?.state?.token || "";
    const isArrendatario = userRol === "arrendatario" || userRol === "arrendador";
    const mostrarBotonCrearResidencia = userRol === "arrendatario";
    const isAdminOrArrendatario = userRol === "administrador" || isArrendatario;

    const [adminFilters, setAdminFilters] = useState({
        titulo: "",
        estado: "",
        categoria: "",
        ocupacion: "",
    });
    const [paginaActual, setPaginaActual] = useState(1);
    const [animandoDepartamentos, setAnimandoDepartamentos] = useState(false);
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

    const toggleDisponibilidad = async (dep) => {
        const departamentoId = dep?._id || dep?.id || dep?.departamento?._id || dep?._doc?._id || null;
        if (!dep || !departamentoId) {
            console.error("toggleDisponibilidad: departamento o id faltante", dep);
            toast.error("Error: No se pudo identificar el departamento.");
            return;
        }

        const disponibleActual = dep.disponible === true || dep.disponible === "true";
        const nuevoEstado = !disponibleActual;
        const estaOcupado = tieneEstudianteAsignado(dep);

        if (!nuevoEstado && estaOcupado) {
            toast.error("No puedes desactivar esta residencia porque tiene un estudiante asignado.");
            return;
        }
        
        // Pedir confirmación si va a desactivar
        if (!nuevoEstado) {
            const confirmar = await confirm({
                title: 'Desactivar departamento',
                text: `¿Estás seguro de que deseas desactivar "${dep.titulo}"? Los estudiantes no podrán verlo.`,
                confirmButtonText: 'Sí, desactivar',
                cancelButtonText: 'Cancelar',
                icon: 'warning',
            });
            if (!confirmar) return;
        }

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/cambiarDisponibilidad`;
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
            };
            const payload = {
                departamentoId,
                disponible: nuevoEstado,
            };

            // Debug logs removed
            const resp = await axios.put(url, payload, { headers });

            if (resp?.data) {
                setDepartamentos((prev) =>
                    prev.map((d) => (String(d._id) === String(departamentoId) ? { ...d, disponible: nuevoEstado } : d))
                );
                toast.success(nuevoEstado ? "Departamento activado correctamente" : "Departamento desactivado correctamente");
            }
        } catch (error) {
            console.error("Error al cambiar disponibilidad:", error);
            const serverData = error?.response?.data || null;
            console.error("toggleDisponibilidad - server response data:", serverData);
            const serverMsg = serverData?.msg || serverData?.message || serverData || null;
            if (serverMsg) {
                try {
                    const text = typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg);
                    toast.error(text);
                } catch {
                    toast.error(String(serverMsg));
                }
            } else {
                toast.error("Error al cambiar el estado del departamento.");
            }
        }
    };

    const eliminarDepartamento = async (dep) => {
        const departamentoId = dep?._id || dep?.id || dep?.departamento?._id || dep?._doc?._id || null;
        if (!dep || !departamentoId) {
            toast.error("No se pudo identificar el departamento.");
            return;
        }

        if (tieneEstudianteAsignado(dep)) {
            toast.error("No puedes eliminar este departamento porque tiene un estudiante asignado.");
            return;
        }

        const arrendatarioId = typeof dep?.arrendatario === "object"
            ? (dep?.arrendatario?._id || dep?.arrendatario?.id)
            : dep?.arrendatario;

        if (userRol !== "arrendatario" || String(arrendatarioId || "") !== String(userId || "")) {
            toast.error("Solo el arrendatario propietario puede eliminar este departamento.");
            return;
        }

        const confirmar = await confirm({
            title: 'Eliminar departamento',
            text: `¿Estás seguro de eliminar "${dep.titulo}"? Esta acción no se puede deshacer.`,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            icon: 'warning',
        });
        if (!confirmar) return;

        const loadingToast = toast.loading("Eliminando departamento...");

        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/eliminar/${departamentoId}`;
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
            };

            const response = await axios.delete(url, { headers });

            setDepartamentos((prev) => prev.filter((item) => String(item?._id || item?.id) !== String(departamentoId)));

            toast.dismiss(loadingToast);
            toast.success(response?.data?.msg || "Departamento eliminado correctamente");
        } catch (error) {
            toast.dismiss(loadingToast);
            const errorMessage =
                error?.response?.data?.msg ||
                error?.response?.data?.message ||
                "No se pudo eliminar el departamento";
            toast.error(errorMessage);
        }
    };

    const esPropietarioDelDepartamento = (dep) => {
        const arrendatarioId = typeof dep?.arrendatario === "object"
            ? (dep?.arrendatario?._id || dep?.arrendatario?.id)
            : dep?.arrendatario;

        return userRol === "arrendatario" && String(arrendatarioId || "") === String(userId || "");
    };

    const puedeEliminarDepartamento = (dep) => {
        return esPropietarioDelDepartamento(dep) && !tieneEstudianteAsignado(dep);
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
            alicuota: "",
            parqueadero: "",
            mascotas: "",
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

    const esBooleanoTrue = (valor) => {
        if (valor === true || valor === 1) return true;
        if (typeof valor === "string") {
            const normalizado = valor.trim().toLowerCase();
            return ["true", "1", "si", "sí"].includes(normalizado);
        }
        return false;
    };

    const tieneEstudianteAsignado = (dep) => {
        const estudianteId =
            typeof dep?.estudiante === "object"
                ? (dep?.estudiante?._id || dep?.estudiante?.id)
                : dep?.estudiante;

        const estudianteIdDirecto = dep?.estudianteId;

        return Boolean(estudianteId || estudianteIdDirecto);
    };

    const departamentosFiltrados = departamentos.filter((dep) => {
        if (isAdminOrArrendatario) {
            if (isArrendatario) {
                // Extraer el ID del arrendatario, ya sea string o objeto
                const arrendatarioId = typeof dep?.arrendatario === "object" 
                    ? (dep?.arrendatario?._id || dep?.arrendatario?.id) 
                    : dep?.arrendatario;
                

                if (String(arrendatarioId || "") !== String(userId || "")) {
                    return false;
                }
            }

            const tituloFiltro = String(adminFilters.titulo || "").trim().toLowerCase();
            const tituloDepartamento = String(dep?.titulo || "").toLowerCase();
            const matchTitulo = !tituloFiltro || tituloDepartamento.includes(tituloFiltro);

            const estadoFiltro = adminFilters.estado;
            const matchEstado =
                !estadoFiltro ||
                (estadoFiltro === "habilitado" ? dep?.disponible !== false : dep?.disponible === false);

            const categoriaFiltroAdmin = String(adminFilters.categoria || "").trim().toLowerCase();
            const categoriaDepartamento = String(dep?.categoria || "").trim().toLowerCase();
            const matchCategoriaAdmin = !categoriaFiltroAdmin || !categoriaDepartamento || categoriaDepartamento === categoriaFiltroAdmin;

            const ocupacionFiltro = adminFilters.ocupacion;
            const estaOcupado = tieneEstudianteAsignado(dep);
            const matchOcupacion =
                !ocupacionFiltro ||
                (ocupacionFiltro === "ocupadas" ? estaOcupado : !estaOcupado);

            return matchTitulo && matchEstado && matchCategoriaAdmin && matchOcupacion;
        }

        // Estudiante: solo departamentos disponibles
        if (dep?.disponible === false) return false;
        if (tieneEstudianteAsignado(dep)) return false;
        
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

        const filtroAlicuota = filtrosAdicionalesAplicados.alicuota;
        const tieneAlicuota = esBooleanoTrue(dep?.alicuota);
        const matchAlicuota =
            !filtroAlicuota ||
            (filtroAlicuota === "si" ? tieneAlicuota : !tieneAlicuota);

        const filtroMascotas = filtrosAdicionalesAplicados.mascotas;
        const permiteMascotas = esBooleanoTrue(dep?.mascotas);
        const matchMascotas =
            !filtroMascotas ||
            (filtroMascotas === "si" ? permiteMascotas : !permiteMascotas);

        return matchArriendo && matchHabitaciones && matchBanos && matchCategoria && matchServicio && matchParqueadero && matchAlicuota && matchMascotas;
    });

    const limpiarFiltrosAdmin = () => {
        setAdminFilters({ titulo: "", estado: "", categoria: "", ocupacion: "" });
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
        if (siguiente === paginaActual) return;

        setAnimandoDepartamentos(true);
        // Intentar desplazar al contenedor principal si existe (igual que Home), si no usar window
        const contenedor = document.querySelector('.container') || document.querySelector('main');
        if (contenedor && typeof contenedor.scrollIntoView === 'function') {
            contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        setTimeout(() => {
            setPaginaActual(siguiente);
            setAnimandoDepartamentos(false);
        }, 220);
    };

    return (
        <>
            {mostrarBotonCrearResidencia && (
                <div className="mt-5 mb-3 flex justify-end">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/crear')}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                    >
                        + Crear residencia
                    </button>
                </div>
            )}

            <div className="w-full mt-5 mb-4 p-5 rounded-2xl bg-white shadow-sm border border-gray-200">
                {isAdminOrArrendatario ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                            type="text"
                            value={adminFilters.titulo}
                            onChange={(e) => setAdminFilters((prev) => ({ ...prev, titulo: e.target.value }))}
                            placeholder="Filtrar por título"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 placeholder:text-gray-400 hover:border-blue-500 transition-colors shadow-sm"
                        />

                        <select
                            value={adminFilters.estado}
                            onChange={(e) => setAdminFilters((prev) => ({ ...prev, estado: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 hover:border-blue-500 transition-colors shadow-sm"
                        >
                            <option value="">Todos los estados</option>
                            <option value="habilitado">Habilitados</option>
                            <option value="deshabilitado">Deshabilitados</option>
                        </select>

                        <select
                            value={adminFilters.categoria}
                            onChange={(e) => setAdminFilters((prev) => ({ ...prev, categoria: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 hover:border-blue-500 transition-colors shadow-sm"
                        >
                            <option value="">Todas las categorías</option>
                            <option value="departamento">Departamento</option>
                            <option value="suit">Suite</option>
                        </select>

                        <select
                            value={adminFilters.ocupacion}
                            onChange={(e) => setAdminFilters((prev) => ({ ...prev, ocupacion: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 hover:border-blue-500 transition-colors shadow-sm"
                        >
                            <option value="">Todas las residencias</option>
                            <option value="ocupadas">Ocupadas</option>
                            <option value="no-ocupadas">No ocupadas</option>
                        </select>

                        <button
                            type="button"
                            onClick={limpiarFiltrosAdmin}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 min-w-0">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setAbiertoPrecio(!abiertoPrecio)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-xs text-gray-700 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 transition-colors shadow-sm"
                            >
                                        <span className="text-xs leading-tight">{textoPrecio()}</span>
                                <span className="text-gray-500">{abiertoPrecio ? "▴" : "▾"}</span>
                            </button>

                            {abiertoPrecio && (
                                <div className="absolute z-20 mt-2 w-[320px] rounded-xl border border-gray-300 bg-white shadow-xl p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            name="arriendoMin"
                                            value={filters.arriendoMin}
                                            onChange={handleFilterChange}
                                            placeholder="Mín"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 placeholder:text-gray-400"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            name="arriendoMax"
                                            value={filters.arriendoMax}
                                            onChange={handleFilterChange}
                                            placeholder="Máx"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFilters((prev) => ({ ...prev, arriendoMin: "", arriendoMax: "" }))}
                                            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAbiertoPrecio(false)}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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
                            className="w-full min-w-0 px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 placeholder:text-gray-400 hover:border-blue-500 transition-colors shadow-sm truncate"
                        />

                        <input
                            type="number"
                            min="0"
                            name="banos"
                            value={filters.banos}
                            onChange={handleFilterChange}
                            placeholder="Número de baños"
                            className="w-full min-w-0 px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 placeholder:text-gray-400 hover:border-blue-500 transition-colors shadow-sm truncate"
                        />

                        <select
                            name="categoria"
                            value={filters.categoria}
                            onChange={handleFilterChange}
                            className="w-full min-w-0 px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 hover:border-blue-500 transition-colors shadow-sm truncate"
                        >
                            <option value="">Todas las categorías</option>
                            <option value="departamento">Departamento</option>
                            <option value="suit">Suite</option>
                        </select>

                        <div className="relative">
                            <div className="w-full rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 px-3 py-2 min-h-[44px] flex items-center gap-2 hover:border-blue-500 transition-colors shadow-sm">
                                <div
                                    className="flex-1 flex flex-wrap gap-2 cursor-pointer"
                                    onClick={() => setAbiertoServicios(!abiertoServicios)}
                                >
                                    {filters.servicios.length === 0 && (
                                        <span className="text-xs text-gray-500 px-2 py-1 leading-tight">Servicios incluidos</span>
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
                                <div className="absolute z-10 mt-2 w-full rounded-xl border border-gray-300 bg-white shadow-xl">
                                    {opcionesServicios.map((servicio) => (
                                        <button
                                            key={servicio}
                                            type="button"
                                            onClick={() => toggleServicio(servicio)}
                                            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center justify-between first:rounded-t-xl last:rounded-b-xl transition-colors"
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
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-xs text-gray-700 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 transition-colors shadow-sm"
                            >
                                        <span className="text-xs leading-tight">Más filtros</span>
                                {contarFiltrosAdicionalesAplicados > 0 && (
                                    <span className="inline-flex min-w-[22px] justify-center rounded-full bg-blue-700 px-2 py-0.5 text-xs font-semibold text-white">
                                        {contarFiltrosAdicionalesAplicados}
                                    </span>
                                )}
                                <span className="text-gray-500">{abiertoMasFiltros ? "▴" : "▾"}</span>
                            </button>

                            {abiertoMasFiltros && (
                                <div className="absolute right-0 z-30 mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
                                    <div className="mb-3 border-b border-gray-200 pb-2">
                                        <h3 className="text-xs font-semibold text-gray-800">Más filtros</h3>
                                    </div>

                                    <div className="max-h-64 space-y-4 overflow-y-auto pr-2">
                                        <div>
                                            <p className="mb-2 text-xs font-medium text-gray-700">Alicuota</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-700">
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="alicuota"
                                                        checked={filtrosAdicionales.alicuota === "si"}
                                                        onChange={() => handleFiltroAdicionalChange("alicuota", "si")}
                                                    />
                                                    Si
                                                </label>
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="alicuota"
                                                        checked={filtrosAdicionales.alicuota === "no"}
                                                        onChange={() => handleFiltroAdicionalChange("alicuota", "no")}
                                                    />
                                                    No
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="mb-2 text-xs font-medium text-gray-700">Parqueadero</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-700">
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
                                            <p className="mb-2 text-xs font-medium text-gray-700">¿Se permiten mascotas?</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-700">
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="mascotas"
                                                        checked={filtrosAdicionales.mascotas === "si"}
                                                        onChange={() => handleFiltroAdicionalChange("mascotas", "si")}
                                                    />
                                                    Si
                                                </label>
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="mascotas"
                                                        checked={filtrosAdicionales.mascotas === "no"}
                                                        onChange={() => handleFiltroAdicionalChange("mascotas", "no")}
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
                                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Limpiar filtro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={aplicarFiltrosAdicionales}
                                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 transition-colors"
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
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ease-out ${animandoDepartamentos ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                        {departamentosPaginados.map((dep) => (
                            <article key={dep._id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
                                <img
                                    src={dep?.imagenes?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
                                    alt={`Imagen principal de ${dep.titulo}`}
                                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                />

                                <div className="p-6 flex flex-col flex-1 gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{dep.titulo}</h3>
                                    </div>

                                    <p className="text-sm text-gray-600 line-clamp-3">{dep.descripcion}</p>

                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Dirección:</span> {dep.direccion}
                                    </p>

                                    <p className="text-sm text-blue-700 font-semibold">Precio: $ {dep.precioMensual}</p>

                                    <div className="mt-auto flex items-center justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            title="Más información"
                                            aria-label="Más información"
                                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50"
                                            onClick={() => navigate(`/dashboard/visualizar/${dep._id}`, { state: { from: "/dashboard/listar" } })}
                                        >
                                            <MdInfo className="h-5 w-5" />
                                        </button>

                                        {userRol === "administrador" && (
                                            <button
                                                type="button"
                                                title={dep?.disponible === false ? "Activar" : "Desactivar"}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                                                    dep?.disponible === false
                                                        ? "border-green-300 text-green-700 hover:bg-green-50"
                                                        : "border-red-300 text-red-700 hover:bg-red-50"
                                                }`}
                                                onClick={() => toggleDisponibilidad(dep)}
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

                                        {(userRol === "arrendador" && (
                                            typeof dep.arrendatario === "object" 
                                                ? (dep.arrendatario?._id || dep.arrendatario?.id) === userId
                                                : dep.arrendatario === userId
                                        ) && dep?.disponible === false) && (
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 bg-red-50 text-sm font-medium">
                                                <MdToggleOff className="h-5 w-5" />
                                                Desactivado
                                            </span>
                                        )}

                                        {esPropietarioDelDepartamento(dep) && (
                                            <button
                                                type="button"
                                                title="Actualizar departamento"
                                                className="inline-flex items-center justify-center rounded-lg border border-blue-300 px-3 py-1.5 text-blue-700 transition-colors hover:bg-blue-50"
                                                onClick={() => navigate(`/dashboard/actualizar/${dep._id}`, { state: { departamento: dep, from: "/dashboard/listar" } })}
                                            >
                                                <MdEdit className="h-5 w-5" />
                                            </button>
                                        )}

                                        {puedeEliminarDepartamento(dep) ? (
                                            <button
                                                type="button"
                                                title="Eliminar departamento"
                                                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-1.5 text-red-700 transition-colors hover:bg-red-50"
                                                onClick={() => eliminarDepartamento(dep)}
                                            >
                                                <MdDelete className="h-5 w-5" />
                                            </button>
                                        ) : esPropietarioDelDepartamento(dep) && tieneEstudianteAsignado(dep) ? (
                                            <span
                                                title="No se puede eliminar porque tiene estudiante asignado"
                                                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-slate-400 cursor-not-allowed"
                                            >
                                                <MdDelete className="h-5 w-5" />
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {departamentosFiltrados.length > elementosPorPagina && (
                        <div className="flex justify-center mt-12">
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(1)}
                                    disabled={paginaActual === 1}
                                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Primera página"
                                >
                                    &laquo;
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(paginaActual - 1)}
                                    disabled={paginaActual === 1}
                                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Página anterior"
                                >
                                    &lsaquo;
                                </button>

                                {paginasVisibles.map((pagina, index) =>
                                    pagina === "..." ? (
                                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400 text-sm select-none">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={pagina}
                                            type="button"
                                            onClick={() => cambiarPagina(pagina)}
                                            className={`h-10 w-10 rounded-lg text-sm font-semibold transition-all ${
                                                pagina === paginaActual
                                                    ? "bg-blue-600 text-white border border-blue-600 shadow-md"
                                                    : "bg-white text-gray-600 border border-gray-300 hover:border-blue-600 hover:text-blue-600"
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
                                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Página siguiente"
                                >
                                    &rsaquo;
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(totalPaginas)}
                                    disabled={paginaActual === totalPaginas}
                                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
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
