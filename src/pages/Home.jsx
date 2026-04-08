import logo_proyecto from '../assets/logo_proyecto.png';
import { Link } from 'react-router-dom';
import { FaSquareInstagram, FaYoutube, FaGithub } from "react-icons/fa6";

export const Home = () => {
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

            <main className='bg-gray-100 py-10 px-6 flex justify-center'>
                {/* Texto e input */}
                <div className='w-full max-w-3xl'>
                    
                    {/* Contenedor del input y botón */}
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <input
                            type="text"
                            placeholder="Ingresa el sector"
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

                        <select
                            defaultValue=""
                            className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        >
                            <option value="" disabled>Servicios incluidos</option>
                            <option value="luz">Luz</option>
                            <option value="agua">Agua</option>
                            <option value="internet">Internet</option>
                            <option value="todos">Luz, agua e internet</option>
                        </select>
                    </div>
                </div>
            </main>

            {/* Sección Últimas propiedades */}
            <section className="px-6 py-12 bg-white">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Últimas propiedades de arriendo</h2>
                <div className="max-w-6xl mx-auto space-y-6">
                    {[1, 2, 3].map((_, index) => (
                        <div key={index} className="bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                            <div className="flex flex-col md:flex-row">
                            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                                alt={`Apartamento ${index + 1}`} className="w-full md:w-2/5 h-64 md:h-72 object-cover border-b-4 md:border-b-0 md:border-r-4 border-blue-500"
                            />
                            <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[260px]">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                    <h3 className="text-2xl font-bold text-gray-800">Apt {index + 1}</h3>
                                    <span className="text-lg font-semibold text-blue-800">$ 210 / mes</span>
                                </div>
                                <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4">
                                    Apartamento amplio y bien iluminado, ubicado en una zona tranquila con acceso cercano a universidades, transporte publico y supermercados. Cuenta con espacios comodos para estudiar y descansar, ideal para estudiantes o jovenes profesionales.
                                </p>
                                <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6">
                                    Incluye cocina equipada, area de lavanderia, internet de alta velocidad y excelente ventilacion natural. La administracion y servicios son economicos, lo que la convierte en una opcion practica y segura para vivir.
                                </p>
                                <div className="mt-auto flex justify-end">
                                    <button className="inline-block bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm md:text-base transition-colors cursor-pointer">
                                        Detalles
                                    </button>
                                </div>
                            </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button className="inline-block bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm transition-colors cursor-pointer">
                        Anterior
                    </button>
                    <button className="inline-block bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm transition-colors cursor-pointer">
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
