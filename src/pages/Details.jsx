import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useFetch from "../hooks/useFetch";
import DepartamentoPaymentBox from "../treatments/DepartamentoPaymentBox";


const Details = () => {
    const { id } = useParams();
    const { fetchDataBackend } = useFetch();
    const [departamento, setDepartamento] = useState(null);

    useEffect(() => {
        const fetchDepartamento = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("auth-token"));
            const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser.state.token}`,
            };
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/${id}`;
            const response = await fetchDataBackend(url, null, "GET", headers);
            if (!response) throw new Error("Departamento no encontrado");
            setDepartamento(response);
        } catch (error) {
            console.error("Error al cargar departamento:", error);
        }
        };
        fetchDepartamento();
    }, [id]);

    if (!departamento) {
        return (
        <div className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 text-center">
            <span className="font-medium">Cargando datos del departamento...</span>
        </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto mt-10 bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold text-gray-700 mb-6">🏠 Detalles del Departamento</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <ul className="space-y-3">
                <li><strong className="text-gray-600">Título:</strong> {departamento.titulo}</li>
                <li><strong className="text-gray-600">Descripción:</strong> {departamento.descripcion}</li>
                <li><strong className="text-gray-600">Dirección:</strong> {departamento.direccion}</li>
                <li><strong className="text-gray-600">Ciudad:</strong> {departamento.ciudad}</li>
                <li><strong className="text-gray-600">Precio mensual:</strong> $ {departamento.precioMensual}</li>
                <li><strong className="text-gray-600">Habitaciones:</strong> {departamento.numeroHabitaciones}</li>
                <li><strong className="text-gray-600">Baños:</strong> {departamento.numeroBanos}</li>
                <li>
                <strong className="text-gray-600">Estado:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${departamento.disponible ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {departamento.disponible ? "Disponible" : "No disponible"}
                </span>
                </li>
            </ul>
            </div>

            {departamento.imagenes?.length > 0 && (
            <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">📷 Imágenes del Departamento</h2>
                <div className="grid grid-cols-2 gap-4">
                {departamento.imagenes.map((img, index) => (
                    <img
                    key={index}
                    src={img.url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-40 object-cover rounded shadow"
                    />
                ))}
                </div>
            </div>
            )}
        </div>

        {/* Cuadro de pago si está disponible */}
        {departamento.disponible && (
            <DepartamentoPaymentBox departamento={departamento} />
        )}
        </div>
    );
    };

export default Details;
