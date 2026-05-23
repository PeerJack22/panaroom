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
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

            <main className="px-6 py-16">
                <div className="max-w-7xl mx-auto mb-6">
                    <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Regresar</Link>
                </div>
                <section className="max-w-7xl mx-auto rounded-3xl border border-blue-100 bg-white shadow-sm p-6 md:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="order-1 md:order-1">
                            <img src="/images/quito.webp" alt="Quito" className="w-full h-80 md:h-[420px] object-cover rounded-2xl shadow-md" />
                        </div>

                        <div className="order-2 md:order-2 max-w-md mx-auto">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                                ¿Quieres publicar tus residencias?
                            </h1>
                            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                Llena tu solicitud y únete a nuestra comunidad de propietarios confiables.
                            </p>

                            <form onSubmit={enviarSolicitudArrendatario} className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    name="nombre"
                                    value={datosSolicitud.nombre}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Nombre"
                                    className="w-full rounded-lg border border-blue-200 bg-blue-50 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                                    required
                                />
                                <input
                                    type="text"
                                    name="apellido"
                                    value={datosSolicitud.apellido}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Apellido"
                                    className="w-full rounded-lg border border-blue-200 bg-blue-50 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                                    required
                                />
                                <input
                                    type="text"
                                    name="direccion"
                                    value={datosSolicitud.direccion}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Dirección"
                                    className="w-full rounded-lg border border-blue-200 bg-blue-50 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                                    required
                                />
                                <input
                                    type="tel"
                                    name="celular"
                                    value={datosSolicitud.celular}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Celular"
                                    inputMode="numeric"
                                    pattern="[0-9]{7,15}"
                                    className="w-full rounded-lg border border-blue-200 bg-blue-50 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                                    required
                                />
                                <input
                                    type="email"
                                    name="email"
                                    value={datosSolicitud.email}
                                    onChange={manejarCambioSolicitud}
                                    placeholder="Correo"
                                    pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                                    className="w-full rounded-lg border border-blue-200 bg-blue-50 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                                    required
                                />

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Documentos de identidad
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={manejarCambioDocumentos}
                                        className="w-full rounded-lg border border-blue-200 bg-blue-50 text-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                    />
                                    {documentosArrendatario.length > 0 && (
                                        <p className="mt-1 text-xs text-green-600 font-semibold">
                                            ✓ {documentosArrendatario.length} archivo(s) seleccionado(s)
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={enviandoSolicitud}
                                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold px-6 py-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                    >
                                        {enviandoSolicitud ? "Enviando..." : "Enviar solicitud"}
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
                            </form>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default PublicarResidencias;