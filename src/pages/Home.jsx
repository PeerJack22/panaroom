import logo_proyecto from '../assets/logo_proyecto.png';
import { Link } from 'react-router-dom';
import { FaSquareInstagram, FaYoutube, FaGithub } from "react-icons/fa6";
import { useEffect, useState } from 'react';
import axios from 'axios';

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

export const Home = () => {
    const [servicios, setServicios] = useState([]);
    const [abierto, setAbierto] = useState(false);
    const [abiertoPrecio, setAbiertoPrecio] = useState(false);
    const [abiertoMasFiltros, setAbiertoMasFiltros] = useState(false);
    const [precioMin, setPrecioMin] = useState("");
    const [precioMax, setPrecioMax] = useState("");
    const [habitacionesFiltro, setHabitacionesFiltro] = useState("");
    const [banosFiltro, setBanosFiltro] = useState("");
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
    const propiedadesPorPagina = 9;
    const opcionesServicios = ['luz', 'agua', 'internet'];

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
                    direccion: item?.direccion || item?.ciudad || 'Sin dirección',
                    descripcion: item?.descripcion || 'Sin descripción disponible.',
                    serviciosIncluidos: obtenerServicios(item),
                    imagenPrincipal: item?.imagenes?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                    disponible: item?.disponible !== false,
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
        // Filtrar solo propiedades disponibles
        if (propiedad.disponible === false) return false;
        
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

        return precioValido && habitacionesValidas && banosValidos && serviciosValidos && parqueaderoValido;
    });

    const totalPaginas = Math.max(1, Math.ceil(propiedadesFiltradas.length / propiedadesPorPagina));
    const indiceInicio = (paginaActual - 1) * propiedadesPorPagina;
    const propiedadesPaginadas = propiedadesFiltradas.slice(indiceInicio, indiceInicio + propiedadesPorPagina);

    useEffect(() => {
        setPaginaActual(1);
    }, [precioMin, precioMax, habitacionesFiltro, banosFiltro, servicios, filtrosAdicionalesAplicados]);

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas || nuevaPagina === paginaActual) return;

        setAnimandoResidencias(true);
        setTimeout(() => {
            setPaginaActual(nuevaPagina);
            setAnimandoResidencias(false);
        }, 180);
    };

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

        setEnviandoSolicitud(true);

        try {
            const payload = {
                nombre: datosSolicitud.nombre.trim(),
                apellido: datosSolicitud.apellido.trim(),
                direccion: datosSolicitud.direccion.trim(),
                celular: datosSolicitud.celular.trim(),
                email: datosSolicitud.email.trim().toLowerCase(),
            };

            const url = `${import.meta.env.VITE_BACKEND_URL}/arrendatario/crear`;
            const response = await axios.post(url, payload);

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
        } catch (error) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: error?.response?.data?.msg || "No se pudo enviar la solicitud. Inténtalo nuevamente.",
            });
        } finally {
            setEnviandoSolicitud(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full py-3 px-6 bg-slate-800/95 backdrop-blur-sm text-white flex flex-col md:flex-row justify-between items-center shadow-md">
                {/* Logo + Título */}
                <div className="flex items-center gap-3 mb-3 md:mb-0">
                    <img className="w-14 h-14" src={logo_proyecto} alt="Logo PanaRoom" />
                    <h1 className="font-bold text-2xl text-cyan-400 leading-none">
                        Pana<span className="text-white">Room</span>
                    </h1>
                </div>

                {/* Navegación + Botón */}
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <ul className="flex gap-4 justify-center flex-wrap text-sm md:text-base">
                        <li><a href="#" className="hover:text-cyan-400 transition-colors">Inicio</a></li>
                        <li><a href="#acerca" className="hover:text-cyan-400 transition-colors">Acerca de</a></li>
                        <li><a href="#servicios" className="hover:text-cyan-400 transition-colors">Servicios</a></li>
                        <li><a href="#contacto" className="hover:text-cyan-400 transition-colors">Contacto</a></li>
                    </ul>
                    <Link to="/login" className="inline-block bg-blue-700 hover:bg-blue-600 text-white py-1.5 px-5 rounded-full text-sm md:text-base transition-colors">
                        Ingresar
                    </Link>
                </div>
            </header>

            <main className='bg-gray-100 py-10 px-6 w-full'>
                {/* Texto e input */}
                <div className='w-full'>
                    
                    {/* Contenedor del input y botón */}
                    <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setAbiertoPrecio(!abiertoPrecio)}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <span>{textoPrecio()}</span>
                                <span className="text-gray-500">{abiertoPrecio ? '▴' : '▾'}</span>
                            </button>

                            {abiertoPrecio && (
                                <div className="absolute z-20 mt-1 w-[320px] rounded-md border border-gray-300 bg-white shadow-lg p-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={precioMin}
                                            onChange={(e) => setPrecioMin(e.target.value)}
                                            placeholder="Mín"
                                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            value={precioMax}
                                            onChange={(e) => setPrecioMax(e.target.value)}
                                            placeholder="Máx"
                                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPrecioMin("");
                                                setPrecioMax("");
                                            }}
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
                            value={habitacionesFiltro}
                            onChange={(e) => setHabitacionesFiltro(e.target.value)}
                            placeholder="Número de habitaciones"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <input
                            type="number"
                            min="0"
                            value={banosFiltro}
                            onChange={(e) => setBanosFiltro(e.target.value)}
                            placeholder="Número de baños"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <div className="relative">
                            <div className="w-full rounded-md border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 px-2 py-1 min-h-[42px] flex items-center gap-2">
                                <div
                                    className="flex-1 flex flex-wrap gap-2 cursor-pointer"
                                    onClick={() => setAbierto(!abierto)}
                                >
                                    {servicios.length === 0 && (
                                        <span className="text-gray-500 px-2 py-1">Servicios incluidos</span>
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
                                                aria-label={`Quitar ${servicio}`}
                                            >
                                                x
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setAbierto(!abierto)}
                                    className="px-2 text-gray-500 hover:text-gray-700"
                                    aria-label="Abrir opciones de servicios"
                                >
                                    {abierto ? '▴' : '▾'}
                                </button>
                            </div>

                            {abierto && (
                                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                                    {opcionesServicios.map((servicio) => (
                                        <button
                                            key={servicio}
                                            type="button"
                                            onClick={() => toggleServicio(servicio)}
                                            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                                        >
                                            <span>{servicio.charAt(0).toUpperCase() + servicio.slice(1)}</span>
                                            {servicios.includes(servicio) && <span className="text-blue-700 font-semibold">✓</span>}
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
                                <span className="text-gray-500">{abiertoMasFiltros ? '▴' : '▾'}</span>
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
                                                        checked={filtrosAdicionales.alicuotaIncluida === 'si'}
                                                        onChange={() => handleFiltroAdicionalChange('alicuotaIncluida', 'si')}
                                                    />
                                                    Si
                                                </label>
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="alicuotaIncluida"
                                                        checked={filtrosAdicionales.alicuotaIncluida === 'no'}
                                                        onChange={() => handleFiltroAdicionalChange('alicuotaIncluida', 'no')}
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
                                                    Si
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
                                            <p className="mb-2 text-sm font-medium text-gray-700">Inmobiliario</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-700">
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="inmobiliario"
                                                        checked={filtrosAdicionales.inmobiliario === 'si'}
                                                        onChange={() => handleFiltroAdicionalChange('inmobiliario', 'si')}
                                                    />
                                                    Si
                                                </label>
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="inmobiliario"
                                                        checked={filtrosAdicionales.inmobiliario === 'no'}
                                                        onChange={() => handleFiltroAdicionalChange('inmobiliario', 'no')}
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
                </div>
            </main>

            {/* Sección de propiedades */}
            <section className="px-6 py-12 bg-white">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Propiedades en arriendo</h2>
                {cargandoPropiedades && (
                    <div className="max-w-6xl mx-auto p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50" role="alert">
                        <span className="font-medium">Cargando departamentos...</span>
                    </div>
                )}

                {errorPropiedades && !cargandoPropiedades && (
                    <div className="max-w-6xl mx-auto p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                        <span className="font-medium">{errorPropiedades}</span>
                    </div>
                )}

                {!cargandoPropiedades && !errorPropiedades && propiedadesFiltradas.length === 0 && (
                    <div className="max-w-6xl mx-auto p-4 mb-4 text-sm text-amber-800 rounded-lg bg-amber-50" role="alert">
                        <span className="font-medium">No hay resultados con esos filtros</span>
                    </div>
                )}
                <div className={`max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ease-out ${animandoResidencias ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                    {propiedadesPaginadas.map((propiedad) => (
                        <article key={propiedad.id} className="bg-white rounded-xl border border-gray-200 shadow-lg p-5 flex flex-col gap-3">
                                <img
                                    src={propiedad.imagenPrincipal}
                                    alt={`Apartamento ${propiedad.id}`}
                                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-lg font-bold text-gray-800 leading-tight">{propiedad.titulo}</h3>
                                    <span className="text-sm font-semibold text-blue-800">$ {propiedad.precio} / mes</span>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-3">
                                    {propiedad.descripcion}
                                </p>

                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Dirección:</span> {propiedad.direccion}
                                </p>

                                <div className="mt-auto flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setMostrarMensajeDetalle(true)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        Detalles
                                    </button>
                                </div>
                        </article>
                    ))}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => cambiarPagina(paginaActual - 1)}
                        disabled={paginaActual === 1}
                        className="inline-block bg-blue-700 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full text-sm transition-colors cursor-pointer"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        onClick={() => cambiarPagina(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                        className="inline-block bg-blue-700 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full text-sm transition-colors cursor-pointer"
                    >
                        Siguiente
                    </button>
                </div>
            </section>

            {mostrarMensajeDetalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Información de la propiedad</h3>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            Si quieres saber la información de contacto y más detalles de la propiedad, crea una cuenta.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-600 text-white transition-colors"
                            >
                                Crear cuenta
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMostrarMensajeDetalle(false)}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

                        {/* Sección Acerca de */}
            <section id="acerca" className="px-6 py-12 bg-white">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Acerca de</h2>
                <p className="text-gray-700 text-md leading-relaxed">
                    PanaRoom es un sistema web diseñado para facilitar la gestión de residencias estudiantiles, permitiendo a propietarios publicar sus habitaciones y a los estudiantes encontrar su mejor opción de alojamiento de manera rápida y segura. Nuestro objetivo es conectar personas y crear experiencias de vivienda confiables, modernas y accesibles para toda la comunidad.
                </p>
            </section>

            <section id="servicios" className='container mx-auto px-6 py-10'>
                <h2 className='text-center text-3xl font-bold text-blue-800 mb-10'>SERVICIOS</h2>
                <div className='grid gap-6 sm:grid-cols-2 md:grid-cols-4'>
                    {[
                        {
                            titulo: "Gestión de publicaciones de Habitaciones",
                            contenido: "Publica y administra habitaciones de forma sencilla y eficiente."
                        },
                        {
                            titulo: "Perfiles de Usuarios",
                            contenido: "Crea y personaliza tu perfil para conectar con propietarios."
                        },
                        {
                            titulo: "Información detallada de los lugares",
                            contenido: "Accede a descripciones completas y fotos de las propiedades."
                        },
                        {
                            titulo: "Sistema de Quejas y Sugerencias",
                            contenido: "Envía tus comentarios para mejorar la experiencia del usuario."
                        }
                    ].map((servicio, i) => (
                        <div
                            key={i}
                            style={{ backgroundColor: '#D9D9D9' }}
                            className="shadow-md hover:shadow-xl p-6 rounded-md text-center transition-shadow duration-300"
                        >
                            <h4 className="text-lg font-semibold text-blue-700 mb-4">{servicio.titulo}</h4>
                            <p className="text-gray-700 text-sm">
                                {servicio.contenido}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="px-6 py-12 bg-slate-900 text-white">
                <div className="max-w-6xl mx-auto rounded-2xl border border-white/20 bg-slate-800/80 p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-cyan-300">
                        ¿Quieres publicar tus propiedades en arriendo cerca de la Escuela Politécnica Nacional?
                    </h2>
                    <p className="mt-3 text-slate-200 leading-relaxed text-sm md:text-base">
                        Da clic aquí y llena tus datos para la solicitud de rol arrendatario.
                    </p>

                    <div className="mt-5">
                        <button
                            type="button"
                            onClick={() => setMostrarFormularioArrendatario((prev) => !prev)}
                            className="inline-flex items-center rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2 transition-colors"
                        >
                            {mostrarFormularioArrendatario ? "Ocultar formulario" : "Clic aquí"}
                        </button>
                    </div>

                    <div
                        className={`grid overflow-hidden transition-all duration-500 ease-in-out ${
                            mostrarFormularioArrendatario
                                ? "grid-rows-[1fr] opacity-100 mt-6"
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
                                    className="w-full rounded-md border border-slate-500 bg-slate-100 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                    required
                                />
                                <input
                                    type="text"
                                    name="apellido"
                                    value={datosSolicitud.apellido}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Apellido"
                                    className="w-full rounded-md border border-slate-500 bg-slate-100 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                    required
                                />
                                <input
                                    type="text"
                                    name="direccion"
                                    value={datosSolicitud.direccion}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Dirección"
                                    className="w-full rounded-md border border-slate-500 bg-slate-100 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 md:col-span-2 text-sm"
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
                                    title="Ingresa solo números (7 a 15 dígitos)"
                                    className="w-full rounded-md border border-slate-500 bg-slate-100 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                    required
                                />
                                <input
                                    type="email"
                                    name="email"
                                    value={datosSolicitud.email}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Correo"
                                    pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                                    title="Ingresa un correo válido"
                                    className="w-full rounded-md border border-slate-500 bg-slate-100 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                    required
                                />

                                <div className="md:col-span-2 flex justify-end mt-1">
                                    <button
                                        type="submit"
                                        disabled={enviandoSolicitud}
                                        className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 transition-colors text-sm"
                                    >
                                        {enviandoSolicitud ? "Guardando..." : "Guardar solicitud"}
                                    </button>
                                </div>

                                {estadoSolicitud.mensaje && (
                                    <div className={`md:col-span-2 p-3 rounded-md text-sm ${
                                        estadoSolicitud.tipo === "ok"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-red-100 text-red-800"
                                    }`}>
                                        {estadoSolicitud.mensaje}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <footer id="contacto" className='bg-slate-800 text-white py-10 px-6'>
                <div className='flex flex-col sm:flex-row justify-between items-center mb-8'>
                    <p className='text-center text-white-400'>© 2025 PanaRoom - Todos los derechos reservados</p>
                    <div className='flex gap-4 mt-4 sm:mt-0'>
                        <p className='text-center text-white-400'>Correo: contacto@panaroom.com</p>
                        <FaSquareInstagram className='text-2xl hover:text-cyan-400' />
                        <FaYoutube className='text-2xl hover:text-cyan-400' />
                        <FaGithub className='text-2xl hover:text-cyan-400' />
                    </div>
                </div>
            </footer>
        </>
    );
};
