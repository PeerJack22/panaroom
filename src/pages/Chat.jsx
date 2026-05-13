import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import storeAuth from "../context/storeAuth";

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { rol, token, user } = storeAuth();
    const userId = user?._id || user?.id || null;
    const miNombre = `${user?.nombre || ""} ${user?.apellido || ""}`.trim();
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    const [mensajes, setMensajes] = useState([]);
    const [contactoActivo, setContactoActivo] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [asignando, setAsignando] = useState(false);
    const [propietarioInfo, setPropietarioInfo] = useState(null);
    const [modalContacto, setModalContacto] = useState(false);

    const roleNormalized = String(rol || "").toLowerCase();
    const isEstudiante = roleNormalized === "estudiante";
    const isArrendatario = roleNormalized === "arrendatario";
    const isAdministrador = roleNormalized === "administrador";

    const [contactos, setContactos] = useState([]);
    const [cargandoContactos, setCargandoContactos] = useState(false);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const mensajesRef = useRef(null);

    const normalizarMensaje = useCallback((m) => ({
        id: m?._id || m?.id || `${m?.mensaje}-${m?.createdAt}`,
        mensaje: m?.mensaje,
        remitente: String(m?.remitente || "").toLowerCase(),
        administradorId: m?.administradorId || null,
        arrendatarioId: m?.arrendatarioId || null,
        estudianteId: m?.estudianteId || null,
        createdAt: m?.createdAt ? new Date(m.createdAt) : new Date(),
    }), []);

    const esMiConversacion = useCallback((m) => {
        if (!m) return false;
        const adminId = m.administradorId || m.administrador || null;
        const arrId = m.arrendatarioId || m.arrendatario || null;
        const estId = m.estudianteId || m.estudiante || null;

        if (isEstudiante) {
            if (contactoActivo?.tipo === "administrador") {
                return String(userId || "") === String(estId || "") && String(contactoActivo?.id || "") === String(adminId || "");
            }
            return String(contactoActivo?.id || "") === String(arrId || "") && String(userId || "") === String(estId || "");
        }

        if (isArrendatario) {
            if (contactoActivo?.tipo === "administrador") {
                return String(userId || "") === String(arrId || "") && String(contactoActivo?.id || "") === String(adminId || "");
            }
            return String(userId || "") === String(arrId || "") && (!contactoActivo || String(contactoActivo?.id || "") === String(estId || contactoActivo?.id || ""));
        }

        if (isAdministrador) {
            if (contactoActivo?.tipo === "arrendatario") {
                return String(userId || "") === String(adminId || "") && String(contactoActivo?.id || "") === String(arrId || "");
            }
            if (contactoActivo?.tipo === "estudiante") {
                return String(userId || "") === String(adminId || "") && String(contactoActivo?.id || "") === String(estId || "");
            }
        }

        return false;
    }, [contactoActivo, isAdministrador, isArrendatario, isEstudiante, userId]);

    const obtenerParamsContacto = useCallback((contacto) => {
        const params = {};
        if (isArrendatario) {
            params.arrendatarioId = userId;
            if (contacto?.tipo === "administrador") params.administradorId = contacto.id;
            if (contacto?.tipo === "estudiante") params.estudianteId = contacto.id;
        } else if (isEstudiante) {
            params.estudianteId = userId;
            if (contacto?.tipo === "administrador") params.administradorId = contacto.id;
            if (contacto?.tipo === "arrendatario") params.arrendatarioId = contacto.id;
        } else if (isAdministrador) {
            params.administradorId = userId;
            if (contacto?.tipo === "arrendatario") params.arrendatarioId = contacto.id;
            if (contacto?.tipo === "estudiante") params.estudianteId = contacto.id;
        }
        return params;
    }, [isAdministrador, isArrendatario, isEstudiante, userId]);

    // Si viene desde Details.jsx, cargar el propietario automáticamente
    useEffect(() => {
        if (location?.state?.propietarioId && isEstudiante) {
            setContactoActivo({
                id: location.state.propietarioId,
                nombre: location.state.propietarioNombre || "Propietario",
                tipo: "arrendatario",
                departamento: location.state.departamentoNombre,
            });
            setPropietarioInfo(location.state);
        } else if (location?.state?.estudianteId && isArrendatario) {
            setContactoActivo({
                id: location.state.estudianteId,
                nombre: location.state.estudianteNombre || "Estudiante",
                tipo: "estudiante",
            });
        } else if (location?.state?.administradorId) {
            // Cuando viene desde Details.jsx por departamento desactivado
            setContactoActivo({
                id: location.state.administradorId,
                nombre: "Administrador",
                tipo: "administrador",
            });
            // Si viene departamentoNombre, lo guardamos para referencia
            if (location.state.departamentoNombre) {
                setPropietarioInfo({ departamentoNombre: location.state.departamentoNombre });
            }
        }
    }, [location, isArrendatario, isEstudiante]);

    // Cargar contactos desde backend
    useEffect(() => {
        const cargarContactos = async () => {
            if (!token || !userId) return;
            setCargandoContactos(true);
            try {
                const params = {};
                if (isArrendatario) params.arrendatarioId = userId;
                if (isEstudiante) params.estudianteId = userId;
                if (isAdministrador) params.administradorId = userId;

                const url = `${import.meta.env.VITE_BACKEND_URL}/listar-contactos`;
                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                });

                const raw = Array.isArray(response?.data)
                    ? response.data
                    : (Array.isArray(response?.data?.contactos) ? response.data.contactos : []);

                const mapped = raw
                    .map((item) => {
                        const id = item?._id || item?.id || item?.contactoId || item?.arrendatarioId || item?.estudianteId || item?.administradorId;
                        if (!id) return null;

                        let tipo = (item?.tipo || item?.rol || "").toLowerCase();
                        if (!tipo) {
                            if (item?.administradorId && String(item.administradorId) === String(id)) tipo = "administrador";
                            else if (item?.estudianteId && String(item.estudianteId) === String(id)) tipo = "estudiante";
                            else if (item?.arrendatarioId && String(item.arrendatarioId) === String(id)) tipo = "arrendatario";
                        }

                        const nombre = item?.nombreCompleto || `${item?.nombre || ""} ${item?.apellido || ""}`.trim() || (tipo === "administrador" ? "Administrador" : "Contacto");

                        return { id, tipo, nombre };
                    })
                    .filter(Boolean);

                setContactos(mapped);

                if (location?.state?.abrirChatAdministrador && !contactoActivo) {
                    const admin = mapped.find((c) => c.tipo === "administrador");
                    if (admin) setContactoActivo(admin);
                }
            } catch (error) {
                console.error("[Chat] Error cargando contactos:", error);
            } finally {
                setCargandoContactos(false);
            }
        };

        cargarContactos();
    }, [contactoActivo, isAdministrador, isArrendatario, isEstudiante, location?.state?.abrirChatAdministrador, token, userId]);

    // Cargar historial por conversación activa
    useEffect(() => {
        const cargarHistorial = async () => {
            if (!token || !contactoActivo?.id) return;
            setCargandoHistorial(true);
            try {
                const url = `${import.meta.env.VITE_BACKEND_URL}/listar-chats`;
                const params = obtenerParamsContacto(contactoActivo);
                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                });

                const raw = Array.isArray(response?.data)
                    ? response.data
                    : (Array.isArray(response?.data?.chats) ? response.data.chats : []);

                setMensajes(raw.map((m) => normalizarMensaje(m)));
            } catch (error) {
                console.error("[Chat] Error cargando historial:", error);
            } finally {
                setCargandoHistorial(false);
            }
        };

        cargarHistorial();
    }, [contactoActivo, normalizarMensaje, obtenerParamsContacto, token]);

    // Pedir permiso para notificaciones al montar
    useEffect(() => {
        try {
            if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                Notification.requestPermission().then(() => {});
            }
        } catch {
            // noop
        }
    }, []);

    // Auto-scroll cuando cambian los mensajes
    useEffect(() => {
        try {
            const el = mensajesRef.current;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        } catch {
            // noop
        }
    }, [mensajes]);

    const asignarResidenciaAlEstudiante = async () => {
        const departamentoId = location?.state?.departamentoId || propietarioInfo?.departamentoId;
        const estudianteId = contactoActivo?.id;

        if (!isArrendatario) {
            toast.error("Solo el arrendatario puede asignar la residencia");
            return;
        }

        if (!departamentoId) {
            toast.error("No hay un departamento seleccionado para asignar");
            return;
        }

        if (!estudianteId) {
            toast.error("Selecciona un estudiante primero");
            return;
        }

        setAsignando(true);
        try {
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/asignarEstudiante`;
            const response = await axios.put(url, { departamentoId, estudianteId }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("[Chat] Departamento asignado:", response?.data);
            toast.success("Residencia asignada al estudiante");
        } catch (error) {
            console.error("[Chat] Error asignando residencia:", error);
            const errorMessage = error?.response?.data?.msg || error?.response?.data?.message || "No se pudo asignar la residencia";
            toast.error(errorMessage);
        } finally {
            setAsignando(false);
        }
    };

    // Conexión Socket.IO para recibir mensajes en tiempo real
    useEffect(() => {
        // Base URL del socket (remueve "/api" si está presente)
        const socketBase = String(import.meta.env.VITE_BACKEND_URL || "").replace(/\/api\/?$/, "");
        if (!socketBase) return;

        const socket = io(socketBase, {
            transports: ["polling", "websocket"],
            auth: { token },
            withCredentials: true,
        });

        const onNuevoMensaje = (payload) => {
            try {
                console.log("[Chat] socket nuevo-mensaje-chat:", payload);
                const m = payload?.chat || payload;
                // Verificar si el mensaje pertenece a la conversación abierta
                const belongsToConversation = esMiConversacion(m);

                // Mostrar notificación para mensajes entrantes (si no son nuestros)
                const remitenteStr = String(m?.remitente || "").toLowerCase();
                if (remitenteStr && remitenteStr !== roleNormalized) {
                    toast.info(`Nuevo mensaje de ${m.remitente || 'contacto'}`);
                    try {
                        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                            new Notification(m.remitente || 'Nuevo mensaje', { body: m.mensaje || '' });
                        }
                    } catch (e) {
                        console.warn('Notification error', e);
                    }
                }

                if (belongsToConversation) {
                    const nuevo = normalizarMensaje(m);

                    if (!contactoActivo && isArrendatario) {
                        setContactoActivo({
                            id: nuevo.estudianteId,
                            nombre: nuevo.estudianteNombre || "Estudiante",
                            tipo: "estudiante",
                        });
                    }

                    setMensajes((prev) => {
                        const exists = prev.some((mm) => mm.id && nuevo.id && String(mm.id) === String(nuevo.id));
                        if (exists) return prev;
                        return [...prev, nuevo];
                    });
                }
                else {
                    // Si no pertenece a la conversación abierta, actualizar listado de contactos con un badge
                    try {
                        const otherId = m.arrendatarioId && String(m.arrendatarioId) !== String(userId) ? m.arrendatarioId
                            : m.estudianteId && String(m.estudianteId) !== String(userId) ? m.estudianteId
                            : m.administradorId && String(m.administradorId) !== String(userId) ? m.administradorId
                            : null;
                        const tipo = m.administradorId ? 'administrador' : (m.arrendatarioId ? 'arrendatario' : 'estudiante');
                        if (otherId) {
                            setContactos((prev) => {
                                const found = prev.find((c) => String(c.id) === String(otherId));
                                if (found) {
                                    return prev.map((c) => c.id === found.id ? { ...c, unread: (c.unread||0) + 1 } : c);
                                }
                                const nombre = tipo === 'administrador' ? 'Administrador' : 'Contacto';
                                return [{ id: otherId, tipo, nombre, unread: 1 }, ...prev];
                            });
                        }
                    } catch (e) {
                        console.warn('update contacts on socket message', e);
                    }
                }
            } catch (e) {
                console.error("[Chat] error manejando evento socket:", e);
            }
        };

        socket.on("nuevo-mensaje-chat", onNuevoMensaje);
        socket.on("enviar-mensaje-front-back", onNuevoMensaje);

        socket.on("connect_error", (err) => console.warn("[Chat] socket connect_error:", err));

        return () => {
            socket.off("nuevo-mensaje-chat", onNuevoMensaje);
            socket.off("enviar-mensaje-front-back", onNuevoMensaje);
            socket.disconnect();
        };
    }, [contactoActivo, esMiConversacion, isArrendatario, isEstudiante, normalizarMensaje, token, userId, roleNormalized]);

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
            const contactoEsAdmin = contactoActivo?.tipo === "administrador";
            const payload = {
                mensaje: data.mensaje,
                remitente: roleNormalized,
                administradorId: contactoEsAdmin ? contactoActivo.id : null,
                arrendatarioId: isArrendatario ? userId : (isEstudiante && !contactoEsAdmin ? contactoActivo.id : null),
                estudianteId: isEstudiante ? userId : (isArrendatario && !contactoEsAdmin ? contactoActivo.id : null),
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

            // Preferir el objeto devuelto por el servidor si existe
            const serverChat = response?.data?.chat || response?.data;
            let nuevoMensaje;
            if (serverChat && typeof serverChat === "object") {
                nuevoMensaje = normalizarMensaje({ ...serverChat, remitente: serverChat.remitente || payload.remitente });
            } else {
                nuevoMensaje = {
                    id: `${payload.mensaje}-${Date.now()}`,
                    ...payload,
                    createdAt: new Date(),
                };
            }

            if (isEstudiante && !contactoActivo) {
                setContactoActivo({
                    id: payload.arrendatarioId,
                    nombre: propietarioInfo?.propietarioNombre || "Propietario",
                    tipo: "arrendatario",
                });
            }

            if (isArrendatario && !contactoActivo) {
                setContactoActivo({
                    id: payload.estudianteId,
                    nombre: miNombre || "Estudiante",
                    tipo: "estudiante",
                });
            }

            // Agregar el mensaje localmente solo si no existe (evitar duplicados)
            setMensajes((prev) => {
                const exists = prev.some((m) => m.id && nuevoMensaje.id && String(m.id) === String(nuevoMensaje.id));
                if (exists) return prev;
                return [...prev, nuevoMensaje];
            });
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] min-h-0">
                    {/* Lista de contactos */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col min-h-0">
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
                                    {isArrendatario && (
                                        <p className="text-sm text-gray-500">Selecciona un contacto del listado para iniciar.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 flex-1">
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

                                {cargandoContactos ? (
                                    <p className="text-xs text-gray-500 mt-3">Cargando contactos...</p>
                                ) : (
                                    <div className="mt-3 space-y-2 overflow-y-auto">
                                        {contactos.map((c) => (
                                            <button
                                                key={`${c.tipo}-${c.id}`}
                                                type="button"
                                                onClick={() => { setContactoActivo(c); setContactos((prev) => prev.map(p => p.id===c.id?{...p,unread:0}:p)); }}
                                                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${String(contactoActivo?.id || "") === String(c.id) ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                                                    { (c.nombre||"?").split(' ').map(s=>s[0]).slice(0,2).join('') }
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold text-gray-800">{c.nombre}</p>
                                                        {c.unread > 0 && (
                                                            <span className="inline-flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6">{c.unread}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 capitalize">{c.tipo || "contacto"}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {cargandoContactos ? (
                            <p className="text-xs text-gray-500 mt-3">Cargando contactos...</p>
                        ) : (
                            <div className="mt-3 space-y-2 overflow-y-auto">
                                {contactos.map((c) => (
                                    <button
                                        key={`${c.tipo}-${c.id}`}
                                        type="button"
                                        onClick={() => setContactoActivo(c)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${String(contactoActivo?.id || "") === String(c.id) ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                                    >
                                        <p className="text-sm font-semibold text-gray-800">{c.nombre}</p>
                                        <p className="text-xs text-gray-500 capitalize">{c.tipo || "contacto"}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Área de chat */}
                    {contactoActivo ? (
                        <div className="lg:col-span-2 border border-gray-200 rounded-lg flex flex-col bg-white min-h-0 overflow-hidden">
                            {/* Header del chat */}
                            <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
                                <h3 className="text-lg font-semibold text-gray-800">{contactoActivo.nombre || (isArrendatario ? miNombre : "Contacto")}</h3>
                                {contactoActivo.departamento && (
                                    <p className="text-sm text-gray-600">{contactoActivo.departamento}</p>
                                )}
                                {isArrendatario && contactoActivo?.id && contactoActivo?.tipo !== "administrador" && (location?.state?.departamentoId || propietarioInfo?.departamentoId) && (
                                    <button
                                        type="button"
                                        onClick={asignarResidenciaAlEstudiante}
                                        disabled={asignando}
                                        className="mt-3 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {asignando ? "Asignando..." : "Asignar mi residencia al estudiante"}
                                    </button>
                                )}
                            </div>

                            {/* Mensajes */}
                            <div ref={mensajesRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                                {cargandoHistorial ? (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <p>Cargando historial...</p>
                                    </div>
                                ) : mensajes.length === 0 ? (
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
                                    {propietarioInfo?.propietarioNombre || "Propietario"}
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
