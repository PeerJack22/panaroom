import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import storeAuth from "../context/storeAuth";
import { confirm } from "../utils/swal";
import { MdChatBubble, MdSend } from 'react-icons/md';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rol, token, user } = storeAuth();
  const userId = user?._id || user?.id || null;
  const abrirChatAdministrador = Boolean(location?.state?.abrirChatAdministrador);
  const departamentoNombre = location?.state?.departamentoNombre || null;
  const departamentoId = location?.state?.departamentoId || null;
  const contactoDestinoId =
    location?.state?.contactoId ||
    location?.state?.propietarioId ||
    location?.state?.arrendatarioId ||
    null;
  const contactoDestinoTipo = String(
    location?.state?.contactoTipo ||
    (location?.state?.arrendatarioId ? "arrendatario" : "") ||
    (location?.state?.propietarioId ? "arrendatario" : "")
  ).toLowerCase();
  const contactoDestinoNombre =
    location?.state?.contactoNombre ||
    location?.state?.propietarioNombre ||
    location?.state?.arrendatarioNombre ||
    null;
  const arrendatarioNombre = location?.state?.arrendatarioNombre || null;
  const roleNormalized = String(rol || "").toLowerCase();
  const isEstudiante = roleNormalized === "estudiante";
  const isArrendatario = roleNormalized === "arrendatario";
  const isAdministrador = roleNormalized === "administrador";
  const textoDescripcionChat = isAdministrador
    ? "Este módulo te permite una comunicación directa con los arrendatarios"
    : isArrendatario
      ? "Este módulo te permite una comunicación directa con los administradores y estudiantes"
      : "Este módulo te permite una comunicación directa con los arrendatarios";

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const [contactos, setContactos] = useState([]);
  const [contactoActivo, setContactoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [cargandoContactos, setCargandoContactos] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [asignandoDepartamento, setAsignandoDepartamento] = useState(false);
  
  const mensajesRef = useRef(null);
  const departamentoActivoId = contactoActivo?.departamentoId || departamentoId || null;
  const departamentoActivoNombre = contactoActivo?.departamentoNombre || departamentoNombre || null;
  const irADetalleDepartamento = () => {
    if (!departamentoActivoId) return;
    navigate(`/dashboard/visualizar/${departamentoActivoId}`, {
      state: {
        from: "/dashboard/chat",
      },
    });
  };
  const contactoInicializadoRef = useRef(false);
  const ultimoContactoIdCargadoRef = useRef(null);

  const normalizarMensaje = useCallback((m) => ({
    id: m?._id || m?.id || `${m?.mensaje}-${m?.createdAt}`,
    mensaje: m?.mensaje,
    remitente: String(m?.remitente || "").toLowerCase(),
    administradorId: m?.administradorId || null,
    arrendatarioId: m?.arrendatarioId || null,
    estudianteId: m?.estudianteId || null,
    departamentoId: m?.departamentoId || m?.departamento?._id || null,
    departamentoNombre: m?.departamentoNombre || m?.departamento?.titulo || m?.departamento?.nombre || null,
    createdAt: m?.createdAt ? new Date(m.createdAt) : new Date(),
  }), []);

  const formatearHoraMensaje = useCallback((valor) => {
    if (!valor) return "";
    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    return fecha.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatearVistaUltimoMensaje = useCallback((contacto) => {
    const texto = String(contacto?.ultimoMensaje || "").trim();
    if (!texto) return "";
    return contacto?.ultimoMensajeEsMio ? `Tú: ${texto}` : texto;
  }, []);

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

  const cargarUltimoMensajeContacto = useCallback(async (contacto, headers) => {
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/listar-chats`;
      const params = obtenerParamsContacto(contacto);
      const res = await axios.get(url, { headers, params });
      const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.chats) ? res.data.chats : []);
      if (!raw.length) return {};

      const ultimo = raw[raw.length - 1];
      const mensajeNormalizado = normalizarMensaje(ultimo);
      const ultimoEsMio = String(
        ultimo?.remitente || mensajeNormalizado.remitente || ""
      ).toLowerCase() === roleNormalized;

      return {
        ultimoMensaje: mensajeNormalizado.mensaje || "",
        ultimoMensajeAt: mensajeNormalizado.createdAt,
        ultimoMensajeEsMio: ultimoEsMio,
      };
    } catch (error) {
      console.error("[Chat] cargar último mensaje", error);
      return {};
    }
  }, [normalizarMensaje, obtenerParamsContacto, roleNormalized]);

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
          return {
            id,
            tipo,
            nombre,
            unread: 0,
            departamentoId: item?.departamentoId || item?.departamento?._id || null,
            departamentoNombre: item?.departamentoNombre || item?.departamento?.titulo || item?.departamento?.nombre || null,
          };
        }).filter(Boolean);

        const contactosConUltimoMensaje = await Promise.all(
          mapped.map(async (contacto) => ({
            ...contacto,
            ...(await cargarUltimoMensajeContacto(contacto, { Authorization: `Bearer ${token}` })),
          }))
        );

        setContactos(contactosConUltimoMensaje);
      } catch (err) {
        console.error('[Chat] cargar contactos', err);
      } finally {
        setCargandoContactos(false);
      }
    };
    cargar();
  }, [token, userId, isArrendatario, isEstudiante, isAdministrador, cargarUltimoMensajeContacto]);

  useEffect(() => {
    if (!contactos.length || contactoInicializadoRef.current) return;

    if (contactoActivo) {
      contactoInicializadoRef.current = true;
      return;
    }

    let siguienteContacto = null;

    if (abrirChatAdministrador) {
      siguienteContacto = contactos.find((c) => c.tipo === 'administrador') || null;
    }

    if (!siguienteContacto && contactoDestinoId && contactoDestinoTipo) {
      siguienteContacto = contactos.find(
        (c) => String(c.id) === String(contactoDestinoId) && String(c.tipo) === String(contactoDestinoTipo)
      ) || {
        id: contactoDestinoId,
        tipo: contactoDestinoTipo,
        nombre: contactoDestinoNombre || 'Contacto',
        unread: 0,
        departamentoId: departamentoId || null,
        departamentoNombre: departamentoNombre || null,
      };
    }

    if (!siguienteContacto && isArrendatario) {
      siguienteContacto = contactos.find((c) => c.tipo === 'estudiante') || contactos[0] || null;
    }

    if (siguienteContacto) {
      setContactoActivo(siguienteContacto);
      contactoInicializadoRef.current = true;
    }
  }, [abrirChatAdministrador, contactoActivo, contactoDestinoId, contactoDestinoNombre, contactoDestinoTipo, contactos, departamentoId, departamentoNombre, isArrendatario]);

  // cargar historial cuando cambia contacto
  useEffect(() => {
    const cargar = async () => {
      if (!token || !contactoActivo?.id) return;
      if (ultimoContactoIdCargadoRef.current === contactoActivo.id) return;
      ultimoContactoIdCargadoRef.current = contactoActivo.id;
      setCargandoHistorial(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/listar-chats`;
        const params = obtenerParamsContacto(contactoActivo);
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, params });
        const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.chats) ? res.data.chats : []);
        const normalizados = raw.map((m) => normalizarMensaje(m));
        setMensajes(normalizados);

        if ((!contactoActivo?.departamentoId || !contactoActivo?.departamentoNombre) && normalizados.length > 0) {
          const ultimoConDepartamento = [...normalizados].reverse().find((m) => m?.departamentoId || m?.departamentoNombre);
          if (ultimoConDepartamento) {
            const departamentoIdDerivado = ultimoConDepartamento.departamentoId || null;
            const departamentoNombreDerivado = ultimoConDepartamento.departamentoNombre || null;

            setContactos((prevContactos) => prevContactos.map((contacto) => (
              String(contacto.id) === String(contactoActivo.id)
                ? {
                    ...contacto,
                    departamentoId: contacto.departamentoId || departamentoIdDerivado,
                    departamentoNombre: contacto.departamentoNombre || departamentoNombreDerivado,
                  }
                : contacto
            )));
            // También actualizar el contacto activo para que la UI muestre el departamento inmediatamente
            setContactoActivo((prev) => prev && String(prev.id) === String(contactoActivo.id)
              ? {
                  ...prev,
                  departamentoId: prev.departamentoId || departamentoIdDerivado,
                  departamentoNombre: prev.departamentoNombre || departamentoNombreDerivado,
                }
              : prev
            );
          }
        }
      } catch (err) {
        console.error('[Chat] cargar historial', err);
      } finally {
        setCargandoHistorial(false);
      }
    };
    cargar();
  }, [contactoActivo, token, obtenerParamsContacto, normalizarMensaje]);

  // socket
  useEffect(() => {
    const socketBase = String(import.meta.env.VITE_BACKEND_URL || "").replace(/\/api\/?$/, "");
    if (!socketBase) return;
    const socket = io(socketBase, {
      transports: ['polling'],
      upgrade: false,
      auth: { token },
      withCredentials: true,
    });

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

      if (belongs) {
        const nuevo = normalizarMensaje(m);
        setMensajes(prev => {
          const exists = prev.some(p => p.id && nuevo.id && String(p.id) === String(nuevo.id));
          if (exists) return prev;
          return [...prev, nuevo];
        });
        setContactos((prev) => {
          const target = prev.find(c => String(c.id) === String(contactoActivo?.id));
          const rest = prev.filter(c => String(c.id) !== String(contactoActivo?.id));
          const updated = {
            ...(target || {}),
            ultimoMensaje: nuevo.mensaje,
            ultimoMensajeAt: nuevo.createdAt,
            ultimoMensajeEsMio: false,
            unread: 0
          };
          return [updated, ...rest];
        });
        setContactoActivo((prevContacto) => prevContacto ? {
          ...prevContacto,
          ultimoMensaje: nuevo.mensaje,
          ultimoMensajeAt: nuevo.createdAt,
          ultimoMensajeEsMio: false,
        } : prevContacto);
      } else {
        // increment unread for contact
        const otherId = m.arrendatarioId && String(m.arrendatarioId) !== String(userId) ? m.arrendatarioId
          : m.estudianteId && String(m.estudianteId) !== String(userId) ? m.estudianteId
          : m.administradorId && String(m.administradorId) !== String(userId) ? m.administradorId
          : null;
        const tipo = m.administradorId && String(m.administradorId) !== String(userId) ? 'administrador' 
          : (m.arrendatarioId && String(m.arrendatarioId) !== String(userId) ? 'arrendatario' : 'estudiante');
        if (otherId) {
          setContactos((prev) => {
            const found = prev.find(c => String(c.id) === String(otherId));
            const rest = prev.filter(c => String(c.id) !== String(otherId));
            const updated = found ? {
              ...found,
              unread: (c.unread || 0) + 1,
              ultimoMensaje: m?.mensaje || found.ultimoMensaje || "",
              ultimoMensajeAt: m?.createdAt ? new Date(m.createdAt) : new Date(),
              ultimoMensajeEsMio: String(m?.remitente || "").toLowerCase() === roleNormalized,
            } : null;
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

            if (updated) return [updated, ...rest];

            // Si es un contacto totalmente nuevo que no estaba en la lista
            return [{
              id: otherId,
              tipo,
              nombre,
              unread: 1,
              ultimoMensaje: m?.mensaje || "",
              ultimoMensajeAt: m?.createdAt ? new Date(m.createdAt) : new Date(),
              ultimoMensajeEsMio: String(m?.remitente || "").toLowerCase() === roleNormalized,
            }, ...prev];
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

      // Preparar texto del mensaje (posible prefijo con info de departamento)
      let messageText = data.mensaje.trim();
      if (isEstudiante && contactoActivo?.tipo === 'arrendatario' && mensajes.length === 0) {
        const deptInfo = departamentoActivoNombre ? `Departamento: ${departamentoActivoNombre}` : (departamentoActivoId ? `Departamento ID: ${departamentoActivoId}` : '');
        if (deptInfo) messageText = `${deptInfo}\n\n${messageText}`;
      }

      // Obtener nombre del remitente
      let nombreRemitente = `${user?.nombre || ""} ${user?.apellido || ""}`.trim();
      if (isArrendatario && arrendatarioNombre) {
        nombreRemitente = arrendatarioNombre;
      }

      const payload = {
        mensaje: messageText,
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
          if (departamentoId) payload.departamentoId = departamentoId;
        }
      } else if (isEstudiante) {
        payload.estudianteId = userId;
        if (esChatConAdministrador) {
          payload.administradorId = contactoActivo.id;
        } else {
          payload.arrendatarioId = contactoActivo.id;
          // Añadir departamento actual si está disponible (provisto por la ruta o por el historial)
          if (departamentoActivoId) payload.departamentoId = departamentoActivoId;
          else if (departamentoId) payload.departamentoId = departamentoId;
        }
      } else if (isAdministrador) {
        payload.administradorId = userId;
        if (contactoActivo?.tipo === 'arrendatario') {
          payload.arrendatarioId = contactoActivo.id;
          if (departamentoId) payload.departamentoId = departamentoId;
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
        setContactos((prev) => {
          const target = prev.find(c => String(c.id) === String(contactoActivo.id));
          const rest = prev.filter(c => String(c.id) !== String(contactoActivo.id));
          const updated = {
            ...(target || {}),
            ultimoMensaje: messageText,
            ultimoMensajeAt: new Date(),
            ultimoMensajeEsMio: true,
          };
          return [updated, ...rest];
        });
        setContactoActivo((prevContacto) => prevContacto && String(prevContacto.id) === String(contactoActivo.id)
          ? {
              ...prevContacto,
              ultimoMensaje: messageText,
              ultimoMensajeAt: new Date(),
              ultimoMensajeEsMio: true,
            }
          : prevContacto
        );
      reset({ mensaje: '' });
    } catch (err) {
      console.error('[Chat] enviar', err); toast.error('Error al enviar el mensaje');
    } finally { setEnviando(false); }
  };

  const asignarDepartamentoAlEstudiante = async () => {
    const idParaAsignar = departamentoActivoId;
    if (!isArrendatario || contactoActivo?.tipo !== 'estudiante') {
      toast.error('No se puede asignar el departamento en esta conversación.');
      return;
    }
    if (!idParaAsignar) {
      toast.error('No hay un departamento actual para asignar.');
      return;
    }

    const confirmar = await confirm({
      title: 'Asignar departamento',
      text: `¿Deseas asignar el departamento a ${contactoActivo?.nombre || 'este estudiante'}?`,
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar',
      icon: 'question',
    });
    if (!confirmar) return;

    setAsignandoDepartamento(true);
    const loadingToast = toast.loading('Asignando departamento...');

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/asignarEstudiante`;
      await axios.put(url, {
        departamentoId: idParaAsignar,
        estudianteId: contactoActivo.id,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      toast.dismiss(loadingToast);
      toast.success('Departamento asignado correctamente al estudiante');
      // Actualizar estado local para reflejar la asignación
      const nombreAsignado = departamentoActivoNombre || contactoActivo?.departamentoNombre || '';
      setContactos((prev) => prev.map((c) => String(c.id) === String(contactoActivo.id) ? { ...c, departamentoId: idParaAsignar, departamentoNombre: nombreAsignado } : c));
      setContactoActivo((prev) => prev ? { ...prev, departamentoId: idParaAsignar, departamentoNombre: nombreAsignado } : prev);
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error?.response?.data?.msg || error?.response?.data?.message || 'No se pudo asignar el departamento';
      toast.error(errorMessage);
    } finally {
      setAsignandoDepartamento(false);
    }
  };

  

  // enter to send
  const onKeyDownTextarea = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(enviarMensaje)();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Chat</h1>
          <p className="mt-2 text-sm text-slate-500">{textoDescripcionChat}</p>
          <hr className="mt-6 border-slate-200" />
        </header>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] min-h-0">
          <div className="rounded-2xl border border-gray-200 shadow-sm bg-gray-50 p-4 flex flex-col min-h-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contactos</h2>
            <div className="flex-1">
              {contactoActivo && (
                <div className="p-3 rounded-2xl bg-white border-2 border-blue-600 mb-3">
                  <p className="font-semibold">{contactoActivo.nombre}</p>
                  {contactoActivo.tipo && <p className="text-xs text-gray-500">{contactoActivo.tipo}</p>}
                  {(contactoActivo.ultimoMensaje || contactoActivo.ultimoMensajeAt) && (
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 text-xs text-gray-600 truncate">
                        {formatearVistaUltimoMensaje(contactoActivo) || "Sin mensajes aún"}
                      </p>
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {formatearHoraMensaje(contactoActivo.ultimoMensajeAt)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 overflow-y-auto flex-1">
                {cargandoContactos ? (
                  <p className="text-xs text-gray-500">Cargando contactos...</p>
                ) : contactos.length === 0 ? (
                  <p className="text-xs text-gray-500">No hay contactos.</p>
                ) : contactos.filter(c => String(c.id) !== String(contactoActivo?.id)).map(c => (
                  <button key={`${c.tipo}-${c.id}`} type="button" onClick={() => { setContactoActivo(c); setContactos(prev => prev.map(p => p.id===c.id?{...p,unread:0}:p)); }}
                    className={`w-full text-left p-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center gap-3 ${String(contactoActivo?.id||'')===String(c.id)?'border-blue-600 bg-blue-50':' '}`}>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${c.unread > 0 ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>{c.nombre}</p>
                        {c.unread > 0 && <span className="inline-flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 shadow-sm">{c.unread}</span>}
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{c.tipo}</p>
                      {(c.ultimoMensaje || c.ultimoMensajeAt) && (
                        <div className="mt-2 flex items-start justify-between gap-3">
                          <p className={`min-w-0 flex-1 text-xs truncate ${c.unread > 0 ? 'font-bold text-slate-800' : 'text-gray-500'}`}>
                            {formatearVistaUltimoMensaje(c) || "Sin mensajes aún"}
                          </p>
                          <span className={`shrink-0 text-[11px] ${c.unread > 0 ? 'font-bold text-blue-600' : 'text-gray-400'}`}>
                            {formatearHoraMensaje(c.ultimoMensajeAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 border border-gray-200 rounded-2xl flex flex-col bg-white min-h-0 overflow-hidden">
            {!contactoActivo ? (
              <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm">
                    <MdChatBubble className="h-12 w-12" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-2xl font-extrabold text-slate-900">Tu conversación está vacía</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Para comenzar un chat, selecciona uno de tus contactos disponibles en el panel izquierdo.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 p-4 bg-gray-50 rounded-t-2xl flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{contactoActivo?.nombre}</h3>
                    {(departamentoActivoId || departamentoActivoNombre) && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={irADetalleDepartamento}
                          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          Ver detalle de apartamento
                        </button>
                      </div>
                    )}
                    {contactoActivo?.tipo === 'estudiante' && departamentoActivoNombre && (
                      <p className="text-xs text-gray-500 mt-1">Esta conversación está asociada al departamento indicado arriba.</p>
                    )}
                  </div>

                  {isArrendatario && contactoActivo?.tipo === 'estudiante' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={asignarDepartamentoAlEstudiante}
                        disabled={asignandoDepartamento}
                        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                      >
                        {asignandoDepartamento ? 'Asignando...' : 'Asignar departamento'}
                      </button>
                    </div>
                  )}
                </div>

                <div ref={mensajesRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {cargandoHistorial ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Cargando historial...</div>
                  ) : mensajes.length===0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">No hay mensajes aún.</div>
                  ) : mensajes.map((msg,i)=>(
                    <div key={msg.id||i} className={`flex ${msg.remitente===roleNormalized? 'justify-end':'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.remitente===roleNormalized? 'bg-blue-600 text-white':'bg-gray-200 text-gray-800'}`}>
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
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    <button type="submit" disabled={enviando} className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5 disabled:bg-blue-400">
                      {enviando ? (
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                      ) : (
                        <MdSend className="h-5 w-5" />
                      )}
                    </button>
                  </form>
                  {errors.mensaje && <p className="text-sm text-red-600 mt-2">{errors.mensaje.message}</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Chat;
