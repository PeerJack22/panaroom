import { MdDeleteForever, MdInfo, MdPublishedWithChanges } from "react-icons/md";

const TableResidencias = ({ residencias }) => {
    return (
        <table className="w-full mt-5 table-auto shadow-lg bg-white">
            <thead className="bg-gray-800 text-slate-400">
                <tr>
                    {["N°", "Nombre", "Descripción", "Precio ($)", "Dirección", "Capacidad", "Estado", "Acciones"].map((header) => (
                        <th key={header} className="p-2">{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {residencias && residencias.length > 0 ? (
                    residencias.map((residencia, index) => (
                        <tr key={residencia.id} className="hover:bg-gray-300 text-center">
                            <td>{index + 1}</td>
                            <td>{residencia.nombre || '--'}</td>
                            <td>{residencia.descripcion || '--'}</td>
                            <td>{residencia.precio || '--'}</td>
                            <td>{residencia.direccion || '--'}</td>
                            <td>{residencia.capacidad || '--'}</td>
                            <td>{residencia.estado || 'Activa'}</td>
                            <td className="py-2 text-center">
                                <MdInfo 
                                    title="Más información" 
                                    className="h-7 w-7 text-slate-800 cursor-pointer inline-block mr-2 hover:text-green-600"
                                    // onClick={() => handleInfo(residencia.id)}
                                />

                                <MdPublishedWithChanges 
                                    title="Actualizar" 
                                    className="h-7 w-7 text-slate-800 cursor-pointer inline-block mr-2 hover:text-blue-600"
                                    // onClick={() => handleUpdate(residencia.id)}
                                />

                                <MdDeleteForever 
                                    title="Eliminar" 
                                    className="h-7 w-7 text-red-900 cursor-pointer inline-block hover:text-red-600"
                                    // onClick={() => handleDelete(residencia.id)}
                                />
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="8" className="text-center py-4 text-gray-500">No hay residencias registradas</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default TableResidencias;
