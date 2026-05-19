import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    const [documentoVisualizadoIndex, setDocumentoVisualizadoIndex] = useState(0);
    const [documentoLightboxIndex, setDocumentoLightboxIndex] = useState(null);

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

        const confirmar = window.confirm(
            `¿${estaActivo ? "Desactivar" : "Activar"} la cuenta de ${usuario?.nombre || ""} ${usuario?.apellido || ""}?`
        );
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

    const abrirDetalleArrendatario = (user) => {
        if (normalizarRol(user?.rol) !== "arrendatario") return;
        setArrendatarioSeleccionado(user);
        setDocumentoVisualizadoIndex(0);
        setDocumentoLightboxIndex(null);
    };

    const cerrarDetalleArrendatario = () => {
        setArrendatarioSeleccionado(null);
        setDocumentoVisualizadoIndex(0);
        setDocumentoLightboxIndex(null);
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
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {usuariosFiltrados.map(user => (
                        <div
                            key={user._id}
                            className={`bg-white rounded-2xl shadow-lg p-6 transform transition hover:-translate-y-1 hover:shadow-xl ${normalizarRol(user.rol) === "arrendatario" ? "cursor-pointer" : ""}`}
                            onClick={() => abrirDetalleArrendatario(user)}
                            role={normalizarRol(user.rol) === "arrendatario" ? "button" : undefined}
                            tabIndex={normalizarRol(user.rol) === "arrendatario" ? 0 : undefined}
                            onKeyDown={(e) => {
                                if (normalizarRol(user.rol) !== "arrendatario") return;
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    abrirDetalleArrendatario(user);
                                }
                            }}
                        >
                            <h2 className="text-xl font-bold text-slate-900 mb-2">
                                {user.nombre} {user.apellido}
                            </h2>
                            <div className="text-slate-700 mb-4">
                                <p><span className="font-semibold">Email:</span> {user.email}</p>
                                <p><span className="font-semibold">Teléfono:</span> {user.celular || "No disponible"}</p>
                                <p><span className="font-semibold">Dirección:</span> {user.direccion || "No disponible"}</p>
                                <p><span className="font-semibold">Rol:</span> {normalizarRol(user.rol)}</p>
                                {normalizarRol(user.rol) === "arrendatario" && (
                                    <p>
                                        <span className="font-semibold">Confirmación:</span>{" "}
                                        {arrendatariosNoConfirmadosIds.includes(user?._id || user?.id)
                                            ? "Pendiente"
                                            : "Confirmado"}
                                    </p>
                                )}
                            </div>

                            {/* Sección de departamentos */}
                            {normalizarRol(user.rol) === "arrendatario" && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                                    <h3 className="text-md font-semibold text-slate-800 mb-2">Departamentos:</h3>
                                    {userDepartamentos[user._id] && userDepartamentos[user._id].length > 0 ? (
                                        <ul className="list-disc list-inside">
                                            {userDepartamentos[user._id].map(depa => (
                                                <li key={depa._id} className="text-slate-700">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/dashboard/visualizar/${depa._id}`, { state: { from: "/dashboard/usuarios" } });
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
                                                    >
                                                        {depa.titulo}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-slate-500">
                                            No tiene departamentos asociados.
                                        </p>
                                    )}

                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleEstadoUsuario(user);
                                            }}
                                            disabled={confirmingArrendatarioId === (user?._id || user?.id)}
                                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
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
                            )}

                            {normalizarRol(user.rol) === "estudiante" && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleEstadoUsuario(user);
                                        }}
                                        disabled={confirmingArrendatarioId === (user?._id || user?.id)}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
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
                            )}
                        </div>
                    ))}
                </div>
            )}

            {arrendatarioSeleccionado && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 py-6"
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
                                <p><span className="font-semibold">Rol:</span> {normalizarRol(arrendatarioSeleccionado.rol)}</p>
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
                                                            navigate(`/dashboard/visualizar/${depa._id}`);
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
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="mb-3 text-sm text-emerald-900">
                                            Este arrendatario todavía no ha sido confirmado.
                                        </p>
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
                                )}
                            </section>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {arrendatarioSeleccionado && documentoLightboxIndex !== null && documentosArrendatarioSeleccionado.length > 0 && createPortal(
                <div
                    className="fixed inset-0 z-[100000] bg-black/85 flex items-center justify-center p-4"
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
        </div>
    );
};

export default Users;
