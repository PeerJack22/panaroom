import { Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{7,15}$/;

export const PublicarResidencias = () => {
    const [documentosArrendatario, setDocumentosArrendatario] = useState([]);
    const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
    const [estadoSolicitud, setEstadoSolicitud] = useState({ tipo: "", mensaje: "" });
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
            <div className="w-full sm:w-1/2 h-1/3 sm:h-screen hidden sm:block">
                <img
                    src="/images/quito.webp"
                    alt="Quito"
                    className="w-full h-full object-cover object-center"
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                />
            </div>

            {/* Contenedor de formulario */}
            <div className="w-full sm:w-1/2 h-screen bg-white flex justify-center items-center px-6">
                <div className="md:w-4/5 sm:w-full">
                    <h1 className="text-3xl font-bold mb-2 text-center uppercase text-blue-800">
                        Publicar residencias
                    </h1>
                    <small className="text-gray-500 block my-4 text-sm text-center">Llena tu solicitud</small>

                    <form onSubmit={enviarSolicitudArrendatario}>
                        <div className="mb-4">
                            <input
                                type="text"
                                name="nombre"
                                value={datosSolicitud.nombre}
                                onChange={manejarCambioSolicitud}
                                placeholder="Nombre"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                name="apellido"
                                value={datosSolicitud.apellido}
                                onChange={manejarCambioSolicitud}
                                placeholder="Apellido"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                name="direccion"
                                value={datosSolicitud.direccion}
                                onChange={manejarCambioSolicitud}
                                placeholder="Dirección"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <input
                                type="tel"
                                name="celular"
                                value={datosSolicitud.celular}
                                onChange={manejarCambioSolicitud}
                                placeholder="Celular"
                                inputMode="numeric"
                                pattern="[0-9]{7,15}"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <input
                                type="email"
                                name="email"
                                value={datosSolicitud.email}
                                onChange={manejarCambioSolicitud}
                                placeholder="Correo"
                                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Documentos de identidad</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={manejarCambioDocumentos}
                                className="w-full rounded-lg border border-blue-200 bg-white text-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                            />
                            {documentosArrendatario.length > 0 && (
                                <p className="mt-1 text-xs text-green-600 font-semibold">✓ {documentosArrendatario.length} archivo(s) seleccionado(s)</p>
                            )}
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

                        <div className="mt-4 border-t border-gray-200 pt-4 text-sm flex justify-center items-center">
                            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Regresar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PublicarResidencias;