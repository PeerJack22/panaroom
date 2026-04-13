import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useFetch from "../hooks/useFetch";


const Details = () => {
    const { id } = useParams();
    const { fetchDataBackend } = useFetch();
    const [departamento, setDepartamento] = useState(null);

    const getServicios = (dep) => {
        if (Array.isArray(dep?.serviciosIncluidos)) {
            return dep.serviciosIncluidos;
        }

        if (typeof dep?.serviciosIncluidos === "string") {
            return dep.serviciosIncluidos
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }

        const servicios = [];
        if (dep?.luz) servicios.push("Luz");
        if (dep?.agua) servicios.push("Agua");
        if (dep?.internet) servicios.push("Internet");
        return servicios;
    };

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
    }, [id, fetchDataBackend]);

    if (!departamento) {
        return (
        <div className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 text-center">
            <span className="font-medium">Cargando datos del departamento...</span>
        </div>
        );
    }

    const servicios = getServicios(departamento);

    return (
        <div className="max-w-6xl mx-auto mt-8 mb-10 px-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Detalles del departamento</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Información general</h2>
                        <ul className="space-y-3 text-gray-700">
                            <li><strong className="text-gray-900">Título:</strong> {departamento.titulo}</li>
                            <li><strong className="text-gray-900">Descripción:</strong> {departamento.descripcion}</li>
                            <li><strong className="text-gray-900">Dirección:</strong> {departamento.direccion}</li>
                            <li><strong className="text-gray-900">Ciudad:</strong> {departamento.ciudad}</li>
                            <li><strong className="text-gray-900">Precio mensual:</strong> $ {departamento.precioMensual}</li>
                            <li><strong className="text-gray-900">Habitaciones:</strong> {departamento.numeroHabitaciones}</li>
                            <li><strong className="text-gray-900">Baños:</strong> {departamento.numeroBanos}</li>
                        </ul>

                        <div className="mt-5">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Servicios incluidos</h3>
                            {servicios.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {servicios.map((servicio, index) => (
                                        <span
                                            key={`${servicio}-${index}`}
                                            className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium"
                                        >
                                            {servicio}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Este apartamento no tiene servicios registrados.</p>
                            )}
                        </div>
                    </section>

                    <section className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ubicación referencial</h2>
                        <div className="rounded-lg overflow-hidden border border-gray-300">
                            <iframe
                                title="Mapa referencial Quito - Escuela Politécnica Nacional"
                                src="https://www.openstreetmap.org/export/embed.html?bbox=-78.5058%2C-0.2148%2C-78.4878%2C-0.1968&layer=mapnik&marker=-0.2058%2C-78.4968"
                                className="w-full h-64"
                                loading="lazy"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Ubicación de referencia cercana a la Escuela Politécnica Nacional, Quito.
                        </p>
                    </section>
                </div>

                {departamento.imagenes?.length > 0 && (
                    <section className="mt-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Imágenes del departamento</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {departamento.imagenes.map((img, index) => (
                                <img
                                    key={index}
                                    src={img.url}
                                    alt={`Imagen ${index + 1}`}
                                    className="w-full h-44 object-cover rounded-lg border border-gray-200 shadow-sm"
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
    };

export default Details;
