import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import storeAuth from '../context/storeAuth';

const Chat = () => {
    const location = useLocation();
    const { user, rol } = storeAuth();
    const { arrendatarioId, estudianteId, departamentoId } = location.state || {};
    const [asignando, setAsignando] = useState(false);
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const pollingRef = useRef(null);
    const scrollRef = useRef(null);

    const asignarEstudiante = async () => {
        if (!departamentoId || !estudianteId) {
            toast.error('Faltan datos para asignar el estudiante.');
            return;
        }

        if (!user || !user._id) {
            toast.error('No se pudo identificar al usuario.');
            return;
        }

        // Solo el arrendatario propietario puede asignar
        if (String(user._id) !== String(arrendatarioId)) {
            toast.error('No tienes permiso para asignar este departamento.');
            return;
        }

        setAsignando(true);
        try {
            const token = JSON.parse(localStorage.getItem('auth-token'))?.state?.token || user.token;
            const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/asignarEstudiante`;
            const payload = { departamentoId, estudianteId };
            const resp = await axios.put(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            toast.success(resp?.data?.msg || 'Estudiante asignado al departamento.');
            // Mantenerse en chat para seguir conversando
        } catch (error) {
            const msg = error?.response?.data?.msg || error?.response?.data?.message || 'Error al asignar estudiante';
            toast.error(msg);
        } finally {
            setAsignando(false);
        }
    };

    const fetchMensajes = async () => {
        if (!arrendatarioId || !estudianteId) return;
        try {
            const token = JSON.parse(localStorage.getItem('auth-token'))?.state?.token || user?.token;
            const url = `${import.meta.env.VITE_BACKEND_URL}/chat/mensajes?arrendatarioId=${arrendatarioId}&estudianteId=${estudianteId}`;
            const resp = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = resp?.data || [];
            setMensajes(Array.isArray(data) ? data : (data?.mensajes || []));
            // scroll to bottom
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            console.debug('No se pudo obtener historial de mensajes:', err?.message || err);
        }
    };

    useEffect(() => {
        // initial fetch
        fetchMensajes();
        // start polling
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(fetchMensajes, 5000);
        return () => clearInterval(pollingRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [arrendatarioId, estudianteId]);

    const enviarMensaje = async (e) => {
        e?.preventDefault?.();
        if (!texto || !arrendatarioId || !estudianteId || enviando) return;
        setEnviando(true);
        const payload = {
            mensaje: texto,
            remitente: rol === 'arrendatario' ? 'arrendatario' : 'estudiante',
            arrendatarioId,
            estudianteId,
        };

        try {
            const token = JSON.parse(localStorage.getItem('auth-token'))?.state?.token || user?.token;
            const url = `${import.meta.env.VITE_BACKEND_URL}/chat/mensaje`;
            const resp = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            // Append locally for responsiveness
            const nuevo = resp?.data || payload;
            setMensajes((prev) => [...prev, nuevo]);
            setTexto('');
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch (err) {
            const msg = err?.response?.data?.msg || err?.response?.data?.message || 'No se pudo enviar el mensaje';
            toast.error(msg);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div>
            <h1 className='font-black text-4xl text-gray-500'>Chat</h1>
            <hr className='my-4 border-t-2 border-gray-300' />

            <div className="mb-6">
                <p className="text-gray-700">Aquí aparecerá la conversación entre estudiante y arrendatario.</p>
                {arrendatarioId && estudianteId && (
                    <p className="text-sm text-gray-500 mt-1">Conversación: arrendatario <strong>{arrendatarioId}</strong> · estudiante <strong>{estudianteId}</strong></p>
                )}

                <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                    {mensajes.length === 0 && <p className="text-sm text-gray-500">No hay mensajes aún. Escribe el primer mensaje abajo.</p>}
                    {mensajes.map((m, i) => {
                        const remit = m.remitente || m.from || m.remitenteType || '';
                        const isOwn = (remit === 'arrendatario' && rol === 'arrendatario') || (remit === 'estudiante' && rol === 'estudiante');
                        return (
                            <div key={`msg-${i}`} className={`mb-2 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg max-w-[75%]`}> 
                                    <div className="text-sm">{m.mensaje || m.texto || m.body}</div>
                                    <div className="text-xs text-gray-400 mt-1 text-right">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>

                <form onSubmit={enviarMensaje} className="mt-3 flex gap-2">
                    <input
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={enviando || !texto}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-blue-300"
                    >
                        {enviando ? 'Enviando...' : 'Enviar'}
                    </button>
                </form>

                {arrendatarioId && estudianteId && String(user?._id) === String(arrendatarioId) && (
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={asignarEstudiante}
                            disabled={asignando}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500"
                        >
                            {asignando ? 'Asignando...' : 'Asignar estudiante a la residencia'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
