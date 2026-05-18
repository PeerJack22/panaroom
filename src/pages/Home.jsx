import logo_proyecto from '../assets/logo_proyecto.png';
import { Link, useNavigate } from 'react-router-dom';
import { FaYoutube, FaGithub, FaClipboardList, FaUser, FaComments, FaBullhorn } from "react-icons/fa6";
import { useEffect, useState } from 'react';
import axios from 'axios';
import storeAuth from '../context/storeAuth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{7,15}$/;

const normalizarServicio = (valor) => {
    if (!valor) return null;
    const texto = String(valor).trim().toLowerCase();
    return texto || null;
};

const obtenerServicios = (item) => {
    if (Array.isArray(item?.serviciosIncluidos)) {
        return item.serviciosIncluidos
            .map((serv) => {
                if (typeof serv === 'string') return normalizarServicio(serv);
                if (serv && typeof serv === 'object') {
                    return normalizarServicio(serv.nombre || serv.name || serv.servicio);
                }
                return null;
            })
            .filter(Boolean);
    }

    if (typeof item?.serviciosIncluidos === 'string') {
        return item.serviciosIncluidos
            .split(',')
            .map((serv) => normalizarServicio(serv))
            .filter(Boolean);
    }

    const servicios = [];
    if (item?.luz) servicios.push('luz');
    if (item?.agua) servicios.push('agua');
    if (item?.internet) servicios.push('internet');
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

export const Home = () => {
    const navigate = useNavigate();
    const { token } = storeAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [servicios, setServicios] = useState([]);
    const [documentosArrendatario, setDocumentosArrendatario] = useState([]);
    const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
    const [abierto, setAbierto] = useState(false);
    const [abiertoPrecio, setAbiertoPrecio] = useState(false);
    const [abiertoMasFiltros, setAbiertoMasFiltros] = useState(false);
    const [precioMin, setPrecioMin] = useState("");
    const [precioMax, setPrecioMax] = useState("");
    const [habitacionesFiltro, setHabitacionesFiltro] = useState("");
    const [banosFiltro, setBanosFiltro] = useState("");
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
    const [paginaActual, setPaginaActual] = useState(1);
    const [mostrarMensajeDetalle, setMostrarMensajeDetalle] = useState(false);
    const [animandoResidencias, setAnimandoResidencias] = useState(false);
    const [cargandoPropiedades, setCargandoPropiedades] = useState(true);
    const [errorPropiedades, setErrorPropiedades] = useState("");
    const [mostrarFormularioArrendatario, setMostrarFormularioArrendatario] = useState(false);
    const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
    const [estadoSolicitud, setEstadoSolicitud] = useState({ tipo: "", mensaje: "" });
    const [datosSolicitud, setDatosSolicitud] = useState({
        nombre: "",
        apellido: "",
        direccion: "",
        celular: "",
        email: "",
    });
    const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
    const propiedadesPorPagina = 6;
    
    const opcionesServicios = ['luz', 'agua', 'internet'];
    const opcionesCategorias = [
        { value: "todas", label: "Todas las categorías" },
        { value: "departamento", label: "Departamento" },
        { value: "suit", label: "Suite" },
    ];

    const [propiedades, setPropiedades] = useState([]);

    useEffect(() => {
        const cargarDepartamentosPublicos = async () => {
            try {
                setCargandoPropiedades(true);
                setErrorPropiedades("");
                const url = `${import.meta.env.VITE_BACKEND_URL}/public/departamentoInfo`;
                const response = await axios.get(url);
                const lista = Array.isArray(response?.data)
                    ? response.data
                    : response?.data?.departamentos || response?.data?.data || [];

                const normalizados = lista.map((item, index) => ({
                    id: item?._id || item?.id || index + 1,
                    titulo: item?.titulo || 'Sin título',
                    precio: Number(item?.precioMensual) || 0,
                    numeroHabitaciones: Number(item?.numeroHabitaciones) || 0,
                    numeroBanos: Number(item?.numeroBanos) || 0,
                    parqueadero: item?.parqueadero,
                    alicuota: item?.alicuota,
                    mascotas: item?.mascotas,
                    direccion: item?.direccion || item?.ciudad || 'Sin dirección',
                    descripcion: item?.descripcion || 'Sin descripción disponible.',
                    categoria: String(item?.categoria || "").trim().toLowerCase(),
                    serviciosIncluidos: obtenerServicios(item),
                    imagenPrincipal: item?.imagenes?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                    disponible: item?.disponible !== false,
                    estudianteId: item?.estudianteId,
                    estudiante: item?.estudiante,
                }));

                setPropiedades(normalizados);
            } catch (error) {
                console.error('Error al cargar departamentos públicos:', error);
                setErrorPropiedades('No se pudo cargar la información de departamentos.');
                setPropiedades([]);
            } finally {
                setCargandoPropiedades(false);
            }
        };

        cargarDepartamentosPublicos();
    }, []);

    const propiedadesFiltradas = propiedades.filter((propiedad) => {
        if (propiedad.disponible === false) return false;
        
        if (propiedad?.estudianteId || (propiedad?.estudiante && String(propiedad.estudiante).trim() !== "")) {
            return false;
        }
        
        const min = precioMin === '' ? null : Number(precioMin);
        const max = precioMax === '' ? null : Number(precioMax);
        const precioValido = (min === null || propiedad.precio >= min) && (max === null || propiedad.precio <= max);

        const habitacionesValidas =
            !habitacionesFiltro ||
            Number(propiedad.numeroHabitaciones) === Number(habitacionesFiltro);

        const banosValidos =
            !banosFiltro ||
            Number(propiedad.numeroBanos) === Number(banosFiltro);

        const serviciosValidos =
            !servicios.length ||
            servicios.every((serv) => propiedad.serviciosIncluidos.includes(serv));

        const filtroParqueadero = filtrosAdicionalesAplicados.parqueadero;
        const tieneParqueaderoPropiedad = tieneParqueadero(propiedad?.parqueadero);
        const parqueaderoValido =
            !filtroParqueadero ||
            (filtroParqueadero === 'si' ? tieneParqueaderoPropiedad : !tieneParqueaderoPropiedad);

        const filtroAlicuota = filtrosAdicionalesAplicados.alicuota;
        const tieneAlicuota = esBooleanoTrue(propiedad?.alicuota);
        const alicuotaValida =
            !filtroAlicuota ||
            (filtroAlicuota === 'si' ? tieneAlicuota : !tieneAlicuota);

        const filtroMascotas = filtrosAdicionalesAplicados.mascotas;
        const permiteMascotas = esBooleanoTrue(propiedad?.mascotas);
        const mascotasValidas =
            !filtroMascotas ||
            (filtroMascotas === 'si' ? permiteMascotas : !permiteMascotas);

        const categoriaValida =
            categoriaFiltro === "todas" ||
            !propiedad.categoria ||
            propiedad.categoria === categoriaFiltro;

        return precioValido && habitacionesValidas && banosValidos && serviciosValidos && parqueaderoValido && alicuotaValida && mascotasValidas && categoriaValida;
    });

    const totalPaginas = Math.max(1, Math.ceil(propiedadesFiltradas.length / propiedadesPorPagina));
    const indiceInicio = (paginaActual - 1) * propiedadesPorPagina;
    const propiedadesPaginadas = propiedadesFiltradas.slice(indiceInicio, indiceInicio + propiedadesPorPagina);

    useEffect(() => {
        setPaginaActual(1);
    }, [precioMin, precioMax, habitacionesFiltro, banosFiltro, servicios, filtrosAdicionalesAplicados, categoriaFiltro]);

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas || nuevaPagina === paginaActual) return;

        setAnimandoResidencias(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            setPaginaActual(nuevaPagina);
            setAnimandoResidencias(false);
        }, 180);
    };

    const paginasVisibles = (() => {
        if (totalPaginas <= 7) {
            return Array.from({ length: totalPaginas }, (_, index) => index + 1);
        }

        const inicio = Math.max(1, paginaActual - 2);
        const fin = Math.min(totalPaginas, inicio + 4);
        const inicioAjustado = Math.max(1, fin - 4);
        const paginas = [];

        if (inicioAjustado > 1) {
            paginas.push(1);
            if (inicioAjustado > 2) paginas.push("...");
        }

        for (let pagina = inicioAjustado; pagina <= fin; pagina += 1) {
            paginas.push(pagina);
        }

        if (fin < totalPaginas) {
            if (fin < totalPaginas - 1) paginas.push("...");
            paginas.push(totalPaginas);
        }

        return paginas;
    })();

    const agregarServicio = (servicio) => {
        const normalizado = servicio.toLowerCase();
        if (!servicios.includes(normalizado)) {
            setServicios([...servicios, normalizado]);
        }
        setAbierto(false);
    };

    const removerServicio = (servicio) => {
        setServicios(servicios.filter(s => s !== servicio));
    };

    const toggleServicio = (servicio) => {
        if (servicios.includes(servicio)) {
            removerServicio(servicio);
            return;
        }
        agregarServicio(servicio);
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
        if (!precioMin && !precioMax) return 'Precio';
        if (precioMin && precioMax) return `$${precioMin} - $${precioMax}`;
        if (precioMin) return `Desde $${precioMin}`;
        return `Hasta $${precioMax}`;
    };

    const manejarCambioSolicitud = (e) => {
        const { name, value } = e.target;

        if (name === "celular") {
            const soloDigitos = value.replace(/\D/g, "");
            setDatosSolicitud((prev) => ({ ...prev, [name]: soloDigitos }));
            return;
        }

        setDatosSolicitud((prev) => ({ ...prev, [name]: value }));
    };

    const manejarCambioDocumentos = (e) => {
        const nuevosArchivos = Array.from(e.target.files || []);
        if (!nuevosArchivos.length) return;

        setDocumentosArrendatario((prev) => [...prev, ...nuevosArchivos]);
        e.target.value = "";
    };

    const enviarSolicitudArrendatario = async (e) => {
        e.preventDefault();
        if (enviandoSolicitud) return;
        setEstadoSolicitud({ tipo: "", mensaje: "" });

        if (!PHONE_REGEX.test(datosSolicitud.celular)) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: "El teléfono debe contener solo números (7 a 15 dígitos).",
            });
            return;
        }

        if (!EMAIL_REGEX.test(datosSolicitud.email)) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: "Ingresa un correo electrónico válido.",
            });
            return;
        }

        if (!documentosArrendatario || documentosArrendatario.length === 0) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: "Selecciona al menos un documento de identidad antes de enviar.",
            });
            return;
        }

        setEnviandoSolicitud(true);

        try {
            const formData = new FormData();
            formData.append("nombre", datosSolicitud.nombre.trim());
            formData.append("apellido", datosSolicitud.apellido.trim());
            formData.append("direccion", datosSolicitud.direccion.trim());
            formData.append("celular", datosSolicitud.celular.trim());
            formData.append("email", datosSolicitud.email.trim().toLowerCase());

            documentosArrendatario.forEach((archivo) => {
                formData.append("imagenesDocumentos", archivo);
            });

            const url = `${import.meta.env.VITE_BACKEND_URL}/arrendatario/crear`;

            const response = await axios.post(url, formData);

            setEstadoSolicitud({
                tipo: "ok",
                mensaje: response?.data?.msg || "Solicitud enviada correctamente.",
            });
            setDatosSolicitud({
                nombre: "",
                apellido: "",
                direccion: "",
                celular: "",
                email: "",
            });
            setDocumentosArrendatario([]);
        } catch (error) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: error?.response?.data?.msg || "No se pudo enviar la solicitud. Inténtalo nuevamente.",
            });
        } finally {
            setEnviandoSolicitud(false);
        }
    };

    const cerrarModalDetalle = () => {
        setDetalleSeleccionado(null);
        setMostrarMensajeDetalle(false);
    };

    const manejarClickDetalles = (propiedad) => {
        if (token) {
            navigate(`/dashboard/visualizar/${propiedad.id}`);
            return;
        }

        setDetalleSeleccionado(propiedad);
        setMostrarMensajeDetalle(true);
    };

    return (
        <div className="font-sans">
            {/* NAVBAR MEJORADO */}
            <nav className="fixed w-full z-[60] bg-slate-50/95 backdrop-blur-md border-b border-slate-200 shadow-md transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img className="w-12 h-12 rounded-lg shadow-lg group-hover:scale-110 transition-transform" src={logo_proyecto} alt="PanaRoom" />
                        <div>
                            <span className="text-2xl font-bold text-gray-900 block leading-none">PanaRoom</span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-8">
                        <a href="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                            Inicio
                        </a>
                        <a href="#acerca" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                            Acerca de
                        </a>
                        <a href="#servicios" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                            Servicios
                        </a>
                        <a href="#contacto" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                            Contacto
                        </a>
                    </div>

                    {/* Right Actions */}
                    <div className="hidden lg:flex items-center gap-4">
                        {!token ? (
                            <>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    Registrarse
                                </button>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                                >
                                    Iniciar Sesión
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg"
                            >
                                Dashboard
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 text-gray-700 hover:text-blue-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden bg-slate-50/95 border-t border-slate-200 shadow-xl backdrop-blur-md">
                        <div className="px-6 py-4 space-y-3">
                            <a href="/" className="block text-lg font-semibold text-gray-800 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Inicio</a>
                            <a href="#acerca" className="block text-lg font-semibold text-gray-800 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Acerca de</a>
                            <a href="#servicios" className="block text-lg font-semibold text-gray-800 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Servicios</a>
                            <a href="#contacto" className="block text-lg font-semibold text-gray-800 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Contacto</a>
                            <hr className="my-2" />
                            {!token ? (
                                <div className="space-y-2">
                                    <button onClick={() => { navigate("/register"); setMobileMenuOpen(false); }} className="w-full py-2 text-center rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50">Registrarse</button>
                                    <button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="w-full py-2 text-center rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Iniciar Sesión</button>
                                </div>
                            ) : (
                                <button onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }} className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Dashboard</button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* MAIN CONTENT */}
            <main className="pt-24 bg-white">
                {/* HERO + FILTROS */}
                <section className="bg-gradient-to-b from-blue-50 to-white py-12 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-10">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                                Encuentra tu <span className="text-blue-600">residencia ideal</span>
                            </h1>
                            <p className="text-lg text-gray-600">Búsqueda rápida y segura de departamentos en la zona EPN</p>
                        </div>

                        {/* FILTROS GRID */}
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setAbiertoPrecio(!abiertoPrecio)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 transition-colors shadow-sm"
                                >
                                    <span className="font-medium">{textoPrecio()}</span>
                                    <span className="text-gray-500">{abiertoPrecio ? '▴' : '▾'}</span>
                                </button>

                                {abiertoPrecio && (
                                    <div className="absolute z-20 mt-2 w-[320px] rounded-xl border border-gray-300 bg-white shadow-xl p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={precioMin}
                                                onChange={(e) => setPrecioMin(e.target.value)}
                                                placeholder="Mín"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                value={precioMax}
                                                onChange={(e) => setPrecioMax(e.target.value)}
                                                placeholder="Máx"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPrecioMin("");
                                                    setPrecioMax("");
                                                }}
                                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                Limpiar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAbiertoPrecio(false)}
                                                className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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
                                value={habitacionesFiltro}
                                onChange={(e) => setHabitacionesFiltro(e.target.value)}
                                placeholder="Habitaciones"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 hover:border-blue-500 transition-colors shadow-sm"
                            />

                            <input
                                type="number"
                                min="0"
                                value={banosFiltro}
                                onChange={(e) => setBanosFiltro(e.target.value)}
                                placeholder="Baños"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 hover:border-blue-500 transition-colors shadow-sm"
                            />

                            <select
                                value={categoriaFiltro}
                                onChange={(e) => setCategoriaFiltro(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 hover:border-blue-500 transition-colors shadow-sm"
                            >
                                {opcionesCategorias.map((opcion) => (
                                    <option key={opcion.value} value={opcion.value}>
                                        {opcion.label}
                                    </option>
                                ))}
                            </select>

                            <div className="relative lg:col-span-1">
                                <div className="w-full rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 px-3 py-2 min-h-[44px] flex items-center gap-2 hover:border-blue-500 transition-colors shadow-sm">
                                    <div
                                        className="flex-1 flex flex-wrap gap-2 cursor-pointer"
                                        onClick={() => setAbierto(!abierto)}
                                    >
                                        {servicios.length === 0 && (
                                            <span className="text-gray-500 px-2 py-1 text-sm">Servicios</span>
                                        )}

                                        {servicios.map((servicio) => (
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
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setAbierto(!abierto)}
                                        className="px-2 text-gray-500 hover:text-gray-700"
                                    >
                                        {abierto ? '▴' : '▾'}
                                    </button>
                                </div>

                                {abierto && (
                                    <div className="absolute z-10 mt-2 w-full rounded-xl border border-gray-300 bg-white shadow-xl">
                                        {opcionesServicios.map((servicio) => (
                                            <button
                                                key={servicio}
                                                type="button"
                                                onClick={() => toggleServicio(servicio)}
                                                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center justify-between first:rounded-t-xl last:rounded-b-xl transition-colors"
                                            >
                                                <span className="text-sm">{servicio.charAt(0).toUpperCase() + servicio.slice(1)}</span>
                                                {servicios.includes(servicio) && <span className="text-blue-600 font-semibold">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative lg:col-span-1">
                                <button
                                    type="button"
                                    onClick={() => setAbiertoMasFiltros((prev) => !prev)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 transition-colors shadow-sm font-medium"
                                >
                                    <span>Más filtros</span>
                                    {contarFiltrosAdicionalesAplicados > 0 && (
                                        <span className="inline-flex min-w-[22px] justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                            {contarFiltrosAdicionalesAplicados}
                                        </span>
                                    )}
                                    <span className="text-gray-500">{abiertoMasFiltros ? '▴' : '▾'}</span>
                                </button>

                                {abiertoMasFiltros && (
                                    <div className="absolute right-0 z-30 mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
                                        <div className="mb-4 border-b border-gray-200 pb-2">
                                            <h3 className="text-sm font-bold text-gray-900">Filtros adicionales</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="mb-2 text-sm font-medium text-gray-700">Alicuota</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-700">
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="alicuota"
                                                            checked={filtrosAdicionales.alicuota === 'si'}
                                                            onChange={() => handleFiltroAdicionalChange('alicuota', 'si')}
                                                        />
                                                        Sí
                                                    </label>
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="alicuota"
                                                            checked={filtrosAdicionales.alicuota === 'no'}
                                                            onChange={() => handleFiltroAdicionalChange('alicuota', 'no')}
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
                                                            checked={filtrosAdicionales.parqueadero === 'si'}
                                                            onChange={() => handleFiltroAdicionalChange('parqueadero', 'si')}
                                                        />
                                                        Sí
                                                    </label>
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="parqueadero"
                                                            checked={filtrosAdicionales.parqueadero === 'no'}
                                                            onChange={() => handleFiltroAdicionalChange('parqueadero', 'no')}
                                                        />
                                                        No
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-2 text-sm font-medium text-gray-700">¿Mascotas?</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-700">
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="mascotas"
                                                            checked={filtrosAdicionales.mascotas === 'si'}
                                                            onChange={() => handleFiltroAdicionalChange('mascotas', 'si')}
                                                        />
                                                        Sí
                                                    </label>
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="mascotas"
                                                            checked={filtrosAdicionales.mascotas === 'no'}
                                                            onChange={() => handleFiltroAdicionalChange('mascotas', 'no')}
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
                                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                Limpiar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={aplicarFiltrosAdicionales}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
                                            >
                                                Aplicar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* PROPIEDADES */}
                <section className="px-6 py-16 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Residencias disponibles</h2>
                        <p className="text-gray-600 mb-10">Encuentra la opción perfecta para tu estancia en Quito</p>

                        {cargandoPropiedades && (
                            <div className="p-4 mb-6 text-sm text-blue-800 rounded-lg bg-blue-50 border border-blue-200">
                                <span className="font-semibold">Cargando residencias...</span>
                            </div>
                        )}

                        {errorPropiedades && !cargandoPropiedades && (
                            <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200">
                                <span className="font-semibold">{errorPropiedades}</span>
                            </div>
                        )}

                        {!cargandoPropiedades && !errorPropiedades && propiedadesFiltradas.length === 0 && (
                            <div className="p-4 mb-6 text-sm text-amber-800 rounded-lg bg-amber-50 border border-amber-200">
                                <span className="font-semibold">No hay resultados con esos filtros</span>
                            </div>
                        )}

                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ease-out ${animandoResidencias ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                            {propiedadesPaginadas.map((propiedad) => (
                                <article 
                                    key={propiedad.id} 
                                    className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
                                >
                                    <div className="relative overflow-hidden h-48 bg-gray-200">
                                        <img
                                            src={propiedad.imagenPrincipal}
                                            alt={`Residencia ${propiedad.titulo}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                {propiedad.titulo}
                                            </h3>
                                            <span className="text-lg font-bold text-blue-600 whitespace-nowrap">
                                                ${propiedad.precio}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                            {propiedad.descripcion}
                                        </p>

                                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                                            </svg>
                                            <span>{propiedad.direccion}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                                            {propiedad.numeroHabitaciones > 0 && (
                                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                                                    {propiedad.numeroHabitaciones} hab.
                                                </span>
                                            )}
                                            {propiedad.numeroBanos > 0 && (
                                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                                                    {propiedad.numeroBanos} baño(s)
                                                </span>
                                            )}
                                            {propiedad.parqueadero && (
                                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                                                    Parqueadero
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => manejarClickDetalles(propiedad)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-md"
                                        >
                                            Ver detalles
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* PAGINACIÓN */}
                        <div className="flex justify-center mt-12">
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(1)}
                                    disabled={paginaActual === 1}
                                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    &laquo;
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(paginaActual - 1)}
                                    disabled={paginaActual === 1}
                                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
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
                                >
                                    &rsaquo;
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cambiarPagina(totalPaginas)}
                                    disabled={paginaActual === totalPaginas}
                                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MODAL DETALLE */}
                {mostrarMensajeDetalle && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-200">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Información de la residencia</h3>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {detalleSeleccionado?.titulo
                                    ? `Para ver más detalles de ${detalleSeleccionado.titulo}, inicia sesión o crea una cuenta.`
                                    : "Para ver la información completa de la residencia, por favor inicia sesión o crea una cuenta."}
                            </p>

                            <div className="flex flex-col gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all transform hover:scale-105 active:scale-95"
                                >
                                    Iniciar sesión
                                </button>
                                <Link
                                    to="/register"
                                    className="px-4 py-3 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold transition-all text-center"
                                >
                                    Crear cuenta
                                </Link>
                                <button
                                    type="button"
                                    onClick={cerrarModalDetalle}
                                    className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACERCA DE */}
                <section id="acerca" className="px-6 py-16 bg-blue-50">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-4xl font-bold text-gray-900 mb-6">Acerca de PanaRoom</h2>
                        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                            <p className="text-gray-700 text-lg leading-relaxed">
                                PanaRoom es una plataforma web dedicada a facilitar la gestión de residencias estudiantiles, conectando propietarios con estudiantes que buscan alojamiento seguro y confiable en la zona de la Escuela Politécnica Nacional. Nuestro objetivo es hacer el proceso más transparente, accesible y eficiente para todos.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SERVICIOS */}
                <section id="servicios" className="px-6 py-16 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Nuestros Servicios</h2>
                        <p className="text-gray-600 text-center mb-12">Ofrecemos soluciones completas para tu búsqueda de residencia</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: FaClipboardList,
                                    titulo: "Gestión de Publicaciones",
                                    contenido: "Publica y administra residencias de forma fácil y eficiente."
                                },
                                {
                                    icon: FaUser,
                                    titulo: "Perfiles Personalizados",
                                    contenido: "Crea tu perfil y conecta con propietarios confiables."
                                },
                                {
                                    icon: FaComments,
                                    titulo: "Chat en Tiempo Real",
                                    contenido: "Comunícate directamente con propietarios y arrendatarios."
                                },
                                {
                                    icon: FaBullhorn,
                                    titulo: "Quejas y Sugerencias",
                                    contenido: "Envía tus comentarios para mejorar la experiencia."
                                }
                            ].map((servicio, i) => {
                                const IconComponent = servicio.icon;
                                return (
                                    <article
                                        key={i}
                                        className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 text-center"
                                    >
                                        <div className="flex justify-center mb-4">
                                            <IconComponent className="text-4xl text-blue-600 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                                            {servicio.titulo}
                                        </h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {servicio.contenido}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* FORMULARIO ARRENDATARIO */}
                <section className="px-6 py-16 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
                    <div className="max-w-4xl mx-auto rounded-3xl border border-white/20 bg-blue-800/50 backdrop-blur-sm p-8 md:p-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">
                            ¿Quieres publicar tus residencias?
                        </h2>
                        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                            Llena tu solicitud y únete a nuestra comunidad de propietarios confiables.
                        </p>

                        <button
                            type="button"
                            onClick={() => setMostrarFormularioArrendatario((prev) => !prev)}
                            className="inline-flex items-center rounded-full bg-white hover:bg-gray-100 text-blue-900 font-bold px-8 py-3 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                        >
                            {mostrarFormularioArrendatario ? "Ocultar formulario" : "Solicitar ahora"}
                        </button>

                        <div
                            className={`grid overflow-hidden transition-all duration-500 ease-in-out ${
                                mostrarFormularioArrendatario
                                    ? "grid-rows-[1fr] opacity-100 mt-8"
                                    : "grid-rows-[0fr] opacity-0 mt-0"
                            }`}
                        >
                            <div className="min-h-0">
                                <form onSubmit={enviarSolicitudArrendatario} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={datosSolicitud.nombre}
                                        onChange={manejarCambioSolicitud}
                                        placeholder="Nombre"
                                        className="w-full rounded-lg border border-blue-400 bg-blue-900/30 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white placeholder-blue-300"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="apellido"
                                        value={datosSolicitud.apellido}
                                        onChange={manejarCambioSolicitud}
                                        placeholder="Apellido"
                                        className="w-full rounded-lg border border-blue-400 bg-blue-900/30 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white placeholder-blue-300"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={datosSolicitud.direccion}
                                        onChange={manejarCambioSolicitud}
                                        placeholder="Dirección"
                                        className="w-full rounded-lg border border-blue-400 bg-blue-900/30 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white placeholder-blue-300 md:col-span-2"
                                        required
                                    />
                                    <input
                                        type="tel"
                                        name="celular"
                                        value={datosSolicitud.celular}
                                        onChange={manejarCambioSolicitud}
                                        placeholder="Celular"
                                        inputMode="numeric"
                                        pattern="[0-9]{7,15}"
                                        className="w-full rounded-lg border border-blue-400 bg-blue-900/30 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white placeholder-blue-300"
                                        required
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        value={datosSolicitud.email}
                                        onChange={manejarCambioSolicitud}
                                        placeholder="Correo"
                                        pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                                        className="w-full rounded-lg border border-blue-400 bg-blue-900/30 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white placeholder-blue-300"
                                        required
                                    />

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-semibold text-white">
                                            Documentos de identidad
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={manejarCambioDocumentos}
                                            className="w-full rounded-lg border border-blue-400 bg-blue-900/30 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-900"
                                        />
                                        <p className="mt-2 text-xs text-blue-200">
                                            Sube imágenes de tu cédula u otros documentos de identidad.
                                        </p>
                                        {documentosArrendatario.length > 0 && (
                                            <p className="mt-1 text-xs text-green-300 font-semibold">
                                                ✓ {documentosArrendatario.length} archivo(s) seleccionado(s)
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={enviandoSolicitud}
                                            className="inline-flex items-center justify-center rounded-lg bg-white hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed text-blue-900 font-bold px-8 py-3 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                        >
                                            {enviandoSolicitud ? "Enviando..." : "Enviar solicitud"}
                                        </button>
                                    </div>

                                    {estadoSolicitud.mensaje && (
                                        <div className={`md:col-span-2 p-4 rounded-lg text-sm font-semibold ${
                                            estadoSolicitud.tipo === "ok"
                                                ? "bg-green-500/20 text-green-100 border border-green-400"
                                                : "bg-red-500/20 text-red-100 border border-red-400"
                                        }`}>
                                            {estadoSolicitud.mensaje}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER MEJORADO */}
            <footer id="contacto" className="bg-slate-50/95 text-slate-600 py-8 border-t border-slate-200 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <p>&copy; 2026 PanaRoom. Todos los derechos reservados.</p>
                        <div className="flex gap-4">
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                <FaYoutube className="text-lg" />
                            </a>
                            <a href="https://github.com/PeerJack22/panaroom" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                <FaGithub className="text-lg" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;