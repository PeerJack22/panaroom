import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userDepartamentos, setUserDepartamentos] = useState({});

    const obtenerIdArrendatario = (valor) => {
        if (!valor) return null;
        if (typeof valor === "string") return valor;
        if (typeof valor === "object") return valor._id || valor.id || null;
        return null;
    };

    useEffect(() => {
        const fetchUsers = async () => {
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

                const departamentosResponse = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/departamentos`,
                    { headers }
                );

                const usersData = Array.isArray(usersResponse?.data)
                    ? usersResponse.data
                    : usersResponse?.data?.arrendatarios || usersResponse?.data?.data || [];

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

                setUsers(usersData);
                setUserDepartamentos(departamentosMap);
            } catch (error) {
                console.error("Error al obtener los usuarios:", error);
                toast.error("Error al cargar los usuarios. Intenta de nuevo más tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

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

            {users.length === 0 ? (
                <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
                    No se encontraron usuarios registrados.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {users.map(user => (
                        <div key={user._id} className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-blue-800 mb-2">
                                {user.nombre} {user.apellido}
                            </h2>
                            <div className="text-gray-600 mb-4">
                                <p><span className="font-semibold">Email:</span> {user.email}</p>
                                <p><span className="font-semibold">Teléfono:</span> {user.celular || "No disponible"}</p>
                                <p><span className="font-semibold">Dirección:</span> {user.direccion || "No disponible"}</p>
                                <p><span className="font-semibold">Rol:</span> {user.rol}</p>
                            </div>

                            {/* Sección de departamentos */}
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <h3 className="text-md font-semibold text-gray-700 mb-2">Departamentos:</h3>
                                {userDepartamentos[user._id] && userDepartamentos[user._id].length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {userDepartamentos[user._id].map(depa => (
                                            <li key={depa._id} className="text-gray-600">
                                                {depa.titulo}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500">
                                        No tiene departamentos asociados.
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Users;
