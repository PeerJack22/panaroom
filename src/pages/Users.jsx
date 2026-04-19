import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{7,15}$/;

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingStudentId, setDeletingStudentId] = useState(null);
    const [userDepartamentos, setUserDepartamentos] = useState({});
    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroRol, setFiltroRol] = useState("todos");
    const [tipoFormulario, setTipoFormulario] = useState(null);
    const [animandoCambioFormulario, setAnimandoCambioFormulario] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        direccion: "",
        celular: "",
        email: "",
        password: "",
    });

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

    const resetForm = () => {
        setFormData({
            nombre: "",
            apellido: "",
            direccion: "",
            celular: "",
            email: "",
            password: "",
        });
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
                `${import.meta.env.VITE_BACKEND_URL}/arrendatarios`,
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

            setUsers(usuariosUnificados);
            setUserDepartamentos(departamentosMap);
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

    const abrirFormulario = (tipo) => {
        if (tipoFormulario && tipoFormulario !== tipo) {
            setAnimandoCambioFormulario(true);
            setTimeout(() => {
                setTipoFormulario(tipo);
                setShowPassword(false);
                resetForm();
                setTimeout(() => setAnimandoCambioFormulario(false), 30);
            }, 180);
            return;
        }

        setTipoFormulario(tipo);
        setAnimandoCambioFormulario(false);
        setShowPassword(false);
        resetForm();
    };

    const cerrarFormulario = () => {
        setTipoFormulario(null);
        setAnimandoCambioFormulario(false);
        setShowPassword(false);
        resetForm();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "celular") {
            const soloDigitos = value.replace(/\D/g, "");
            setFormData((prev) => ({ ...prev, [name]: soloDigitos }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmitRegistro = async (e) => {
        e.preventDefault();

        if (!tipoFormulario) return;

        const camposVacios = Object.values(formData).some((value) => !String(value).trim());
        if (camposVacios) {
            toast.error("Todos los campos son obligatorios");
            return;
        }

        if (!PHONE_REGEX.test(formData.celular)) {
            toast.error("El teléfono debe contener solo números (7 a 15 dígitos)");
            return;
        }

        if (!EMAIL_REGEX.test(formData.email)) {
            toast.error("Ingresa un correo electrónico válido");
            return;
        }

        setGuardando(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const token = storedUser?.state?.token;

            const endpoint = `${import.meta.env.VITE_BACKEND_URL}/registroArrendatario`;

            const headers = {
                "Content-Type": "application/json",
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            if (!token) {
                toast.error("Necesitas sesión de administrador para registrar arrendatarios");
                return;
            }

            await axios.post(endpoint, formData, { headers });

            toast.success(
                "Arrendatario registrado correctamente"
            );

            cerrarFormulario();
            await fetchUsers();
        } catch (error) {
            const errorMsg = error?.response?.data?.msg || error?.response?.data?.message;
            toast.error(errorMsg || "No se pudo completar el registro");
        } finally {
            setGuardando(false);
        }
    };

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

    const usuariosFiltrados = users.filter((user) => {
        const nombreCompleto = `${user?.nombre || ""} ${user?.apellido || ""}`.toLowerCase();
        const nombreOk = !filtroNombre.trim() || nombreCompleto.includes(filtroNombre.trim().toLowerCase());

        const rolNormalizado = normalizarRol(user?.rol);
        const rolOk = filtroRol === "todos" || rolNormalizado === filtroRol;

        return nombreOk && rolOk;
    });

    const mostrarFormulario = Boolean(tipoFormulario);

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

            <div className="mb-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => abrirFormulario("arrendatario")}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 transition-colors"
                >
                    Registrar arrendatario
                </button>
            </div>

            <div
                className={`mb-8 overflow-hidden transition-all duration-500 ease-in-out ${
                    mostrarFormulario
                        ? "max-h-[900px] opacity-100 translate-y-0"
                        : "max-h-0 opacity-0 -translate-y-1"
                }`}
            >
                <div
                    className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 ease-in-out ${
                        animandoCambioFormulario
                            ? "opacity-0 translate-y-1 scale-[0.98]"
                            : "opacity-100 translate-y-0 scale-100"
                    }`}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800">
                            Nuevo arrendatario
                        </h2>
                        <button
                            type="button"
                            onClick={cerrarFormulario}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Cancelar
                        </button>
                    </div>

                    <form onSubmit={handleSubmitRegistro} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            placeholder="Nombre"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleInputChange}
                            placeholder="Apellido"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleInputChange}
                            placeholder="Dirección"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            name="celular"
                            value={formData.celular}
                            onChange={handleInputChange}
                            placeholder="Teléfono"
                            inputMode="numeric"
                            pattern="[0-9]{7,15}"
                            title="Ingresa solo números (7 a 15 dígitos)"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Correo electrónico"
                            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                            title="Ingresa un correo válido"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Contraseña"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute top-2.5 right-3 text-gray-500 hover:text-gray-700"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M13.875 18.825A9.956 9.956 0 0112 19c-4.418 0-8.165-2.928-9.53-7a10.005 10.005 0 0119.06 0 9.956 9.956 0 01-1.845 3.35M9.9 14.32a3 3 0 114.2-4.2m.5 3.5l3.8 3.8m-3.8-3.8L5.5 5.5" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9.95 0a9.96 9.96 0 0119.9 0m-19.9 0a9.96 9.96 0 0119.9 0M3 3l18 18" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={guardando}
                                className="rounded-md bg-blue-600 px-5 py-2 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                            >
                                {guardando ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

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
                        <div key={user._id} className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-blue-800 mb-2">
                                {user.nombre} {user.apellido}
                            </h2>
                            <div className="text-gray-600 mb-4">
                                <p><span className="font-semibold">Email:</span> {user.email}</p>
                                <p><span className="font-semibold">Teléfono:</span> {user.celular || "No disponible"}</p>
                                <p><span className="font-semibold">Dirección:</span> {user.direccion || "No disponible"}</p>
                                <p><span className="font-semibold">Rol:</span> {normalizarRol(user.rol)}</p>
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
        </div>
    );
};

export default Users;
