import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import storeAuth from "../context/storeAuth";

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { rol, token, userId } = storeAuth();
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    const [mensajes, setMensajes] = useState([]);
    const [contactoActivo, setContactoActivo] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [propietarioInfo, setPropietarioInfo] = useState(null);
    const [modalContacto, setModalContacto] = useState(false);

    const roleNormalized = String(rol || "").toLowerCase();
    const isEstudiante = roleNormalized === "estudiante";
    const isArrendatario = roleNormalized === "arrendatario";

    // Si viene desde Details.jsx, cargar el propietario automáticamente
    useEffect(() => {
        if (location?.state?.propietarioId && isEstudiante) {
            setContactoActivo({
                id: location.state.propietarioId,
                nombre: "Propietario",
                tipo: "arrendatario",
                departamento: location.state.departamentoNombre,
            });
            setPropietarioInfo(location.state);
        }
    }, [location, isEstudiante]);

    const enviarMensaje = async (data) => {
        if (!contactoActivo) {
            toast.error("Selecciona un contacto primero");
            return;
        }

        if (!data.mensaje || !data.mensaje.trim()) {
            toast.error("El mensaje no puede estar vacío");
            return;
        }

        setEnviando(true);

        try {
            const payload = {
                mensaje: data.mensaje,
                remitente: rol,
                arrendatarioId: isArrendatario ? userId : (isEstudiante ? contactoActivo.id : null),
                estudianteId: isEstudiante ? userId : (isArrendatario ? contactoActivo.id : null),
            };

            console.log("[Chat] Enviando mensaje:", payload);

            const url = `${import.meta.env.VITE_BACKEND_URL}/chat/mensaje`;
            const response = await axios.post(url, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("[Chat] Respuesta del servidor:", response?.data);

            // Agregar el mensaje localmente
            setMensajes((prev) => [...prev, { ...payload, createdAt: new Date() }]);
            reset({ mensaje: "" });
            toast.success("Mensaje enviado");
        } catch (error) {
            console.error("[Chat] Error al enviar:", error);
            const errorMessage = error?.response?.data?.msg || error?.response?.data?.message || "Error al enviar el mensaje";
            toast.error(errorMessage);
        } finally {
            setEnviando(false);
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "";
        try {
            return new Date(fecha).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return "";
        }
    };

    return (
        <div className="max-w-6xl mx-auto mt-8 mb-10 px-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="mb-4 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    ← Atrás
                </button>

                <h1 className="text-4xl font-bold text-gray-500 mb-6">Chat</h1>
                <hr className="my-4 border-t-2 border-gray-300" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Lista de contactos */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Contactos</h2>

                        {!contactoActivo ? (
                            <div className="flex-1 flex items-center justify-center text-center">
                                <div>
                                    <p className="text-gray-500 mb-3">Selecciona un contacto para iniciar el chat</p>
                                    {isEstudiante && (
                                        <button
                                            onClick={() => setModalContacto(true)}
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            Iniciar chat
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 flex-1 overflow-y-auto">
                                <div className="p-3 rounded-lg bg-white border-2 border-blue-600 cursor-pointer hover:bg-blue-50 transition-colors">
                                    <p className="font-semibold text-gray-800">{contactoActivo.nombre}</p>
                                    {contactoActivo.departamento && (
                                        <p className="text-xs text-gray-500 mt-1">{contactoActivo.departamento}</p>
                                    )}
                                    <p className="text-xs text-blue-600 mt-2">Activo</p>
                                </div>
                                <button
                                    onClick={() => setContactoActivo(null)}
                                    className="w-full mt-4 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    Cambiar contacto
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Área de chat */}
                    {contactoActivo ? (
                        <div className="lg:col-span-2 border border-gray-200 rounded-lg flex flex-col bg-white">
                            {/* Header del chat */}
                            <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
                                <h3 className="text-lg font-semibold text-gray-800">{contactoActivo.nombre}</h3>
                                {contactoActivo.departamento && (
                                    <p className="text-sm text-gray-600">{contactoActivo.departamento}</p>
                                )}
                            </div>

                            {/* Mensajes */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {mensajes.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <p>No hay mensajes aún. ¡Inicia la conversación!</p>
                                    </div>
                                ) : (
                                    mensajes.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${msg.remitente === rol ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                                    msg.remitente === rol
                                                        ? "bg-blue-600 text-white rounded-br-none"
                                                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                                                }`}
                                            >
                                                <p className="text-sm">{msg.mensaje}</p>
                                                <p className={`text-xs mt-1 ${msg.remitente === rol ? "text-blue-200" : "text-gray-600"}`}>
                                                    {formatearFecha(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input */}
                            <div className="border-t border-gray-200 p-4">
                                <form onSubmit={handleSubmit(enviarMensaje)} className="flex gap-2">
                                    <textarea
                                        placeholder="Escribe tu mensaje..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows="2"
                                        {...register("mensaje", { required: "El mensaje es obligatorio" })}
                                    />
                                    <button
                                        type="submit"
                                        disabled={enviando}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                                    >
                                        {enviando ? "Enviando..." : "Enviar"}
                                    </button>
                                </form>
                                {errors.mensaje && (
                                    <p className="text-sm text-red-600 mt-2">{errors.mensaje.message}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="lg:col-span-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                            <p className="text-gray-500 text-center">Selecciona un contacto para comenzar a chatear</p>
                        </div>
                    )}
                </div>

                {/* Modal para seleccionar contacto */}
                {modalContacto && isEstudiante && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Iniciar chat</h3>
                            <p className="text-gray-600 mb-4">¿Con quién deseas chatear?</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setContactoActivo({
                                            id: propietarioInfo?.propietarioId || "propietario-default",
                                            nombre: "Propietario",
                                            tipo: "arrendatario",
                                            departamento: propietarioInfo?.departamentoNombre,
                                        });
                                        setModalContacto(false);
                                    }}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 font-semibold hover:bg-gray-100 transition-colors text-left"
                                >
                                    Propietario
                                    {propietarioInfo?.departamentoNombre && (
                                        <p className="text-xs text-gray-600 mt-1">{propietarioInfo.departamentoNombre}</p>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setContactoActivo({
                                            id: "admin-default",
                                            nombre: "Administrador",
                                            tipo: "administrador",
                                        });
                                        setModalContacto(false);
                                    }}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 font-semibold hover:bg-gray-100 transition-colors text-left"
                                >
                                    Administrador
                                    <p className="text-xs text-gray-600 mt-1">Soporte técnico</p>
                                </button>
                            </div>

                            <button
                                onClick={() => setModalContacto(false)}
                                className="w-full mt-4 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
