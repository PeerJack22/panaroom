import { Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{7,15}$/;

export const PublicarResidencias = () => {
    const [documentosArrendatario, setDocumentosArrendatario] = useState([]);
    const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
    const [estadoSolicitud, setEstadoSolicitud] = useState({ tipo: "", mensaje: "" });
    const [modalAyudaAbierto, setModalAyudaAbierto] = useState(false);
    const [datosSolicitud, setDatosSolicitud] = useState({
        nombre: "",
        apellido: "",
        direccion: "",
        celular: "",
        email: "",
    });

    const manejarCambioSolicitud = (e) => {
        const { name, value } = e.target;

        if (name === "celular") {
            const soloDigitos = value.replace(/\D/g, "");
            setDatosSolicitud((prev) => ({ ...prev, [name]: soloDigitos }));
            return;
        }

        setDatosSolicitud((prev) => ({ ...prev, [name]: value }));
    };

    const manejarCambioDocumentos = (e) => {
        const nuevosArchivos = Array.from(e.target.files || []);
        if (!nuevosArchivos.length) return;

        setDocumentosArrendatario((prev) => [...prev, ...nuevosArchivos]);
        e.target.value = "";
    };

    const enviarSolicitudArrendatario = async (e) => {
        e.preventDefault();
        if (enviandoSolicitud) return;

        setEstadoSolicitud({ tipo: "", mensaje: "" });

        if (!PHONE_REGEX.test(datosSolicitud.celular)) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: "El teléfono debe contener solo números (7 a 15 dígitos).",
            });
            return;
        }

        if (!EMAIL_REGEX.test(datosSolicitud.email)) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: "Ingresa un correo electrónico válido.",
            });
            return;
        }

        if (!documentosArrendatario.length) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: "Selecciona al menos un documento de identidad antes de enviar.",
            });
            return;
        }

        setEnviandoSolicitud(true);

        try {
            const formData = new FormData();
            formData.append("nombre", datosSolicitud.nombre.trim());
            formData.append("apellido", datosSolicitud.apellido.trim());
            formData.append("direccion", datosSolicitud.direccion.trim());
            formData.append("celular", datosSolicitud.celular.trim());
            formData.append("email", datosSolicitud.email.trim().toLowerCase());

            documentosArrendatario.forEach((archivo) => {
                formData.append("imagenesDocumentos", archivo);
            });

            const url = `${import.meta.env.VITE_BACKEND_URL}/arrendatario/crear`;
            const response = await axios.post(url, formData);

            setEstadoSolicitud({
                tipo: "ok",
                mensaje: response?.data?.msg || "Solicitud enviada correctamente.",
            });
            setDatosSolicitud({
                nombre: "",
                apellido: "",
                direccion: "",
                celular: "",
                email: "",
            });
            setDocumentosArrendatario([]);
        } catch (error) {
            setEstadoSolicitud({
                tipo: "error",
                mensaje: error?.response?.data?.msg || "No se pudo enviar la solicitud. Inténtalo nuevamente.",
            });
        } finally {
            setEnviandoSolicitud(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row h-screen bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {/* Imagen lateral */}
            <div className="w-full sm:w-1/2 h-1/3 sm:h-screen hidden sm:block relative">
                <img
                    src="/images/quito.webp"
                    alt="Quito"
                    className="w-full h-full object-cover object-center"
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                />

                {/* Overlay difuminado con título y tarjeta informativa */}
                <div className="absolute inset-0 bg-black/25 backdrop-blur-sm flex flex-col justify-center items-center p-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight mb-4 max-w-lg">
                        Crea tu cuenta de arrendatario
                    </h2>

                    <div className="bg-white/95 rounded-2xl p-7 max-w-sm shadow-2xl mx-auto border border-white/20">
                        <div className="relative space-y-6">
                            {/* Línea vertical conectora */}
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-blue-600/30" />
                            
                            {[
                                "Registra tus datos personales en el formulario.",
                                "Sube fotos de tus documentos de identidad.",
                                "Espera la validación por parte del administrador.",
                                "Recibe tu usuario y clave en tu correo electrónico.",
                                "Accede a tu panel y empieza a publicar residencias."
                            ].map((paso, index) => (
                                <div key={index} className="relative flex items-start gap-4">
                                    {/* Punto indicador */}
                                    <div className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                                    <p className="text-sm text-gray-800 font-medium text-left leading-relaxed">
                                        {paso}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenedor de formulario */}
            <div className="w-full sm:w-1/2 h-screen bg-white flex justify-center items-center px-6">
                <div className="md:w-4/5 sm:w-full">
                    <h1 className="text-3xl font-bold mb-2 text-center uppercase text-blue-800">
                        Formulario de registro
                    </h1>
                    <small className="text-gray-500 block my-4 text-sm text-center">Llena con tus datos</small>

                    <form onSubmit={enviarSolicitudArrendatario} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={datosSolicitud.nombre}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Ingresa tu nombre"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido</label>
                                <input
                                    type="text"
                                    name="apellido"
                                    value={datosSolicitud.apellido}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Ingresa tu apellido"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={datosSolicitud.direccion}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Ingresa tu dirección de domicilio"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Celular</label>
                                <input
                                    type="tel"
                                    name="celular"
                                    value={datosSolicitud.celular}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Ingresa tu celular"
                                    inputMode="numeric"
                                    pattern="[0-9]{7,15}"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={datosSolicitud.email}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Ingresa tu correo electrónico"
                                    pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Documentos de identidad</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={manejarCambioDocumentos}
                                className="w-full rounded-lg border border-blue-200 bg-white text-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                            />
                            <div className="flex justify-between items-center mt-1">
                                {documentosArrendatario.length > 0 ? (
                                    <p className="text-xs text-green-600 font-semibold">✓ {documentosArrendatario.length} archivo(s) seleccionado(s)</p>
                                ) : <div />}
                                <button
                                    type="button"
                                    onClick={() => setModalAyudaAbierto(true)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                                >
                                    ¿Qué debo subir?
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <button
                                type="submit"
                                disabled={enviandoSolicitud}
                                className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                            >
                                {enviandoSolicitud ? 'Enviando...' : 'Enviar solicitud'}
                            </button>
                        </div>

                        {estadoSolicitud.mensaje && (
                            <div className={`p-3 rounded-lg text-sm font-semibold ${
                                estadoSolicitud.tipo === "ok"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                                {estadoSolicitud.mensaje}
                            </div>
                        )}

                        <div className="mt-4 border-t border-gray-200 pt-4 text-sm flex justify-start items-center">
                            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Regresar</Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal de ayuda */}
            {modalAyudaAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">Documentos sugeridos</h3>
                        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
                            <p className="font-semibold text-slate-800">
                                Las imagenes deben ayudar a validar que su perfil es real y sus residencias.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span> Copia de cedula del propietario o responsable.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span> Planilla de luz, agua o internet del inmueble.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span> Contrato, predio o documento que relacione la direccion.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span> Fotos o respaldo adicional si aplica.
                                </li>
                            </ul>
                        </div>
                        <div className="mt-8">
                            <button
                                type="button"
                                onClick={() => setModalAyudaAbierto(false)}
                                className="w-full rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicarResidencias;