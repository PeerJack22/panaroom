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
  const abrirChatAdministrador = Boolean(location?.state?.abrirChatAdministrador);
  const administradorDestinoId = location?.state?.administradorId || null;
  const administradorDestinoNombre = location?.state?.administradorNombre || "Administrador";
  const arrendatarioNombre = location?.state?.arrendatarioNombre || null;
  const roleNormalized = String(rol || "").toLowerCase();
  const isEstudiante = roleNormalized === "estudiante";
  const isArrendatario = roleNormalized === "arrendatario";
  const isAdministrador = roleNormalized === "administrador";

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const [contactos, setContactos] = useState([]);
  const [contactoActivo, setContactoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [cargandoContactos, setCargandoContactos] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [enviando, setEnviando] = useState(false);
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

  // cargar contactos
    useEffect(() => {
    const cargar = async () => {
      if (!token || !userId) return;
      setCargandoContactos(true);
      try {
        const params = {};
        if (isArrendatario) params.arrendatarioId = userId;
        if (isEstudiante) params.estudianteId = userId;
        if (isAdministrador) params.administradorId = userId;
        const url = `${import.meta.env.VITE_BACKEND_URL}/listar-contactos`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, params });
        const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.contactos) ? res.data.contactos : []);
        const mapped = raw.map((item) => {
          const id = item?._id || item?.id || item?.contactoId || item?.arrendatarioId || item?.estudianteId || item?.administradorId;
          if (!id) return null;
          let tipo = (item?.tipo || item?.rol || "").toLowerCase();
          if (!tipo) {
            if (item?.administradorId && String(item.administradorId) === String(id)) tipo = "administrador";
            else if (item?.estudianteId && String(item.estudianteId) === String(id)) tipo = "estudiante";
            else if (item?.arrendatarioId && String(item.arrendatarioId) === String(id)) tipo = "arrendatario";
          }
          const nombre = item?.nombreCompleto || `${item?.nombre || ""} ${item?.apellido || ""}`.trim() || (tipo === "administrador" ? "Administrador" : "Contacto");
          return { id, tipo, nombre, unread: 0 };
        }).filter(Boolean);
        setContactos(mapped);

        if (abrirChatAdministrador && !contactoActivo) {
          const admin = mapped.find(c => c.tipo === 'administrador');
          if (admin) {
            setContactoActivo(admin);
          } else {
            // Si no hay admin en contactos, obtener de /listarAdministradores
            try {
              const adminUrl = `${import.meta.env.VITE_BACKEND_URL}/listarAdministradores`;
              const adminRes = await axios.get(adminUrl, { headers: { Authorization: `Bearer ${token}` } });
              const admins = Array.isArray(adminRes?.data) ? adminRes.data : (adminRes?.data?.administradores || []);
              if (admins.length > 0) {
                const firstAdmin = admins[0];
                const adminId = firstAdmin?._id || firstAdmin?.id;
                const adminNombre = `${firstAdmin?.nombre || ""} ${firstAdmin?.apellido || ""}`.trim() || "Administrador";
                const adminContact = {
                  id: adminId,
                  tipo: 'administrador',
                  nombre: adminNombre,
                  unread: 0,
                };
                setContactoActivo(adminContact);
                setContactos(prevContactos => {
                  const exists = prevContactos.some(c => c.id === adminId && c.tipo === 'administrador');
                  return exists ? prevContactos : [...prevContactos, adminContact];
                });
              }
            } catch (adminErr) {
              console.error('[Chat] obtener administrador', adminErr);
              // Fallback si existe administradorDestinoId
              if (administradorDestinoId) {
                setContactoActivo({
                  id: administradorDestinoId,
                  tipo: 'administrador',
                  nombre: administradorDestinoNombre,
                  unread: 0,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('[Chat] cargar contactos', err);
      } finally {
        setCargandoContactos(false);
      }
    };
    cargar();
  }, [token, userId, isArrendatario, isEstudiante, isAdministrador, abrirChatAdministrador, administradorDestinoId, administradorDestinoNombre, contactoActivo]);

  // cargar historial cuando cambia contacto
  useEffect(() => {
    const cargar = async () => {
      if (!token || !contactoActivo?.id) return;
      setCargandoHistorial(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/listar-chats`;
        const params = obtenerParamsContacto(contactoActivo);
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, params });
        const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.chats) ? res.data.chats : []);
        setMensajes(raw.map(m => normalizarMensaje(m)));
      } catch (err) {
        console.error('[Chat] cargar historial', err);
      } finally {
        setCargandoHistorial(false);
      }
    };
    cargar();
  }, [contactoActivo, normalizarMensaje, obtenerParamsContacto, token]);

  // socket
  useEffect(() => {
    const socketBase = String(import.meta.env.VITE_BACKEND_URL || "").replace(/\/api\/?$/, "");
    if (!socketBase) return;
    const socket = io(socketBase, { transports: ['polling','websocket'], auth: { token }, withCredentials: true });

    const onNuevo = (payload) => {
      const m = payload?.chat || payload;
      // decide if message belongs to active conversation
      const belongs = (() => {
        if (!m) return false;
        if (isEstudiante) {
          if (contactoActivo?.tipo === 'administrador') return String(userId) === String(m.estudianteId) && String(contactoActivo.id) === String(m.administradorId);
          return String(contactoActivo?.id || '') === String(m.arrendatarioId || '') && String(userId || '') === String(m.estudianteId || '');
        }
        if (isArrendatario) {
          if (contactoActivo?.tipo === 'administrador') return String(userId) === String(m.arrendatarioId) && String(contactoActivo.id) === String(m.administradorId);
          return String(userId || '') === String(m.arrendatarioId || '') && String(contactoActivo?.id || '') === String(m.estudianteId || '');
        }
        if (isAdministrador) {
          if (contactoActivo?.tipo === 'arrendatario') return String(userId) === String(m.administradorId) && String(contactoActivo.id) === String(m.arrendatarioId);
          if (contactoActivo?.tipo === 'estudiante') return String(userId) === String(m.administradorId) && String(contactoActivo.id) === String(m.estudianteId);
        }
        return false;
      })();

      // desktop notification (no toast for every msg)
      try {
        const remit = String(m?.remitente || '').toLowerCase();
        if (remit && remit !== roleNormalized && Notification && Notification.permission === 'granted') {
          new Notification(m.remitente || 'Nuevo mensaje', { body: m.mensaje || '' });
        }
      } catch (err) { console.warn('Notification error', err); }

      if (belongs) {
        const nuevo = normalizarMensaje(m);
        setMensajes(prev => {
          const exists = prev.some(p => p.id && nuevo.id && String(p.id) === String(nuevo.id));
          if (exists) return prev;
          return [...prev, nuevo];
        });
      } else {
        // increment unread for contact
        const otherId = m.arrendatarioId && String(m.arrendatarioId) !== String(userId) ? m.arrendatarioId
          : m.estudianteId && String(m.estudianteId) !== String(userId) ? m.estudianteId
          : m.administradorId && String(m.administradorId) !== String(userId) ? m.administradorId
          : null;
        const tipo = m.administradorId && String(m.administradorId) !== String(userId) ? 'administrador' 
          : (m.arrendatarioId && String(m.arrendatarioId) !== String(userId) ? 'arrendatario' : 'estudiante');
        if (otherId) {
          setContactos(prev => {
            const found = prev.find(c => String(c.id) === String(otherId));
            if (found) return prev.map(c => c.id === found.id ? { ...c, unread: (c.unread||0)+1 } : c);
            // Obtener nombre del payload si está disponible
            let nombre = m?.nombreRemitente || m?.nombre || m?.nombreCompleto || `${m?.nombreRemitente || ''} ${m?.apellidoRemitente || ''}`.trim();
            
            // Si no hay nombre en el payload, buscar en localStorage
            if (!nombre || nombre.trim() === '') {
              const userMap = JSON.parse(localStorage.getItem('userNameMap') || '{}');
              nombre = userMap[otherId] || '';
            }
            
            // Fallback a nombre genérico si sigue sin nombre
            if (!nombre || nombre.trim() === '') {
              nombre = tipo === 'administrador' ? 'Administrador' : (tipo === 'arrendatario' ? 'Arrendatario' : 'Estudiante');
            }
            return [{ id: otherId, tipo, nombre, unread: 1 }, ...prev];
          });
        }
      }
    };

    socket.on('nuevo-mensaje-chat', onNuevo);
    socket.on('enviar-mensaje-front-back', onNuevo);
    socket.on('connect_error', (err) => console.warn('[Chat] socket error', err));

    return () => {
      socket.off('nuevo-mensaje-chat', onNuevo);
      socket.off('enviar-mensaje-front-back', onNuevo);
      socket.disconnect();
    };
  }, [token, contactoActivo, normalizarMensaje, obtenerParamsContacto, roleNormalized, userId, isArrendatario, isEstudiante, isAdministrador]);

  // request notifications
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // autoscroll
  useEffect(() => {
    const el = mensajesRef.current; if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes]);

  const enviarMensaje = async (data) => {
    if (!contactoActivo) { toast.error('Selecciona un contacto primero'); return; }
    if (!data.mensaje || !data.mensaje.trim()) { toast.error('El mensaje no puede estar vacío'); return; }
    setEnviando(true);
    try {
      // Determinar si es chat con administrador basado en el tipo de contacto activo
      const esChatConAdministrador = contactoActivo?.tipo === 'administrador';

      // Obtener nombre del remitente
      let nombreRemitente = `${user?.nombre || ""} ${user?.apellido || ""}`.trim();
      if (isArrendatario && arrendatarioNombre) {
        nombreRemitente = arrendatarioNombre;
      }

      const payload = {
        mensaje: data.mensaje,
        remitente: roleNormalized,
        nombreRemitente: nombreRemitente || "Usuario",
      };

      // Guardar mapeo de ID -> nombre en localStorage para que otros usuarios lo usen
      if (isArrendatario && nombreRemitente) {
        const userMap = JSON.parse(localStorage.getItem('userNameMap') || '{}');
        userMap[userId] = nombreRemitente;
        localStorage.setItem('userNameMap', JSON.stringify(userMap));
      } else if (isEstudiante && nombreRemitente) {
        const userMap = JSON.parse(localStorage.getItem('userNameMap') || '{}');
        userMap[userId] = nombreRemitente;
        localStorage.setItem('userNameMap', JSON.stringify(userMap));
      } else if (isAdministrador && nombreRemitente) {
        const userMap = JSON.parse(localStorage.getItem('userNameMap') || '{}');
        userMap[userId] = nombreRemitente;
        localStorage.setItem('userNameMap', JSON.stringify(userMap));
      }

      // Asignar IDs según el rol y tipo de contacto
      if (isArrendatario) {
        payload.arrendatarioId = userId;
        if (esChatConAdministrador) {
          payload.administradorId = contactoActivo.id;
        } else {
          payload.estudianteId = contactoActivo.id;
        }
      } else if (isEstudiante) {
        payload.estudianteId = userId;
        if (esChatConAdministrador) {
          payload.administradorId = contactoActivo.id;
        } else {
          payload.arrendatarioId = contactoActivo.id;
        }
      } else if (isAdministrador) {
        payload.administradorId = userId;
        if (contactoActivo?.tipo === 'arrendatario') {
          payload.arrendatarioId = contactoActivo.id;
        } else if (contactoActivo?.tipo === 'estudiante') {
          payload.estudianteId = contactoActivo.id;
        }
      }

      const url = `${import.meta.env.VITE_BACKEND_URL}/chat/mensaje`;
      const res = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const serverChat = res?.data?.chat || res?.data;
      const nuevo = serverChat && typeof serverChat === 'object' ? normalizarMensaje({ ...serverChat, remitente: serverChat.remitente || payload.remitente }) : ({ id: `${payload.mensaje}-${Date.now()}`, ...payload, createdAt: new Date() });
      setMensajes(prev => {
        const exists = prev.some(p => p.id && nuevo.id && String(p.id) === String(nuevo.id));
        if (exists) return prev; return [...prev, nuevo];
      });
      reset({ mensaje: '' });
    } catch (err) {
      console.error('[Chat] enviar', err); toast.error('Error al enviar el mensaje');
    } finally { setEnviando(false); }
  };

  // enter to send
  const onKeyDownTextarea = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(enviarMensaje)();
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 mb-10 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8">
        <button onClick={() => navigate('/dashboard')} className="mb-4 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">← Atrás</button>
        <h1 className="text-4xl font-bold text-gray-500 mb-6">Chat</h1>
        <hr className="my-4 border-t-2 border-gray-300" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] min-h-0">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col min-h-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contactos</h2>
            <div className="flex-1">
              {contactoActivo && (
                <div className="p-3 rounded-lg bg-white border-2 border-blue-600 mb-3">
                  <p className="font-semibold">{contactoActivo.nombre}</p>
                  {contactoActivo.tipo && <p className="text-xs text-gray-500">{contactoActivo.tipo}</p>}
                </div>
              )}

              <div className="space-y-2 overflow-y-auto flex-1">
                {cargandoContactos ? (
                  <p className="text-xs text-gray-500">Cargando contactos...</p>
                ) : contactos.length === 0 ? (
                  <p className="text-xs text-gray-500">No hay contactos.</p>
                ) : contactos.filter(c => String(c.id) !== String(contactoActivo?.id)).map(c => (
                  <button key={`${c.tipo}-${c.id}`} type="button" onClick={() => { setContactoActivo(c); setContactos(prev => prev.map(p => p.id===c.id?{...p,unread:0}:p)); }}
                    className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 ${String(contactoActivo?.id||'')===String(c.id)?'border-blue-600 bg-blue-50':'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">{(c.nombre||'?').split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{c.nombre}</p>
                        {c.unread>0 && <span className="inline-flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6">{c.unread}</span>}
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{c.tipo}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 border border-gray-200 rounded-lg flex flex-col bg-white min-h-0 overflow-hidden">
            <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-semibold">{contactoActivo?.nombre || 'Selecciona un contacto'}</h3>
              {contactoActivo?.departamento && <p className="text-sm text-gray-600">{contactoActivo.departamento}</p>}
            </div>

            <div ref={mensajesRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {cargandoHistorial ? (
                <div className="flex items-center justify-center h-full text-gray-500">Cargando historial...</div>
              ) : mensajes.length===0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">No hay mensajes aún.</div>
              ) : mensajes.map((msg,i)=>(
                <div key={msg.id||i} className={`flex ${msg.remitente===roleNormalized? 'justify-end':'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.remitente===roleNormalized? 'bg-blue-600 text-white':'bg-gray-200 text-gray-800'}`}>
                    <p className="text-sm">{msg.mensaje}</p>
                    <p className="text-xs mt-1 text-gray-500">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit(enviarMensaje)} className="flex gap-2">
                <textarea {...register('mensaje',{ required: 'El mensaje es obligatorio' })} onKeyDown={onKeyDownTextarea}
                  placeholder="Escribe tu mensaje..." rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <button type="submit" disabled={enviando} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400">{enviando? 'Enviando...':'Enviar'}</button>
              </form>
              {errors.mensaje && <p className="text-sm text-red-600 mt-2">{errors.mensaje.message}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
