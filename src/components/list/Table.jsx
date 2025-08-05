import { MdDeleteForever, MdInfo, MdPublishedWithChanges } from "react-icons/md";
import useFetch from "../../hooks/useFetch";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Table = () => {
    const { fetchDataBackend } = useFetch();
    const [departamentos, setDepartamentos] = useState([]);
    const navigate = useNavigate();

    const listarDepartamentos = async () => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/departamentos`;
        const storedUser = JSON.parse(localStorage.getItem("auth-token"));
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser.state.token}`,
        };
        const response = await fetchDataBackend(url, null, "GET", headers);
        setDepartamentos(response || []);
    };

    useEffect(() => {
        listarDepartamentos();
    }, []);

    const deleteDepartamento = async (id) => {
        console.log("ID a eliminar:", id);
        const confirmDelete = confirm("¿Estás seguro de eliminar este departamento?");
        if (confirmDelete) {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/eliminar/${id}`;
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const headers = {
                Authorization: `Bearer ${storedUser.state.token}`,
            };
            try {
                await fetchDataBackend(url, null, "DELETE", headers);
                setDepartamentos((prev) => prev.filter(dep => dep._id !== id));
                toast.success("Departamento eliminado correctamente");
            } catch (error) {
                toast.error("Error al eliminar el departamento");
            }
        }
    };

    if (!departamentos.length) {
        return (
            <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                <span className="font-medium">No existen registros</span>
            </div>
        );
    }

    return (
        <table className="w-full mt-5 table-auto shadow-lg bg-white">
            <ToastContainer />
            <thead className="bg-gray-800 text-slate-400">
                <tr>
                    {["N°", "Título", "Descripción", "Dirección", "Precio", "Habitaciones", "Baños", "Estado", "Acciones"].map((header) => (
                        <th key={header} className="p-2">{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {departamentos.map((dep, index) => (
                    <tr className="hover:bg-gray-300 text-center" key={dep._id}>
                        <td>{index + 1}</td>
                        <td>{dep.titulo}</td>
                        <td>{dep.descripcion}</td>
                        <td>{dep.direccion}</td>
                        <td>$ {dep.precioMensual}</td>
                        <td>{dep.numeroHabitaciones}</td>
                        <td>{dep.numeroBanos}</td>
                        <td>
                            <span className="bg-blue-100 text-green-500 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                                {dep.disponible ? "Disponible" : "No disponible"}
                            </span>
                        </td>
                        <td className="py-2 text-center">
                            <MdInfo
                                title="Más información"
                                className="h-7 w-7 text-slate-800 cursor-pointer inline-block mr-2 hover:text-green-600"
                                onClick={() => navigate(`/dashboard/visualizar/${dep._id}`)} 
                            />
                            <MdPublishedWithChanges
                                title="Actualizar"
                                className="h-7 w-7 text-slate-800 cursor-pointer inline-block mr-2 hover:text-blue-600"
                            />
                            <MdDeleteForever
                                title="Eliminar"
                                className="h-7 w-7 text-red-900 cursor-pointer inline-block hover:text-red-600"
                                onClick={() => deleteDepartamento(dep._id)}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default Table;