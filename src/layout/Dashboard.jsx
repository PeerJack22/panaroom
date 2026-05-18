import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCommentDots, FaHouse, FaUser, FaUsers } from 'react-icons/fa6';
import storeAuth from '../context/storeAuth'
import storeProfile from '../context/storeProfile'

const Dashboard = () => {
    const location = useLocation();
    const urlActual = location.pathname;
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { clearToken, rol } = storeAuth();
    const { user, clearUser } = storeProfile();

    const avatarUrl =
        user?.avatarUrl ||
        'https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3';

    const handleLogout = () => {
        toast.dismiss();
        clearUser();
        clearToken();
    };

    const navItems = [
        { to: '/dashboard', label: 'Perfil', icon: FaUser },
        { to: '/dashboard/listar', label: 'Residencias', icon: FaHouse },
        ...(rol === 'estudiante' ? [{ to: '/dashboard/mis-residencias', label: 'Mis residencias', icon: FaHouse }] : []),
        { to: '/dashboard/quejas-sugerencias', label: 'Quejas y sugerencias', icon: FaCommentDots },
        { to: '/dashboard/chat', label: 'Chat', icon: FaCommentDots },
        ...(rol === 'administrador' ? [{ to: '/dashboard/usuarios', label: 'Administrar usuarios', icon: FaUsers }] : []),
    ];

    const buttonBase =
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2';

    const navButtonClass = (activo) =>
        activo
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-500/20'
            : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700';

    return (
        <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_55%,_#f8fafc_100%)] md:flex">

            {/* Sidebar principal */}
            <aside
                className={`hidden border-r border-white/60 bg-white/90 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:flex md:flex-col md:justify-between transition-all duration-300 ease-in-out ${
                    sidebarVisible ? 'md:w-72 px-6 opacity-100' : 'md:w-0 md:px-0 opacity-0 overflow-hidden'
                }`}
            >
                <div className="w-full">
                    <div className="mb-7 flex items-center gap-3">
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900">PanaRoom</h2>
                            <p className="text-sm text-slate-500">Panel de control</p>
                        </div>
                    </div>

                    <img
                        src={avatarUrl}
                        alt="Usuario"
                        className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_12px_30px_rgba(37,99,235,0.18)]"
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
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${navButtonClass(activo)}`}
                                    >
                                        <Icono className={`text-base ${activo ? 'text-white' : 'text-blue-600'}`} />
                                        {item.label}
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
                className={`fixed top-0 left-0 z-50 h-full w-80 border-r border-white/60 bg-white/95 px-6 py-8 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">PanaRoom</h2>
                            <p className="text-sm text-slate-500">Panel de control</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                            aria-label="Cerrar menú"
                        >
                            ×
                        </button>
                    </div>

                    <img
                        src={avatarUrl}
                        alt="Usuario"
                        className="mx-auto mb-4 h-20 w-20 rounded-full border-4 border-white object-cover shadow-[0_12px_30px_rgba(37,99,235,0.18)]"
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
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${navButtonClass(activo)}`}
                                    >
                                        <Icono className={`text-base ${activo ? 'text-white' : 'text-blue-600'}`} />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">

                <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl md:px-6">
                    <div className="flex items-center justify-start gap-3 overflow-x-auto whitespace-nowrap md:gap-4">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 md:hidden"
                            aria-label="Abrir menú"
                            title="Abrir menú"
                        >
                            ☰
                        </button>
                        <button
                            type="button"
                            onClick={() => setSidebarVisible((prev) => !prev)}
                            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 md:inline-flex"
                            aria-label={sidebarVisible ? 'Ocultar menú' : 'Mostrar menú'}
                            title={sidebarVisible ? 'Ocultar menú' : 'Mostrar menú'}
                        >
                            ☰
                        </button>
                        <div className="min-w-0 shrink-0">
                            <h1 className="text-lg font-bold text-slate-900 md:text-xl">Dashboard</h1>
                        </div>
                        <div className="flex min-w-0 shrink-0 items-center gap-3 rounded-full border border-blue-100 bg-white px-3 py-2 shadow-sm">
                            <img
                                src={avatarUrl}
                                alt="Usuario"
                                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md shadow-blue-600/15"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{user?.nombre || 'Usuario'}</p>
                                <p className="truncate text-xs text-slate-500">{rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : 'Rol no definido'}</p>
                            </div>
                        </div>
                        <Link
                            to="/"
                            className={`${buttonBase} shrink-0 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700`}
                            onClick={handleLogout}
                        >
                            Salir
                        </Link>
                    </div>
                </header>

                <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
                    <Outlet />
                </main>

                <footer className="border-t border-white/60 bg-white/70 py-4 text-center text-sm text-slate-500 backdrop-blur-xl">
                    © {new Date().getFullYear()} PanaRoom - Todos los derechos reservados
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;
