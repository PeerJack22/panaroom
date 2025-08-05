import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useFetch from "../hooks/useFetch";

const Details = () => {
    const { id } = useParams(); // Obtiene el id de la URL
    const { fetchDataBackend } = useFetch();
    const [departamento, setDepartamento] = useState(null);

    useEffect(() => {
        const fetchDepartamento = async () => {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${storedUser.state.token}`,
            };
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/${id}`;
            const response = await fetchDataBackend(url, null, "GET", headers);
            setDepartamento(response);
        };
        fetchDepartamento();
    }, [id]);

    if (!departamento) {
        return (
            <div className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50" role="alert">
                <span className="font-medium">Cargando datos del departamento...</span>
            </div>
        );
    }

    return (
        <div>
            <h1 className='font-black text-4xl text-gray-500 mb-4'>Detalles del Departamento</h1>
            <ul className="list-disc pl-5">
                <li><span className="font-bold">Título:</span> {departamento.titulo}</li>
                <li><span className="font-bold">Descripción:</span> {departamento.descripcion}</li>
                <li><span className="font-bold">Dirección:</span> {departamento.direccion}</li>
                <li><span className="font-bold">Precio mensual:</span> $ {departamento.precioMensual}</li>
                <li><span className="font-bold">Habitaciones:</span> {departamento.numeroHabitaciones}</li>
                <li><span className="font-bold">Baños:</span> {departamento.numeroBanos}</li>
                <li><span className="font-bold">Ciudad:</span> {departamento.ciudad}</li>
                <li>
                    <span className="font-bold">Estado:</span>
                    <span className="ml-2 bg-blue-100 text-green-500 text-xs font-medium px-2.5 py-0.5 rounded">
                        {departamento.disponible ? "Disponible" : "No disponible"}
                    </span>
                </li>
                {/* Agrega más campos si lo necesitas */}
            </ul>
        </div>
    );
};

export default Details;