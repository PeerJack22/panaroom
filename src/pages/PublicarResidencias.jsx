import { Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;

const compressImage = (file, { quality = 0.8, maxWidth = 1280, maxHeight = 1280 } = {}) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error("Error al comprimir"));
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                    const compressedFile = new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
                    resolve(compressedFile);
                }, "image/jpeg", quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export const PublicarResidencias = () => {
    const [documentosArrendatario, setDocumentosArrendatario] = useState([]);
    const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
    const [estadoSolicitud, setEstadoSolicitud] = useState({ tipo: "", mensaje: "" });
    const [erroresCampos, setErroresCampos] = useState({});
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

        setErroresCampos((prev) => {
            if (!prev[name]) return prev;
            const siguientes = { ...prev };
            delete siguientes[name];
            return siguientes;
        });

        if (name === "celular") {
            const soloDigitos = value.replace(/\D/g, "");
            setDatosSolicitud((prev) => ({ ...prev, [name]: soloDigitos }));
            return;
        }

        setDatosSolicitud((prev) => ({ ...prev, [name]: value }));
    };

    const validarCamposSolicitud = () => {
        const nuevosErrores = {};

        if (!datosSolicitud.nombre.trim()) {
            nuevosErrores.nombre = "El nombre es obligatorio";
        } else if (datosSolicitud.nombre.length > 10) {
            nuevosErrores.nombre = "Máximo 10 caracteres";
        } else if (!NAME_REGEX.test(datosSolicitud.nombre)) {
            nuevosErrores.nombre = "Solo letras permitidas";
        }

        if (!datosSolicitud.apellido.trim()) {
            nuevosErrores.apellido = "El apellido es obligatorio";
        } else if (datosSolicitud.apellido.length > 10) {
            nuevosErrores.apellido = "Máximo 10 caracteres";
        } else if (!NAME_REGEX.test(datosSolicitud.apellido)) {
            nuevosErrores.apellido = "Solo letras permitidas";
        }

        if (!datosSolicitud.direccion.trim()) {
            nuevosErrores.direccion = "La dirección es obligatoria";
        } else if (datosSolicitud.direccion.length > 20) {
            nuevosErrores.direccion = "Máximo 20 caracteres";
        }

        if (!datosSolicitud.celular.trim()) {
            nuevosErrores.celular = "El celular es obligatorio";
        } else if (!PHONE_REGEX.test(datosSolicitud.celular)) {
            nuevosErrores.celular = "Debe tener 10 dígitos";
        }

        if (!datosSolicitud.email.trim()) {
            nuevosErrores.email = "El correo electrónico es obligatorio";
        } else if (!EMAIL_REGEX.test(datosSolicitud.email)) {
            nuevosErrores.email = "Ingresa un correo electrónico válido";
        }

        if (!documentosArrendatario.length) {
            nuevosErrores.documentos = "Debes subir al menos un documento";
        }

        return nuevosErrores;
    };

    const manejarCambioDocumentos = async (e) => {
        const nuevosArchivos = Array.from(e.target.files || []);
        if (!nuevosArchivos.length) return;

        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        const archivosValidos = nuevosArchivos.filter((archivo) => archivo.size <= MAX_FILE_SIZE);

        if (archivosValidos.length !== nuevosArchivos.length) {
            toast.error("Cada archivo debe pesar máximo 5 MB.");
        }

        if (!archivosValidos.length) {
            e.target.value = "";
            return;
        }

        if (documentosArrendatario.length + archivosValidos.length > 5) {
            toast.warn("Solo se permiten hasta 5 documentos en total.");
            e.target.value = "";
            return;
        }

        const idCarga = toast.loading("Subiendo documentos...");
        try {
            const comprimidos = await Promise.all(
                archivosValidos.map(f => compressImage(f, { quality: 0.8 }))
            );
            setDocumentosArrendatario((prev) => [...prev, ...comprimidos]);
            toast.update(idCarga, { render: "Documentos listos", type: "success", isLoading: false, autoClose: 2000 });
        } catch (err) {
            console.error("Error al comprimir:", err);
            toast.update(idCarga, { render: "Error al subir documentos", type: "error", isLoading: false, autoClose: 3000 });
        }
        e.target.value = "";
    };

    const enviarSolicitudArrendatario = async (e) => {
        e.preventDefault();
        if (enviandoSolicitud) return;

        // Nota: se omite asignar mensaje de éxito aquí porque `response` aún no está definido
        const nuevosErrores = validarCamposSolicitud();
        if (Object.keys(nuevosErrores).length > 0) {
            setErroresCampos(nuevosErrores);
            setEstadoSolicitud({
                tipo: "error",
                mensaje: "Corrige los campos marcados antes de continuar.",
            });
            return;
        }

        setErroresCampos({});
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
                mensaje: response?.data?.msg || "Se validará tus datos y una vez validados se te enviará las credenciasles para el acceso",
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
        <div className="flex flex-col sm:flex-row min-h-screen bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
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
            <div className="w-full sm:w-1/2 min-h-screen bg-white flex justify-center items-center px-6 py-10">
                <div className="md:w-4/5 sm:w-full">
                    <h1 className="text-3xl font-bold mb-2 text-center uppercase text-blue-800">
                        Formulario de registro
                    </h1>
                    <small className="text-gray-500 block my-4 text-sm text-center">Llena con tus datos</small>

                    <form onSubmit={enviarSolicitudArrendatario} className="space-y-3" noValidate>
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
                                    maxLength={10}
                                    pattern="[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+"
                                />
                                {erroresCampos.nombre && <p className="text-sm text-red-600 mt-1">{erroresCampos.nombre}</p>}
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
                                    maxLength={10}
                                    pattern="[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+"
                                />
                                {erroresCampos.apellido && <p className="text-sm text-red-600 mt-1">{erroresCampos.apellido}</p>}
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
                                    maxLength={20}
                                />
                                {erroresCampos.direccion && <p className="text-sm text-red-600 mt-1">{erroresCampos.direccion}</p>}
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
                                    pattern="[0-9]{10}"
                                    maxLength={10}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-blue-500 transition-colors shadow-sm"
                                />
                                {erroresCampos.celular && <p className="text-sm text-red-600 mt-1">{erroresCampos.celular}</p>}
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
                                />
                                {erroresCampos.email && <p className="text-sm text-red-600 mt-1">{erroresCampos.email}</p>}
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
                            {erroresCampos.documentos && <p className="text-sm text-red-600 mt-1">{erroresCampos.documentos}</p>}
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
                                Las imagenes permiten validar que la información sea real.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span> Copia de cédula del propietario o responsable.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span> Planilla de luz, agua o internet del inmueble.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span> Contrato, predio o documento que relacione la dirección.
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