import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirm } from "../utils/swal";
import { MdInfo, MdClose } from 'react-icons/md';
import { FaUser, FaEnvelope, FaPhone, FaLocationDot, FaBriefcase,FaClock} from "react-icons/fa6";

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmingArrendatarioId, setConfirmingArrendatarioId] = useState(null);
    const [userDepartamentos, setUserDepartamentos] = useState({});
    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroRol, setFiltroRol] = useState("todos");
    const [soloNoConfirmados, setSoloNoConfirmados] = useState(false);
    const [arrendatariosNoConfirmadosIds, setArrendatariosNoConfirmadosIds] = useState([]);
    const [arrendatarioSeleccionado, setArrendatarioSeleccionado] = useState(null);
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
    const [documentoVisualizadoIndex, setDocumentoVisualizadoIndex] = useState(0);
    const [documentoLightboxIndex, setDocumentoLightboxIndex] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [animando, setAnimando] = useState(false);
    const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
    const [usuarioARechazar, setUsuarioARechazar] = useState(null);
    const [motivoRechazo, setMotivoRechazo] = useState("");
    const [enviandoRechazo, setEnviandoRechazo] = useState(false);
    const usuariosPorPagina = 6;

    const obtenerIdArrendatario = (valor) => {
        if (!valor) return null;
        if (typeof valor === "string") return valor;
        if (typeof valor === "object") return valor._id || valor.id || null;
        return null;
    };

    const normalizarRol = (rol) => {
        const valor = String(rol || "").trim().toLowerCase();
        if (valor === "arrendador") return "arrendatario";
        return valor;
    };
    const capitalizar = (s) => {
        if (!s) return s;
        return String(s).charAt(0).toUpperCase() + String(s).slice(1);
    };

    const normalizarDocumentos = (documentos) => {
        // Aceptar diferentes formas en las que el backend puede devolver los documentos
        if (!documentos) return [];

        // Si vienen dentro de un objeto con llave (ej: { imagenesDocumentos: [...] })
        if (!Array.isArray(documentos) && typeof documentos === "object") {
            // intentar encontrar el primer array dentro del objeto
            const nested = Object.values(documentos).find((v) => Array.isArray(v));
            if (Array.isArray(nested)) documentos = nested;
            else return [];
        }

        if (!Array.isArray(documentos)) return [];

        return documentos
            .map((doc, index) => {
                if (!doc) return null;

                // Si doc es string
                if (typeof doc === "string") {
                    return { url: doc, public_id: `${doc}-${index}` };
                }

                // Si doc tiene el campo url como string directo
                if (typeof doc.url === "string") {
                    return { url: doc.url, public_id: doc.public_id || doc._id || doc.id || `${index}` };
                }

                // Si doc.url es un objeto (por ejemplo { secure_url })
                if (typeof doc.url === "object" && doc.url !== null) {
                    const possible = doc.url.secure_url || doc.url.url || doc.url.path || Object.values(doc.url).find(v => typeof v === 'string');
                    if (possible) return { url: possible, public_id: doc.public_id || doc._id || doc.id || `${index}` };
                }

                // Algunas respuestas pueden tener directamente secure_url u otros campos
                const fallbackUrl = doc.secure_url || doc.url_secure || doc.path || doc.imagen || doc.imagenUrl || doc.image || null;
                if (typeof fallbackUrl === "string") return { url: fallbackUrl, public_id: doc.public_id || doc._id || doc.id || `${index}` };

                return null;
            })
            .filter((d) => d && d.url);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const token = storedUser?.state?.token;

            if (!token) {
                toast.error("No se encontró la sesión, por favor inicia sesión nuevamente");
                return;
            }

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };

            const usersResponse = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/administrador/listarArrendatarios`,
                { headers }
            );

            let estudiantesResponse;
            try {
                estudiantesResponse = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/estudiantes`,
                    { headers }
                );
            } catch {
                estudiantesResponse = { data: [] };
            }

            let noConfirmadosResponse;
            try {
                noConfirmadosResponse = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/administrador/arrendatarios/noconfirmados`,
                    { headers }
                );
            } catch {
                noConfirmadosResponse = { data: [] };
            }

            const departamentosResponse = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/departamentos`,
                { headers }
            );

            const usersData = Array.isArray(usersResponse?.data)
                ? usersResponse.data
                : usersResponse?.data?.arrendatarios || usersResponse?.data?.data || [];

            const estudiantesData = Array.isArray(estudiantesResponse?.data)
                ? estudiantesResponse.data
                : estudiantesResponse?.data?.estudiantes || estudiantesResponse?.data?.data || [];

            const noConfirmadosData = Array.isArray(noConfirmadosResponse?.data)
                ? noConfirmadosResponse.data
                : noConfirmadosResponse?.data?.arrendatarios || noConfirmadosResponse?.data?.data || [];

            const departamentosData = Array.isArray(departamentosResponse?.data)
                ? departamentosResponse.data
                : departamentosResponse?.data?.departamentos || departamentosResponse?.data?.data || [];

            const departamentosMap = {};

            [...usersData, ...estudiantesData].forEach((user) => {
                const userId = user?._id || user?.id;
                if (userId) departamentosMap[userId] = [];
            });

            departamentosData.forEach((dep, index) => {
                const ownerId = obtenerIdArrendatario(dep?.arrendatario);
                if (!ownerId) return;

                const titulo = dep?.titulo || dep?.nombre || "Sin título";
                if (!departamentosMap[ownerId]) departamentosMap[ownerId] = [];

                departamentosMap[ownerId].push({
                    _id: dep?._id || `${ownerId}-${index}`,
                    titulo,
                });

                const estudianteId = typeof dep?.estudiante === "object"
                    ? (dep?.estudiante?._id || dep?.estudiante?.id)
                    : (dep?.estudianteId || dep?.estudiante);

                if (estudianteId) {
                    if (!departamentosMap[estudianteId]) departamentosMap[estudianteId] = [];
                    departamentosMap[estudianteId].push({
                        _id: dep?._id || `${estudianteId}-${index}`,
                        titulo,
                    });
                }
            });

            const usuariosUnificados = [
                ...usersData.map((u) => ({
                    ...u,
                    rol: u?.rol || "arrendatario",
                    confirmEmail: u?.confirmEmail !== false,
                })),
                ...estudiantesData.map((u) => ({
                    ...u,
                    rol: u?.rol || "estudiante",
                    confirmEmail: u?.confirmEmail !== false,
                })),
            ];

            const idsNoConfirmados = noConfirmadosData
                .map((u) => u?._id || u?.id)
                .filter(Boolean);

            setUsers(usuariosUnificados);
            setUserDepartamentos(departamentosMap);
            setArrendatariosNoConfirmadosIds(idsNoConfirmados);
        } catch (error) {
            console.error("Error al obtener los usuarios:", error);
            toast.error("Error al cargar los usuarios. Intenta de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAbrirRechazo = (usuario) => {
        setUsuarioARechazar(usuario);
        setMotivoRechazo("");
        setModalRechazoAbierto(true);
    };

    const cerrarModalRechazo = () => {
        setModalRechazoAbierto(false);
        setUsuarioARechazar(null);
        setMotivoRechazo("");
    };

    const confirmarRechazo = async () => {
        const motivoTrimmed = motivoRechazo.trim();
        if (motivoTrimmed.length < 20) {
            toast.error("El motivo debe tener al menos 20 caracteres.");
            return;
        }
        if (motivoTrimmed.length > 200) {
            toast.error("El motivo no puede exceder los 200 caracteres.");
            return;
        }

        const usuarioId = usuarioARechazar?._id || usuarioARechazar?.id;
        if (userDepartamentos[usuarioId] && userDepartamentos[usuarioId].length > 0) {
            toast.error("No se puede rechazar este arrendatario porque tiene residencias asociadas.");
            return;
        }


        setEnviandoRechazo(true);

        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const token = storedUser?.state?.token;

            const url = `${import.meta.env.VITE_BACKEND_URL}/administrador/eliminar-arrendatario/${usuarioId}`;
            await axios.delete(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                data: { motivo: motivoRechazo.trim() }
            });

            toast.success("Solicitud rechazada y usuario eliminado correctamente.");
            
            setUsers((prev) => prev.filter((u) => String(u?._id || u?.id) !== String(usuarioId)));
            setArrendatariosNoConfirmadosIds((prev) => prev.filter((id) => String(id) !== String(usuarioId)));
            
            if (arrendatarioSeleccionado && String(arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id) === String(usuarioId)) {
                cerrarDetalleArrendatario();
            }
            cerrarModalRechazo();
        } catch (error) {
            toast.error(error?.response?.data?.msg || "No se pudo rechazar la solicitud.");
        } finally {
            setEnviandoRechazo(false);
        }
    };

    const handleToggleEstadoUsuario = async (usuario) => {
        const usuarioId = usuario?._id || usuario?.id;
        const tipo = normalizarRol(usuario?.rol);
        if (!usuarioId || !["estudiante", "arrendatario"].includes(tipo)) return;

        const estaActivo = usuario?.confirmEmail !== false;
        const tieneResidencias = (userDepartamentos[usuarioId] || []).length > 0;

        if (estaActivo && tieneResidencias) {
            toast.error("No puedes desactivar esta cuenta porque tiene residencias asignadas.");
            return;
        }

        const confirmar = await confirm({
            title: `${estaActivo ? 'Desactivar' : 'Activar'} cuenta`,
            text: `¿${estaActivo ? 'Desactivar' : 'Activar'} la cuenta de ${usuario?.nombre || ''} ${usuario?.apellido || ''}?`,
            confirmButtonText: estaActivo ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar',
            icon: 'warning',
        });
        if (!confirmar) return;

        setConfirmingArrendatarioId(usuarioId);
        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const token = storedUser?.state?.token;
            if (!token) {
                toast.error("No se encontró la sesión, por favor inicia sesión nuevamente");
                return;
            }

            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/administrador/estadoUsuario`,
                { id: usuarioId, tipo, confirmEmail: !estaActivo },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const nuevoEstado = !estaActivo;
            setUsers((prev) => prev.map((u) => {
                const userId = u?._id || u?.id;
                return String(userId) === String(usuarioId) ? { ...u, confirmEmail: nuevoEstado } : u;
            }));

            if (tipo === "arrendatario") {
                setArrendatariosNoConfirmadosIds((prev) => (
                    nuevoEstado ? prev.filter((id) => String(id) !== String(usuarioId)) : (prev.includes(usuarioId) ? prev : [...prev, usuarioId])
                ));
            }

            toast.success(nuevoEstado ? "Cuenta activada correctamente" : "Cuenta desactivada correctamente");
        } catch (error) {
            const errorMsg = error?.response?.data?.msg || error?.response?.data?.message;
            toast.error(errorMsg || "No se pudo cambiar el estado de la cuenta");
        } finally {
            setConfirmingArrendatarioId(null);
        }
    };

    const usuariosFiltrados = users.filter((user) => {
        const nombreCompleto = `${user?.nombre || ""} ${user?.apellido || ""}`.toLowerCase();
        const nombreOk = !filtroNombre.trim() || nombreCompleto.includes(filtroNombre.trim().toLowerCase());

        const rolNormalizado = normalizarRol(user?.rol);
        const rolOk = filtroRol === "todos" || rolNormalizado === filtroRol;

        const userId = user?._id || user?.id;
        const esNoConfirmado = arrendatariosNoConfirmadosIds.includes(userId);
        const noConfirmadoOk =
            !soloNoConfirmados ||
            (rolNormalizado === "arrendatario" && esNoConfirmado);

        return nombreOk && rolOk && noConfirmadoOk;
    });

    useEffect(() => {
        setPaginaActual(1);
    }, [filtroNombre, filtroRol, soloNoConfirmados]);

    const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / usuariosPorPagina));
    const indiceInicio = (paginaActual - 1) * usuariosPorPagina;
    const usuariosPaginados = usuariosFiltrados.slice(indiceInicio, indiceInicio + usuariosPorPagina);

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas || nuevaPagina === paginaActual) return;
        setAnimando(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            setPaginaActual(nuevaPagina);
            setAnimando(false);
        }, 200);
    };

    const paginasVisibles = (() => {
        if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, index) => index + 1);
        const inicio = Math.max(1, paginaActual - 2);
        const fin = Math.min(totalPaginas, inicio + 4);
        const inicioAjustado = Math.max(1, fin - 4);
        const paginas = [];
        if (inicioAjustado > 1) {
            paginas.push(1);
            if (inicioAjustado > 2) paginas.push("...");
        }
        for (let p = inicioAjustado; p <= fin; p += 1) paginas.push(p);
        if (fin < totalPaginas) {
            if (fin < totalPaginas - 1) paginas.push("...");
            paginas.push(totalPaginas);
        }
        return paginas;
    })();

    const abrirDetalleArrendatario = (user) => {
        if (normalizarRol(user?.rol) !== "arrendatario") return;
        setArrendatarioSeleccionado(user);
        setDocumentoVisualizadoIndex(0);
        setDocumentoLightboxIndex(null);
    };

    const abrirDetalleEstudiante = (user) => {
        if (normalizarRol(user?.rol) !== "estudiante") return;
        setEstudianteSeleccionado(user);
    };

    const cerrarDetalleArrendatario = () => {
        setArrendatarioSeleccionado(null);
        setDocumentoVisualizadoIndex(0);
        setDocumentoLightboxIndex(null);
    };

    const cerrarDetalleEstudiante = () => {
        setEstudianteSeleccionado(null);
    };

    const documentosArrendatarioSeleccionado = arrendatarioSeleccionado
        ? normalizarDocumentos(arrendatarioSeleccionado?.imagenesDocumentos)
        : [];

    const documentoActual = documentosArrendatarioSeleccionado[documentoVisualizadoIndex] || null;

    const abrirDocumentoEnIndice = (index) => {
        const totalDocumentos = documentosArrendatarioSeleccionado.length;
        if (!totalDocumentos) return;

        const indexNormalizado = ((index % totalDocumentos) + totalDocumentos) % totalDocumentos;
        setDocumentoVisualizadoIndex(indexNormalizado);
    };

    const abrirLightboxDocumento = (index) => {
        const totalDocumentos = documentosArrendatarioSeleccionado.length;
        if (!totalDocumentos) return;

        const indexNormalizado = ((index % totalDocumentos) + totalDocumentos) % totalDocumentos;
        setDocumentoLightboxIndex(indexNormalizado);
    };

    const cerrarLightboxDocumento = () => {
        setDocumentoLightboxIndex(null);
    };

    const irDocumentoAnterior = () => {
        const totalDocumentos = documentosArrendatarioSeleccionado.length;
        if (!totalDocumentos) return;

        setDocumentoLightboxIndex((prev) => {
            if (prev === null) return 0;
            return (prev - 1 + totalDocumentos) % totalDocumentos;
        });
    };

    const irDocumentoSiguiente = () => {
        const totalDocumentos = documentosArrendatarioSeleccionado.length;
        if (!totalDocumentos) return;

        setDocumentoLightboxIndex((prev) => {
            if (prev === null) return 0;
            return (prev + 1) % totalDocumentos;
        });
    };

    useEffect(() => {
        if (!arrendatarioSeleccionado) return undefined;
        const totalDocumentos = documentosArrendatarioSeleccionado.length;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                if (documentoLightboxIndex !== null) {
                    cerrarLightboxDocumento();
                    return;
                }
                cerrarDetalleArrendatario();
            }

            if (documentoLightboxIndex !== null && event.key === "ArrowRight") {
                if (!totalDocumentos) return;
                setDocumentoLightboxIndex((prev) => {
                    if (prev === null) return 0;
                    return (prev + 1) % totalDocumentos;
                });
            }

            if (documentoLightboxIndex !== null && event.key === "ArrowLeft") {
                if (!totalDocumentos) return;
                setDocumentoLightboxIndex((prev) => {
                    if (prev === null) return 0;
                    return (prev - 1 + totalDocumentos) % totalDocumentos;
                });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [arrendatarioSeleccionado, documentoLightboxIndex, documentosArrendatarioSeleccionado.length]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 py-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div className="w-full flex flex-col px-2 md:px-4">
            <h1 className='text-3xl sm:text-4xl font-extrabold text-slate-900'>Usuarios</h1>
            <p className='mt-2 text-sm text-slate-500'>Este módulo te permite gestionar los usuarios</p>
            <hr className="mt-6 border-slate-200" />
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                    placeholder="Filtrar por nombre"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="todos">Todos los roles</option>
                    <option value="arrendatario">Arrendatario</option>
                    <option value="estudiante">Estudiante</option>
                </select>
            </div>

            <div className="mb-6 flex items-center gap-3">
                <input
                    id="soloNoConfirmados"
                    type="checkbox"
                    checked={soloNoConfirmados}
                    onChange={(e) => {
                        setSoloNoConfirmados(e.target.checked);
                        if (e.target.checked) {
                            setFiltroRol("arrendatario");
                        }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="soloNoConfirmados" className="text-sm font-medium text-gray-700">
                    Solo arrendatarios no confirmados
                </label>
            </div>

            {users.length === 0 ? (
                <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
                    No se encontraron usuarios registrados.
                </div>
            ) : usuariosFiltrados.length === 0 ? (
                <div className="bg-amber-100 text-amber-800 p-4 rounded-lg">
                    No hay resultados para ese filtro.
                </div>
            ) : (
                <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300 ease-out ${animando ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                    {usuariosPaginados.map(user => {
                        const fallbackAvatar = 'https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3';
                        const userAvatar = user.avatarUrl || user.avatarArren || user.avatarArrenIA || fallbackAvatar;

                        return (
                        <div
                            key={user._id}
                            className="bg-white rounded-2xl shadow-lg p-6 transform transition hover:-translate-y-1 hover:shadow-xl flex flex-col"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={userAvatar}
                                    alt={`${user.nombre} ${user.apellido}`}
                                    className="h-14 w-14 rounded-full border-2 border-slate-100 object-cover shadow-sm bg-slate-100 shrink-0"
                                />
                                <div className="min-w-0">
                                    <h2 className="text-xl font-bold text-slate-900 leading-tight truncate">
                                        {user.nombre} {user.apellido}
                                    </h2>
                                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">{capitalizar(normalizarRol(user.rol))}</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-slate-700 mb-4 flex-1">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FaEnvelope className="shrink-0 text-slate-400 text-xs" />
                                    <span className="text-sm truncate" title={user.email}>{user.email || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaPhone className="shrink-0 text-slate-400 text-xs" />
                                    <span className="text-sm">{user.celular || "N/A"}</span>
                                </div>
                                {normalizarRol(user.rol) === "arrendatario" && arrendatariosNoConfirmadosIds.includes(user?._id || user?.id) && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase">
                                        <FaClock className="animate-pulse" />
                                        Pendiente de revisión
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    title="Ver detalles"
                                    onClick={() => {
                                        if (normalizarRol(user.rol) === "arrendatario") abrirDetalleArrendatario(user);
                                        if (normalizarRol(user.rol) === "estudiante") abrirDetalleEstudiante(user);
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
                                >
                                    <MdInfo className="h-5 w-5" />
                                </button>
                                {normalizarRol(user.rol) === "arrendatario" && arrendatariosNoConfirmadosIds.includes(user?._id || user?.id) && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAbrirRechazo(user);
                                        }}
                                        className="rounded-full px-3.5 py-2 text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all shadow-sm"
                                    >
                                        Rechazar
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleEstadoUsuario(user);
                                    }}
                                    disabled={confirmingArrendatarioId === (user?._id || user?.id)}
                                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-60 ${
                                        user?.confirmEmail === false
                                            ? "bg-emerald-600 text-white hover:shadow-md"
                                            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                    }`}
                                >
                                    {confirmingArrendatarioId === (user?._id || user?.id)
                                        ? "Guardando..."
                                        : user?.confirmEmail === false
                                            ? "Activar cuenta"
                                            : "Desactivar cuenta"}
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {/* PAGINACIÓN */}
            {totalPaginas > 1 && (
                <div className="flex justify-center mt-12 mb-8">
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
            )}

            {estudianteSeleccionado && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 md:p-6 backdrop-blur-sm"
                    onClick={cerrarDetalleEstudiante}
                >
                    <div
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-white shrink-0">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900">Información del Estudiante</h3>
                                <p className="text-xs text-slate-500 font-medium tracking-wider">Verificación de identidad</p>
                            </div>
                            <button
                                type="button"
                                onClick={cerrarDetalleEstudiante}
                                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                            >
                                <MdClose className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                                            <FaUser className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 leading-tight">
                                                {estudianteSeleccionado.nombre} {estudianteSeleccionado.apellido}
                                            </h4>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 mt-1">
                                                <FaBriefcase className="h-3 w-3" /> {capitalizar(normalizarRol(estudianteSeleccionado.rol))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t border-slate-100 pt-6">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <FaEnvelope className="h-4 w-4 text-slate-400" />
                                            <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400">Email</span><span className="text-sm font-medium">{estudianteSeleccionado.email}</span></div>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <FaPhone className="h-4 w-4 text-slate-400" />
                                            <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400">Teléfono</span><span className="text-sm font-medium">{estudianteSeleccionado.celular || "No disponible"}</span></div>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <FaLocationDot className="h-4 w-4 text-slate-400" />
                                            <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400">Dirección</span><span className="text-sm font-medium">{estudianteSeleccionado.direccion || "No disponible"}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {estudianteSeleccionado?.confirmEmail === false && (
                                    <div className="flex flex-col justify-center">
                                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 text-center">
                                        <FaClock className="h-10 w-10 text-emerald-600 mx-auto mb-3 opacity-80" />
                                        <p className="mb-4 text-sm font-semibold text-emerald-900">Este estudiante tiene su cuenta pendiente de activación.</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleEstadoUsuario(estudianteSeleccionado);
                                            }}
                                            disabled={confirmingArrendatarioId === (estudianteSeleccionado?._id || estudianteSeleccionado?.id)}
                                            className="w-full rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60"
                                        >
                                            {confirmingArrendatarioId === (estudianteSeleccionado?._id || estudianteSeleccionado?.id)
                                                ? "Guardando..."
                                                : "Activar cuenta"}
                                        </button>
                                    </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {arrendatarioSeleccionado && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
                    onClick={cerrarDetalleArrendatario}
                >
                    <div
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                            <div>
                                <h3 className="text-2xl font-extrabold text-slate-900">Detalle del arrendatario</h3>
                                <p className="text-sm text-slate-600">Revisa la información y los documentos antes de confirmar.</p>
                            </div>
                            <button
                                type="button"
                                onClick={cerrarDetalleArrendatario}
                                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:shadow-md"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                            <section className="space-y-3">
                                <h4 className="text-xl font-bold text-slate-900">
                                    {arrendatarioSeleccionado.nombre} {arrendatarioSeleccionado.apellido}
                                </h4>
                                <p><span className="font-semibold">Email:</span> {arrendatarioSeleccionado.email || "No disponible"}</p>
                                <p><span className="font-semibold">Teléfono:</span> {arrendatarioSeleccionado.celular || "No disponible"}</p>
                                <p><span className="font-semibold">Dirección:</span> {arrendatarioSeleccionado.direccion || "No disponible"}</p>
                                <p><span className="font-semibold">Rol:</span> {capitalizar(normalizarRol(arrendatarioSeleccionado.rol))}</p>
                                <p>
                                    <span className="font-semibold">Confirmación:</span>{" "}
                                    {arrendatariosNoConfirmadosIds.includes(arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id)
                                        ? "Pendiente"
                                        : "Confirmado"}
                                </p>

                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <h5 className="mb-2 text-lg font-semibold text-slate-900">Documentos subidos</h5>
                                    {documentosArrendatarioSeleccionado.length > 0 ? (
                                        <div className="space-y-4">
                                            <button
                                                type="button"
                                                onClick={() => abrirLightboxDocumento(documentoVisualizadoIndex)}
                                                className="group relative block w-full overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-lg"
                                                title="Abrir imagen en visor"
                                            >
                                                <img
                                                    src={documentoActual?.url}
                                                    alt="Documento de identidad"
                                                    className="h-[420px] w-full object-contain bg-black"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-sm text-white">
                                                    Clic para abrir en visor completo
                                                </div>
                                            </button>

                                            {documentosArrendatarioSeleccionado.length > 1 && (
                                                <div className="flex items-center justify-between gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirDocumentoEnIndice(documentoVisualizadoIndex - 1)}
                                                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                    >
                                                        Anterior
                                                    </button>

                                                    <p className="text-sm text-slate-500">
                                                        {documentoVisualizadoIndex + 1} de {documentosArrendatarioSeleccionado.length}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() => abrirDocumentoEnIndice(documentoVisualizadoIndex + 1)}
                                                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                    >
                                                        Siguiente
                                                    </button>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                                {documentosArrendatarioSeleccionado.map((doc, index) => (
                                                    <button
                                                        key={doc.public_id || doc.url || index}
                                                        type="button"
                                                        onClick={() => abrirDocumentoEnIndice(index)}
                                                        className={`overflow-hidden rounded-lg border-2 transition-all ${
                                                            index === documentoVisualizadoIndex
                                                                ? "border-blue-600 ring-2 ring-blue-200"
                                                                : "border-slate-200 hover:border-slate-300"
                                                        }`}
                                                    >
                                                        <img
                                                            src={doc.url}
                                                            alt={`Documento ${index + 1}`}
                                                            className="h-24 w-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No hay documentos cargados.</p>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <h5 className="mb-3 text-lg font-semibold text-slate-900">Departamentos asociados</h5>
                                    {userDepartamentos[arrendatarioSeleccionado._id] && userDepartamentos[arrendatarioSeleccionado._id].length > 0 ? (
                                        <ul className="space-y-2">
                                            {userDepartamentos[arrendatarioSeleccionado._id].map((depa) => (
                                                <li key={depa._id} className="text-slate-700">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/dashboard/visualizar/${depa._id}`, {
                                                                state: { from: "/dashboard/usuarios" },
                                                            });
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 font-semibold"
                                                    >
                                                        {depa.titulo}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-500">No tiene departamentos asociados.</p>
                                    )}
                                </div>

                                {arrendatariosNoConfirmadosIds.includes(arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id) && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="mb-3 text-sm text-slate-700">
                                                Este arrendatario todavía no ha sido confirmado.
                                            </p>
                                            <div className="flex items-center gap-3">
                                                {arrendatariosNoConfirmadosIds.includes(arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAbrirRechazo(arrendatarioSeleccionado)}
                                                        disabled={confirmingArrendatarioId === (arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id)}
                                                        className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-60"
                                                    >
                                                        Rechazar solicitud
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleEstadoUsuario(arrendatarioSeleccionado);
                                                    }}
                                                    disabled={confirmingArrendatarioId === (arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id)}
                                                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-md transition-colors disabled:opacity-60"
                                                >
                                                    {confirmingArrendatarioId === (arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id)
                                                        ? "Guardando..."
                                                        : "Activar cuenta"}
                                                </button>
                                            </div>
                                        </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {arrendatarioSeleccionado && documentoLightboxIndex !== null && documentosArrendatarioSeleccionado.length > 0 && createPortal(
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
                    onClick={cerrarLightboxDocumento}
                >
                    <button
                        type="button"
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-2xl w-10 h-10 rounded-full"
                        onClick={cerrarLightboxDocumento}
                        aria-label="Cerrar visor"
                    >
                        ×
                    </button>

                    {documentosArrendatarioSeleccionado.length > 1 && (
                        <button
                            type="button"
                            className="absolute left-4 md:left-8 bg-white/10 hover:bg-white/20 text-white text-2xl w-11 h-11 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                irDocumentoAnterior();
                            }}
                            aria-label="Documento anterior"
                        >
                            ‹
                        </button>
                    )}

                    <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={documentosArrendatarioSeleccionado[documentoLightboxIndex]?.url}
                            alt={`Documento ${documentoLightboxIndex + 1}`}
                            className="w-full max-h-[82vh] object-contain rounded-xl"
                        />
                        <p className="text-white text-sm mt-3 text-center">
                            Documento {documentoLightboxIndex + 1} de {documentosArrendatarioSeleccionado.length}
                        </p>
                    </div>

                    {documentosArrendatarioSeleccionado.length > 1 && (
                        <button
                            type="button"
                            className="absolute right-4 md:right-8 bg-white/10 hover:bg-white/20 text-white text-2xl w-11 h-11 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                irDocumentoSiguiente();
                            }}
                            aria-label="Siguiente documento"
                        >
                            ›
                        </button>
                    )}
                </div>,
                document.body
            )}

            {modalRechazoAbierto && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <div 
                        className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-200" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Rechazar solicitud</h3>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            Se eliminará la cuenta de <strong>{usuarioARechazar?.nombre} {usuarioARechazar?.apellido}</strong>. Ingresa el motivo para notificarle por correo electrónico.
                        </p>
                        
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Motivo del rechazo</label>
                            <textarea
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[120px] resize-none transition-all"
                                placeholder="Ej: Los documentos de identidad no son legibles o están incompletos..."
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                minLength={20}
                                maxLength={200}
                            />
                            <p className="text-xs text-slate-500 text-right mt-1">
                                {motivoRechazo.length} / 200 caracteres
                            </p>
                        </div>
                        
                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={cerrarModalRechazo}
                                disabled={enviandoRechazo}
                                className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarRechazo} // La validación se hace dentro de la función
                                disabled={enviandoRechazo || motivoRechazo.trim().length < 20 || motivoRechazo.trim().length > 200}
                                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {enviandoRechazo ? "Enviando..." : "Confirmar rechazo"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            </div>
        </div>
    );
};

export default Users;
