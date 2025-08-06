import { useEffect, useState } from "react";

const Users = () => {
    // Datos simulados por ahora
    const [users, setUsers] = useState([
        {
        id: 1,
        nombre: "Juan Pérez",
        cedula: "1723456789",
        arriendos: [
            { id: 1, nombre: "Residencia Central", precio: 250 },
            { id: 2, nombre: "Apartamento Norte", precio: 300 }
        ]
        },
        {
        id: 2,
        nombre: "María Gómez",
        cedula: "0923456789",
        arriendos: [
            { id: 3, nombre: "Suite Moderna", precio: 400 }
        ]
        }
    ]);

    // En el futuro aquí harás la petición al backend
    useEffect(() => {
        // Ejemplo de integración futura:
        // const fetchUsers = async () => {
        //   const response = await fetch('URL_BACKEND/users');
        //   const data = await response.json();
        //   setUsers(data);
        // }
        // fetchUsers();
    }, []);

    return (
        <div>
        <h1 className='font-black text-4xl text-gray-500'>Usuarios</h1>
        <hr className='my-4 border-t-2 border-gray-300' />
        <p className='mb-8'>Este módulo te permite gestionar los usuarios</p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {users.map(user => (
            <div key={user.id} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-blue-800 mb-2">{user.nombre}</h2>
                <p className="text-gray-600 mb-4">Cédula: {user.cedula}</p>

                <h3 className="text-md font-semibold text-gray-700 mb-2">Arriendos:</h3>
                {user.arriendos.length > 0 ? (
                <ul className="list-disc list-inside">
                    {user.arriendos.map(arriendo => (
                    <li key={arriendo.id} className="text-gray-600">
                        {arriendo.nombre} - ${arriendo.precio}
                    </li>
                    ))}
                </ul>
                ) : (
                <p className="text-gray-500">No tiene arriendos registrados.</p>
                )}
            </div>
            ))}
        </div>
        </div>
    );
};

export default Users;
