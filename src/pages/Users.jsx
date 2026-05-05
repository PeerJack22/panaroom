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
    const [deletingStudentId, setDeletingStudentId] = useState(null);
    const [confirmingArrendatarioId, setConfirmingArrendatarioId] = useState(null);
    const [userDepartamentos, setUserDepartamentos] = useState({});
    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroRol, setFiltroRol] = useState("todos");
    const [soloNoConfirmados, setSoloNoConfirmados] = useState(false);
    const [arrendatariosNoConfirmadosIds, setArrendatariosNoConfirmadosIds] = useState([]);
    const [arrendatarioSeleccionado, setArrendatarioSeleccionado] = useState(null);

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
            // Obtener el token del localStorage
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

            // Endpoint principal para listar arrendatarios
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

            usersData.forEach((user) => {
                if (user?._id) departamentosMap[user._id] = [];
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
            });

            const usuariosUnificados = [
                ...usersData.map((u) => ({
                    ...u,
                    rol: u?.rol || "arrendatario",
                })),
                ...estudiantesData.map((u) => ({
                    ...u,
                    rol: u?.rol || "estudiante",
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

    const handleDeleteStudent = async (student) => {
        const studentId = student?._id || student?.id;
        if (!studentId) {
            toast.error("No se pudo identificar el estudiante");
            return;
        }

        const confirmar = confirm(`¿Seguro que deseas eliminar al estudiante ${student?.nombre || ""} ${student?.apellido || ""}?`);
        if (!confirmar) return;

        setDeletingStudentId(studentId);
        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const token = storedUser?.state?.token;

            if (!token) {
                toast.error("No se encontró la sesión, por favor inicia sesión nuevamente");
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/estudiante/${studentId}`, { headers });

            setUsers((prev) => prev.filter((u) => (u?._id || u?.id) !== studentId));
            toast.success("Estudiante eliminado correctamente");
        } catch (error) {
            const errorMsg = error?.response?.data?.msg || error?.response?.data?.message;
            toast.error(errorMsg || "No se pudo eliminar el estudiante");
        } finally {
            setDeletingStudentId(null);
        }
    };

    const handleConfirmArrendatario = async (arrendatario) => {
        const arrendatarioId = arrendatario?._id || arrendatario?.id;
        if (!arrendatarioId) {
            toast.error("No se pudo identificar al arrendatario");
            return;
        }

        const confirmar = confirm(`¿Confirmar al arrendatario ${arrendatario?.nombre || ""} ${arrendatario?.apellido || ""}?`);
        if (!confirmar) return;

        setConfirmingArrendatarioId(arrendatarioId);
        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const token = storedUser?.state?.token;

            if (!token) {
                toast.error("No se encontró la sesión, por favor inicia sesión nuevamente");
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/arrendatarios/confirmar/${arrendatarioId}`,
                {},
                { headers }
            );

            setArrendatariosNoConfirmadosIds((prev) =>
                prev.filter((id) => id !== arrendatarioId)
            );

            setUsers((prev) =>
                prev.map((u) => {
                    const userId = u?._id || u?.id;
                    if (userId !== arrendatarioId) return u;
                    return {
                        ...u,
                        confirmEmail: true,
                    };
                })
            );

            toast.success("Arrendatario confirmado correctamente");
        } catch (error) {
            const errorMsg = error?.response?.data?.msg || error?.response?.data?.message;
            toast.error(errorMsg || "No se pudo confirmar al arrendatario");
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
    };

    const cerrarDetalleArrendatario = () => {
        setArrendatarioSeleccionado(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className='font-black text-4xl text-gray-500'>Usuarios</h1>
            <hr className='my-4 border-t-2 border-gray-300' />
            <p className='mb-8'>Este módulo te permite gestionar los usuarios</p>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                    placeholder="Filtrar por nombre"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className={`bg-white rounded-lg shadow p-6 ${normalizarRol(user.rol) === "arrendatario" ? "cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-lg" : ""}`}
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
                            <h2 className="text-xl font-bold text-blue-800 mb-2">
                                {user.nombre} {user.apellido}
                            </h2>
                            <div className="text-gray-600 mb-4">
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
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <h3 className="text-md font-semibold text-gray-700 mb-2">Departamentos:</h3>
                                    {userDepartamentos[user._id] && userDepartamentos[user._id].length > 0 ? (
                                        <ul className="list-disc list-inside">
                                            {userDepartamentos[user._id].map(depa => (
                                                <li key={depa._id} className="text-gray-600">
                                                    <button
                                                        onClick={() => navigate(`/dashboard/visualizar/${depa._id}`)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                                                    >
                                                        {depa.titulo}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500">
                                            No tiene departamentos asociados.
                                        </p>
                                    )}

                                    {arrendatariosNoConfirmadosIds.includes(user?._id || user?.id) && (
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleConfirmArrendatario(user);
                                                }}
                                                disabled={confirmingArrendatarioId === (user?._id || user?.id)}
                                                className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
                                            >
                                                {confirmingArrendatarioId === (user?._id || user?.id)
                                                    ? "Confirmando..."
                                                    : "Confirmar arrendatario"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {normalizarRol(user.rol) === "estudiante" && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteStudent(user)}
                                        disabled={deletingStudentId === (user?._id || user?.id)}
                                        className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
                                    >
                                        {deletingStudentId === (user?._id || user?.id) ? "Eliminando..." : "Eliminar estudiante"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {arrendatarioSeleccionado && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4 py-6">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200">
                        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">Detalle del arrendatario</h3>
                                <p className="text-sm text-gray-500">Revisa la información y los documentos antes de confirmar.</p>
                            </div>
                            <button
                                type="button"
                                onClick={cerrarDetalleArrendatario}
                                className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                            <section className="space-y-3">
                                <h4 className="text-xl font-bold text-blue-800">
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

                                <div className="rounded-xl bg-gray-50 p-4">
                                    <h5 className="mb-2 text-lg font-semibold text-gray-800">Documentos subidos</h5>
                                    {normalizarDocumentos(arrendatarioSeleccionado?.imagenesDocumentos).length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {normalizarDocumentos(arrendatarioSeleccionado?.imagenesDocumentos).map((doc) => (
                                                <a
                                                    key={doc.public_id || doc.url}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <img
                                                        src={doc.url}
                                                        alt="Documento de identidad"
                                                        className="h-52 w-full object-cover"
                                                    />
                                                    <div className="px-3 py-2 text-xs text-gray-500">
                                                        Clic para abrir en tamaño completo
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No hay documentos cargados.</p>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h5 className="mb-3 text-lg font-semibold text-gray-800">Departamentos asociados</h5>
                                    {userDepartamentos[arrendatarioSeleccionado._id] && userDepartamentos[arrendatarioSeleccionado._id].length > 0 ? (
                                        <ul className="space-y-2">
                                            {userDepartamentos[arrendatarioSeleccionado._id].map((depa) => (
                                                <li key={depa._id} className="text-gray-700">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/dashboard/visualizar/${depa._id}`);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                                    >
                                                        {depa.titulo}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">No tiene departamentos asociados.</p>
                                    )}
                                </div>

                                {arrendatariosNoConfirmadosIds.includes(arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id) && (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="mb-3 text-sm text-emerald-900">
                                            Este arrendatario todavía no ha sido confirmado.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConfirmArrendatario(arrendatarioSeleccionado);
                                            }}
                                            disabled={confirmingArrendatarioId === (arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id)}
                                            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
                                        >
                                            {confirmingArrendatarioId === (arrendatarioSeleccionado?._id || arrendatarioSeleccionado?.id)
                                                ? "Confirmando..."
                                                : "Confirmar arrendatario"}
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Users;
