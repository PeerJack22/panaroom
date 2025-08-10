import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    // Esta variable de estado se usará cuando el endpoint esté disponible
    // const [userDepartamentos, setUserDepartamentos] = useState({});

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

                // Realizar la petición al backend
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/arrendatarios`, 
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                // Actualizar el estado con los datos recibidos
                setUsers(response.data);
                
                /* 
                // CÓDIGO PARA OBTENER DEPARTAMENTOS POR USUARIO
                // Este código se activará cuando el endpoint esté disponible en el backend
                
                // Obtener los departamentos para cada usuario
                const departamentosPromises = response.data.map(async (user) => {
                    try {
                        // Intentar obtener los departamentos para este usuario específico
                        const depResponse = await axios.get(
                            `${import.meta.env.VITE_BACKEND_URL}/departamentos/usuario/${user._id}`,
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );
                        return { userId: user._id, departamentos: depResponse.data };
                    } catch (error) {
                        console.error(`Error al obtener departamentos para usuario ${user._id}:`, error);
                        return { userId: user._id, departamentos: [] };
                    }
                });
                
                // Esperar a que todas las peticiones se completen
                const departamentosResults = await Promise.all(departamentosPromises);
                
                // Crear un objeto con los departamentos indexados por userId
                const departamentosMap = {};
                departamentosResults.forEach(result => {
                    departamentosMap[result.userId] = result.departamentos;
                });
                
                setUserDepartamentos(departamentosMap);
                */
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
                                {/* Este código se activará cuando el endpoint esté disponible */}
                                {/*
                                {userDepartamentos[user._id] && userDepartamentos[user._id].length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {userDepartamentos[user._id].map(depa => (
                                            <li key={depa._id} className="text-gray-600">
                                                {depa.titulo || depa.nombre || 'Sin título'} - ${depa.precioMensual || depa.precio || 0}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500">
                                        No tiene departamentos asociados.
                                    </p>
                                )}
                                */}
                                <p className="text-gray-500">
                                    La información de departamentos estará disponible próximamente.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Users;
