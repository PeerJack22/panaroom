import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import storeAuth from '../context/storeAuth'
import storeProfile from '../context/storeProfile'

const Dashboard = () => {
    const location = useLocation();
    const urlActual = location.pathname;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { clearToken } = storeAuth()
    const{user} = storeProfile()

    const navItems = [
        { to: '/dashboard', label: 'Perfil' },
        { to: '/dashboard/listar', label: 'Lista de residencias' },
        { to: '/dashboard/crear', label: 'Crear residencia' },
        { to: '/dashboard/usuarios', label: 'Administrar usuarios' },
    ];

    return (
        <div className="md:flex md:min-h-screen bg-gray-100">

            {/* Sidebar izquierdo oscuro */}
            <aside
                className={`hidden md:flex bg-gray-900 text-white shadow-md py-8 flex-col items-center justify-between transition-all duration-300 ease-in-out ${
                    sidebarCollapsed ? 'md:w-20 px-3' : 'md:w-64 px-6'
                }`}
            >
                <div className="w-full">
                    <h2 className={`font-bold text-white text-center mb-6 transition-all ${sidebarCollapsed ? 'text-base' : 'text-2xl'}`}>
                        {sidebarCollapsed ? 'PR' : 'PanaRoom'}
                    </h2>

                    <img
                        src={user?.avatarUrl || "https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"}
                        alt="Usuario"
                        className={`mx-auto border-4 border-gray-600 mb-4 rounded-lg transition-all ${sidebarCollapsed ? 'w-14 h-14' : 'w-24 h-24'}`}
                    />

                    <div className={`text-center text-sm text-gray-400 ${sidebarCollapsed ? 'hidden md:block' : ''}`}>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {sidebarCollapsed ? 'Online' : `Bienvenido - ${user?.nombre || ''}`}
                        </span>
                    </div>

                    <ul className="mt-5">
                        {navItems.map((item) => {
                            const activo = urlActual === item.to;
                            return (
                                <li key={item.to} className="text-center">
                                    <Link
                                        to={item.to}
                                        title={item.label}
                                        className={`${
                                            activo
                                                ? 'text-slate-100 bg-gray-800 px-3 py-2 rounded-md'
                                                : 'text-slate-400'
                                        } block mt-2 hover:text-slate-200 transition-colors ${
                                            sidebarCollapsed ? 'text-xs' : 'text-base'
                                        }`}
                                    >
                                        {sidebarCollapsed ? item.label.slice(0, 2).toUpperCase() : item.label}
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
                className={`fixed top-0 left-0 z-50 h-full w-72 bg-gray-900 text-white shadow-md px-6 py-8 flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">PanaRoom</h2>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-gray-300 hover:text-white text-xl"
                            aria-label="Cerrar menú"
                        >
                            ×
                        </button>
                    </div>

                    <img
                        src={user?.avatarUrl || "https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"}
                        alt="Usuario"
                        className="w-20 h-20 mx-auto border-4 border-gray-600 mb-4 rounded-lg"
                    />

                    <div className="text-center text-sm text-gray-400">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {`Bienvenido - ${user?.nombre || ''}`}
                        </span>
                    </div>

                    <ul className="mt-5">
                        {navItems.map((item) => {
                            const activo = urlActual === item.to;
                            return (
                                <li key={item.to} className="text-center">
                                    <Link
                                        to={item.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`${
                                            activo
                                                ? 'text-slate-100 bg-gray-800 px-3 py-2 rounded-md'
                                                : 'text-slate-400'
                                        } text-base block mt-2 hover:text-slate-200 transition-colors`}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            {/* Área principal (contenido y barra superior) */}
            <div className="flex-1 flex flex-col justify-between h-screen">

                {/* Barra superior - estilo oscuro */}
                <header className="bg-gray-800 px-6 py-3 flex justify-between items-center gap-4 shadow">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden bg-gray-700 hover:bg-gray-600 text-white text-lg leading-none px-3 py-1.5 rounded-md transition-colors"
                            aria-label="Abrir menú"
                            title="Abrir menú"
                        >
                            ☰
                        </button>
                        <button
                            type="button"
                            onClick={() => setSidebarCollapsed((prev) => !prev)}
                            className="hidden md:inline-flex bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-md transition-colors"
                        >
                            {sidebarCollapsed ? 'Expandir menu' : 'Contraer menu'}
                        </button>
                        <h1 className="text-white text-lg font-semibold">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <img
                            src={user?.avatarUrl || "https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"}
                                            alt="Usuario"
                                            className="w-10 h-10 border-2 border-gray-600 rounded-full"
                                        />
                                        <Link
                                            to="/"
                                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-full transition-all"
                                            onClick={() => clearToken()}
                                        >
                                            Salir
                                        </Link>
                                    </div>
                                </header>

                                {/* Contenido dinámico */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
                    <Outlet />
                </main>

                {/* Footer oscuro */}
                <footer className="bg-gray-900 py-3 text-center text-sm text-gray-300 shadow-inner">
                    © {new Date().getFullYear()} PanaRoom - Todos los derechos reservados
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;
