import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userDepartamentos, setUserDepartamentos] = useState({});
    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroRol, setFiltroRol] = useState("todos");
    const [tipoFormulario, setTipoFormulario] = useState(null);
    const [guardando, setGuardando] = useState(false);
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

            // Intentar endpoint solicitado /arrendatario y fallback a /arrendatarios
            let usersResponse;
            try {
                usersResponse = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/arrendatario`,
                    { headers }
                );
            } catch {
                usersResponse = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/arrendatarios`,
                    { headers }
                );
            }

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
        setTipoFormulario(tipo);
        resetForm();
    };

    const cerrarFormulario = () => {
        setTipoFormulario(null);
        resetForm();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
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

        setGuardando(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const token = storedUser?.state?.token;

            const endpoint = tipoFormulario === "administrador"
                ? `${import.meta.env.VITE_BACKEND_URL}/administrador/registro`
                : `${import.meta.env.VITE_BACKEND_URL}/registroArrendatario`;

            const headers = {
                "Content-Type": "application/json",
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            if (tipoFormulario === "arrendatario" && !token) {
                toast.error("Necesitas sesión de administrador para registrar arrendatarios");
                return;
            }

            await axios.post(endpoint, formData, { headers });

            toast.success(
                tipoFormulario === "administrador"
                    ? "Administrador creado correctamente"
                    : "Arrendatario registrado correctamente"
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const usuariosFiltrados = users.filter((user) => {
        const nombreCompleto = `${user?.nombre || ""} ${user?.apellido || ""}`.toLowerCase();
        const nombreOk = !filtroNombre.trim() || nombreCompleto.includes(filtroNombre.trim().toLowerCase());

        const rolNormalizado = normalizarRol(user?.rol);
        const rolOk = filtroRol === "todos" || rolNormalizado === filtroRol;

        return nombreOk && rolOk;
    });

    return (
        <div>
            <h1 className='font-black text-4xl text-gray-500'>Usuarios</h1>
            <hr className='my-4 border-t-2 border-gray-300' />
            <p className='mb-8'>Este módulo te permite gestionar los usuarios</p>

            <div className="mb-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => abrirFormulario("administrador")}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition-colors"
                >
                    Crear administrador
                </button>
                <button
                    type="button"
                    onClick={() => abrirFormulario("arrendatario")}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 transition-colors"
                >
                    Registrar arrendatario
                </button>
            </div>

            {tipoFormulario && (
                <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800">
                            {tipoFormulario === "administrador"
                                ? "Nuevo administrador"
                                : "Nuevo arrendatario"}
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
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Correo electrónico"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Contraseña"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

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
            )}

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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Users;
