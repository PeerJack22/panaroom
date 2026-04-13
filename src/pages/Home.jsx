import logo_proyecto from '../assets/logo_proyecto.png';
import { Link } from 'react-router-dom';
import { FaSquareInstagram, FaYoutube, FaGithub } from "react-icons/fa6";
import { useState } from 'react';

export const Home = () => {
    const [servicios, setServicios] = useState([]);
    const [abierto, setAbierto] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const propiedadesPorPagina = 6;
    const opcionesServicios = ['Luz', 'Agua', 'Internet'];

    const propiedades = [
        { id: 1, titulo: 'Apt 1', precio: 210, direccion: 'Centro', descripcion: 'Apartamento amplio y bien iluminado, ubicado en una zona tranquila con acceso cercano a universidades y supermercados.' },
        { id: 2, titulo: 'Apt 2', precio: 240, direccion: 'Norte', descripcion: 'Espacio comodo con buena ventilacion natural, ideal para estudiantes que buscan una zona segura y conectada.' },
        { id: 3, titulo: 'Apt 3', precio: 195, direccion: 'Sur', descripcion: 'Residencia funcional con servicios basicos incluidos y cercania a transporte publico y comercio local.' },
        { id: 4, titulo: 'Apt 4', precio: 260, direccion: 'Occidente', descripcion: 'Departamento moderno con acabados recientes, ambiente tranquilo y acceso rapido a zonas universitarias.' },
        { id: 5, titulo: 'Apt 5', precio: 225, direccion: 'Centro', descripcion: 'Unidad acogedora con buena iluminacion y distribucion practica para estudio y descanso diario.' },
        { id: 6, titulo: 'Apt 6', precio: 280, direccion: 'Oriente', descripcion: 'Opcion amplia para compartir, con cocina equipada y excelente ubicacion cerca de vias principales.' },
        { id: 7, titulo: 'Apt 7', precio: 205, direccion: 'Norte', descripcion: 'Apartamento economico con servicios estables y entorno residencial silencioso para concentrarse.' },
        { id: 8, titulo: 'Apt 8', precio: 300, direccion: 'Centro', descripcion: 'Espacio premium con mayor metraje, buena seguridad y facil acceso a centros de estudio y trabajo.' },
        { id: 9, titulo: 'Apt 9', precio: 235, direccion: 'Sur', descripcion: 'Departamento balanceado en precio y comodidad, ideal para quienes buscan ubicacion y funcionalidad.' },
        { id: 10, titulo: 'Apt 10', precio: 250, direccion: 'Occidente', descripcion: 'Propiedad bien distribuida con acabados cuidados, ambiente comodo y cercania a zonas de interes.' },
        { id: 11, titulo: 'Apt 11', precio: 220, direccion: 'Centro', descripcion: 'Alternativa accesible con buena conectividad y espacios adecuados para estudio o trabajo remoto.' },
        { id: 12, titulo: 'Apt 12', precio: 275, direccion: 'Oriente', descripcion: 'Departamento en sector estrategico con excelente movilidad y condiciones practicas para vivir.' },
    ];

    const totalPaginas = Math.ceil(propiedades.length / propiedadesPorPagina);
    const indiceInicio = (paginaActual - 1) * propiedadesPorPagina;
    const propiedadesPaginadas = propiedades.slice(indiceInicio, indiceInicio + propiedadesPorPagina);

    const agregarServicio = (servicio) => {
        if (!servicios.includes(servicio)) {
            setServicios([...servicios, servicio]);
        }
        setAbierto(false);
    };

    const removerServicio = (servicio) => {
        setServicios(servicios.filter(s => s !== servicio));
    };

    const toggleServicio = (servicio) => {
        if (servicios.includes(servicio)) {
            removerServicio(servicio);
            return;
        }
        agregarServicio(servicio);
    };

    return (
        <>
            <header className="w-full py-6 px-6 bg-slate-800 text-white flex flex-col md:flex-row justify-between items-center">
                {/* Logo + Título */}
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                    <img className="w-20 h-20" src={logo_proyecto} alt="Logo PanaRoom" />
                    <h1 className="font-bold text-3xl text-cyan-400">
                        Pana<span className="text-white">Room</span>
                    </h1>
                </div>

                {/* Navegación + Botón */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <ul className="flex gap-6 justify-center flex-wrap">
                        <li><a href="#" className="hover:text-cyan-400 transition-colors">Inicio</a></li>
                        <li><a href="#acerca" className="hover:text-cyan-400 transition-colors">Acerca de</a></li>
                        <li><a href="#servicios" className="hover:text-cyan-400 transition-colors">Servicios</a></li>
                        <li><a href="#contacto" className="hover:text-cyan-400 transition-colors">Contacto</a></li>
                    </ul>
                    <Link to="/login" className="inline-block bg-blue-700 hover:bg-blue-600 text-white py-2 px-6 rounded-full transition-colors">
                        Ingresar
                    </Link>
                </div>
            </header>

            <main className='bg-gray-100 py-10 px-6 w-full'>
                {/* Texto e input */}
                <div className='w-full'>
                    
                    {/* Contenedor del input y botón */}
                    <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                        <input
                            type="number"
                            min="0"
                            placeholder="Cantidad minima"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <input
                            type="number"
                            min="0"
                            placeholder="Cantidad maxima"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <input
                            type="number"
                            min="0"
                            placeholder="Numero de habitaciones"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <input
                            type="number"
                            min="0"
                            placeholder="Numero de baños"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        <div className="relative">
                            <div className="w-full rounded-md border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 px-2 py-1 min-h-[42px] flex items-center gap-2">
                                <div
                                    className="flex-1 flex flex-wrap gap-2 cursor-pointer"
                                    onClick={() => setAbierto(!abierto)}
                                >
                                    {servicios.length === 0 && (
                                        <span className="text-gray-500 px-2 py-1">Servicios incluidos</span>
                                    )}

                                    {servicios.map((servicio) => (
                                        <span
                                            key={servicio}
                                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium"
                                        >
                                            {servicio}
                                            <button
                                                type="button"
                                                className="text-blue-800 hover:text-blue-900"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removerServicio(servicio);
                                                }}
                                                aria-label={`Quitar ${servicio}`}
                                            >
                                                x
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setAbierto(!abierto)}
                                    className="px-2 text-gray-500 hover:text-gray-700"
                                    aria-label="Abrir opciones de servicios"
                                >
                                    {abierto ? '▴' : '▾'}
                                </button>
                            </div>

                            {abierto && (
                                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                                    {opcionesServicios.map((servicio) => (
                                        <button
                                            key={servicio}
                                            type="button"
                                            onClick={() => toggleServicio(servicio)}
                                            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                                        >
                                            <span>{servicio}</span>
                                            {servicios.includes(servicio) && <span className="text-blue-700 font-semibold">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            {/* Sección de propiedades */}
            <section className="px-6 py-12 bg-white">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Propiedades en arriendo</h2>
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {propiedadesPaginadas.map((propiedad) => (
                        <div key={propiedad.id} className="bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                            <div className="flex flex-col h-full">
                                <img
                                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                                    alt={`Apartamento ${propiedad.id}`}
                                    className="w-full h-40 object-cover border-b-4 border-blue-500"
                                />
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-lg font-bold text-gray-800 leading-tight">{propiedad.titulo}</h3>
                                        <span className="text-sm font-semibold text-blue-800">$ {propiedad.precio} / mes</span>
                                    </div>

                                    <p className="text-sm text-gray-600 leading-relaxed h-16 overflow-hidden">
                                        {propiedad.descripcion}
                                    </p>

                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Dirección:</span> {propiedad.direccion}
                                    </p>

                                    <div className="mt-auto flex justify-end">
                                        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                                            Detalles
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaActual === 1}
                        className="inline-block bg-blue-700 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full text-sm transition-colors cursor-pointer"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                        disabled={paginaActual === totalPaginas}
                        className="inline-block bg-blue-700 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full text-sm transition-colors cursor-pointer"
                    >
                        Siguiente
                    </button>
                </div>
            </section>

                        {/* Sección Acerca de */}
            <section id="acerca" className="px-6 py-12 bg-white">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Acerca de</h2>
                <p className="text-gray-700 text-md leading-relaxed">
                    PanaRoom es un sistema web diseñado para facilitar la gestión de residencias estudiantiles, permitiendo a propietarios publicar sus habitaciones y a los estudiantes encontrar su mejor opción de alojamiento de manera rápida y segura. Nuestro objetivo es conectar personas y crear experiencias de vivienda confiables, modernas y accesibles para toda la comunidad.
                </p>
            </section>

            <section id="servicios" className='container mx-auto px-6 py-10'>
                <h2 className='text-center text-3xl font-bold text-blue-800 mb-10'>SERVICIOS</h2>
                <div className='grid gap-6 sm:grid-cols-2 md:grid-cols-4'>
                    {[
                        {
                            titulo: "Gestión de publicaciones de Habitaciones",
                            contenido: "Publica y administra habitaciones de forma sencilla y eficiente."
                        },
                        {
                            titulo: "Perfiles de Usuarios",
                            contenido: "Crea y personaliza tu perfil para conectar con propietarios."
                        },
                        {
                            titulo: "Información detallada de los lugares",
                            contenido: "Accede a descripciones completas y fotos de las propiedades."
                        },
                        {
                            titulo: "Sistema de Quejas y Sugerencias",
                            contenido: "Envía tus comentarios para mejorar la experiencia del usuario."
                        }
                    ].map((servicio, i) => (
                        <div
                            key={i}
                            style={{ backgroundColor: '#D9D9D9' }}
                            className="shadow-md hover:shadow-xl p-6 rounded-md text-center transition-shadow duration-300"
                        >
                            <h4 className="text-lg font-semibold text-blue-700 mb-4">{servicio.titulo}</h4>
                            <p className="text-gray-700 text-sm">
                                {servicio.contenido}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <footer id="contacto" className='bg-slate-800 text-white py-10 px-6 rounded-tr-3xl rounded-tl-3xl'>
                <div className='flex flex-col sm:flex-row justify-between items-center mb-8'>
                    <p className='text-center text-white-400'>© 2025 PanaRoom - Todos los derechos reservados</p>
                    <div className='flex gap-4 mt-4 sm:mt-0'>
                        <p className='text-center text-white-400'>Correo: contacto@panaroom.com</p>
                        <FaSquareInstagram className='text-2xl hover:text-cyan-400' />
                        <FaYoutube className='text-2xl hover:text-cyan-400' />
                        <FaGithub className='text-2xl hover:text-cyan-400' />
                    </div>
                </div>
            </footer>
        </>
    );
};
