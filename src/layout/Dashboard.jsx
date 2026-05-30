import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaClipboardList, FaComments, FaHouseChimney, FaUser, FaBed, FaUsers } from 'react-icons/fa6';
import { io } from "socket.io-client";
import storeAuth from '../context/storeAuth'
import storeProfile from '../context/storeProfile'
import logo_proyecto from '../assets/logo_proyecto.png';

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const urlActual = location.pathname;
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { clearToken, rol, token } = storeAuth();
    const { user, clearUser } = storeProfile();
    const userId = user?._id || user?.id || null;

    // Configuración global de notificaciones y Socket
    useEffect(() => {
        if (!token || !userId) return;

        // Solicitar permisos de notificación al iniciar sesión (entrar al dashboard)
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const socketBase = String(import.meta.env.VITE_BACKEND_URL || "").replace(/\/api\/?$/, "");
        if (!socketBase) return;

        const socket = io(socketBase, {
            transports: ['polling'],
            auth: { token },
            withCredentials: true,
        });

        socket.on('nuevo-mensaje-chat', (payload) => {
            const m = payload?.chat || payload;
            const remit = String(m?.remitente || '').toLowerCase();
            const miRol = String(rol || '').toLowerCase();

            // Notificar solo si:
            // 1. El remitente no soy yo.
            // 2. NO estoy en la pantalla de chat O la pestaña está en segundo plano (document.hidden)
            if (remit && remit !== miRol && (location.pathname !== '/dashboard/chat' || document.hidden)) {
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    const titulo = `Mensaje de ${m.nombreRemitente || 'PanaRoom'}`;
                    const notification = new Notification(titulo, {
                        body: m.mensaje,
                        icon: logo_proyecto,
                    });

                    notification.onclick = () => {
                        window.focus();
                        navigate('/dashboard/chat');
                    };
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [token, userId, rol, location.pathname, navigate]);

    const avatarUrl =
        user?.avatarUrl ||
        'https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3';

    const handleLogout = () => {
        toast.dismiss();
        clearUser();
        clearToken();
    };

    const sidebarCompact = !sidebarVisible;

    const navItems = [
        { to: '/dashboard', label: 'Perfil', icon: FaUser },
        { to: '/dashboard/listar', label: 'Residencias', icon: FaHouseChimney },
        ...(rol === 'estudiante' ? [{ to: '/dashboard/mis-residencias', label: 'Mis residencias', icon: FaBed }] : []),
        { to: '/dashboard/quejas-sugerencias', label: 'Quejas y sugerencias', icon: FaClipboardList },
        { to: '/dashboard/chat', label: 'Chat', icon: FaComments },
        ...(rol === 'administrador' ? [{ to: '/dashboard/usuarios', label: 'Administrar usuarios', icon: FaUsers }] : []),
    ];

    const buttonBase =
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2';

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-100 md:flex md:h-screen md:items-stretch md:overflow-hidden">

            {/* Sidebar principal */}
            <aside
                className={`hidden border-r border-slate-800/10 bg-slate-900/95 py-8 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-md md:sticky md:top-0 md:flex md:h-screen md:flex-col md:justify-between md:overflow-y-auto transition-all duration-300 ease-in-out ${
                    sidebarVisible ? 'md:w-64 px-5' : 'md:w-20 px-2'
                }`}
            >
                <div className="w-full">
                    <div className={`mb-7 flex items-center ${sidebarCompact ? 'justify-center' : 'gap-2.5'}`}>
                        <img
                            src={logo_proyecto}
                            alt="PanaRoom"
                            className={`${sidebarCompact ? 'h-11 w-11' : 'h-14 w-14'} rounded-xl object-contain shadow-md`}
                        />
                        {!sidebarCompact && (
                            <div className="text-left">
                                <h2 className="text-2xl font-extrabold text-white">PanaRoom</h2>
                                <p className="text-sm text-slate-300">Panel de control</p>
                            </div>
                        )}
                    </div>

                    <img
                        src={avatarUrl}
                        alt="Usuario"
                        className={`mx-auto mb-4 rounded-full border-4 border-white object-cover shadow-[0_10px_24px_rgba(148,163,184,0.12)] ${sidebarCompact ? 'h-10 w-10' : 'h-24 w-24'}`}
                    />

                    <ul className="mt-6 space-y-2">
                        {navItems.map((item) => {
                            const activo = urlActual === item.to;
                            const Icono = item.icon;
                            return (
                                <li key={item.to}>
                                    <Link
                                        to={item.to}
                                        title={item.label}
                                        className={`flex items-center rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                                            sidebarCompact ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                                        } ${
                                            activo
                                                ? 'border-white/10 bg-white/10 text-white shadow-sm'
                                                : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <Icono className={`text-base ${activo ? 'text-white' : 'text-slate-300'}`} />
                                        {!sidebarCompact && item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            {/* Overlay móvil */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar móvil tipo drawer */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-80 border-r border-slate-800/10 bg-slate-900/95 px-6 py-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-md transition-transform duration-300 ease-in-out md:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div>
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <img
                                src={logo_proyecto}
                                alt="PanaRoom"
                                className="h-12 w-12 rounded-xl object-contain shadow-md"
                            />
                            <div>
                                <h2 className="text-2xl font-bold text-white">PanaRoom</h2>
                                <p className="text-sm text-slate-300">Panel de control</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-slate-200 transition hover:bg-white/15 hover:text-white"
                            aria-label="Cerrar menú"
                        >
                            ×
                        </button>
                    </div>

                    <img
                        src={avatarUrl}
                        alt="Usuario"
                        className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-white object-cover shadow-[0_10px_24px_rgba(148,163,184,0.12)]"
                    />

                    <ul className="mt-6 space-y-2">
                        {navItems.map((item) => {
                            const activo = urlActual === item.to;
                            const Icono = item.icon;
                            return (
                                <li key={item.to}>
                                    <Link
                                        to={item.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                            activo
                                                ? 'border-white/10 bg-white/10 text-white shadow-sm'
                                                : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <Icono className={`text-base ${activo ? 'text-white' : 'text-slate-300'}`} />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-100 md:overflow-hidden">

                <header className="sticky top-0 z-30 border-b border-slate-800/10 bg-slate-900/95 px-4 py-2 shadow-[0_6px_18px_rgba(15,23,42,0.08)] backdrop-blur-md md:px-6 md:py-2">
                    <div className="flex items-center justify-between gap-3 md:gap-4">
                        <div className="flex min-w-0 items-center gap-3 md:gap-4">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-sm transition hover:bg-white/15 md:hidden"
                                aria-label="Abrir menú"
                                title="Abrir menú"
                            >
                                ☰
                            </button>
                            <button
                                type="button"
                                onClick={() => setSidebarVisible((prev) => !prev)}
                                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-sm transition hover:bg-white/15 md:inline-flex"
                                aria-label={sidebarVisible ? 'Ocultar menú' : 'Mostrar menú'}
                                title={sidebarVisible ? 'Ocultar menú' : 'Mostrar menú'}
                            >
                                ☰
                            </button>
                            <div className="min-w-0 shrink-0">
                                <h1 className="text-lg font-bold text-white md:text-[1.1rem]">Dashboard</h1>
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-3 shrink-0">
                            <div className="flex min-w-0 items-center gap-3 rounded-full border border-white/10 bg-white/10 px-2 py-1">
                                <img
                                    src={avatarUrl}
                                    alt="Usuario"
                                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">{user?.nombre || 'Usuario'}</p>
                                    <p className="truncate text-xs text-slate-300">{rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : 'Rol no definido'}</p>
                                </div>
                            </div>
                            <Link
                                to="/"
                                className={`${buttonBase} shrink-0 bg-red-600 text-white hover:bg-red-700 focus:ring-red-300`}
                                onClick={handleLogout}
                            >
                                Salir
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
