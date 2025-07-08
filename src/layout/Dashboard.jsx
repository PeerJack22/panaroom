import { Link, Outlet, useLocation } from 'react-router';
import storeAuth from '../context/storeAuth'
import storeProfile from '../context/storeProfile'

const Dashboard = () => {
    const location = useLocation();
    const urlActual = location.pathname;
    const { clearToken } = storeAuth()
    const{user} = storeProfile()

    return (
        <div className="md:flex md:min-h-screen bg-gray-100">

            {/* Sidebar izquierdo oscuro */}
            <aside className="md:w-64 bg-gray-900 text-white shadow-md px-6 py-8 flex flex-col items-center justify-between">
                <div className="w-full">
                    <h2 className="text-2xl font-bold text-white text-center mb-6">PanaRoom</h2>

                    <img
                        src="https://i.pinimg.com/originals/57/96/7b/57967b8930c1ce7f5269370bb3faea67.jpg"
                        alt="Usuario"
                        className="w-24 h-24 mx-auto border-4 border-gray-600 mb-4 rounded-lg"
                    />

                    <div className="text-center text-sm text-gray-400">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Bienvenido - {user?.nombre}
                        </span>
                    </div>

                    <ul className="mt-5">
                    <li className="text-center">
                        <Link to='/dashboard' className={`${urlActual === '/dashboard' ? 'text-slate-200 bg-gray-900 px-3 py-2 rounded-md text-center' : 'text-slate-600'} text-xl block mt-2 hover:text-slate-600`}>Perfil</Link>
                    </li>

                    <li className="text-center">
                        <Link to='/dashboard/listar' className={`${urlActual === '/dashboard/listar' ? 'text-slate-200 bg-gray-900 px-3 py-2 rounded-md text-center' : 'text-slate-600'} text-xl block mt-2 hover:text-slate-600`}>Listar</Link>
                    </li>

                    <li className="text-center">
                        <Link to='/dashboard/crear' className={`${urlActual === '/dashboard/crear' ? 'text-slate-100 bg-gray-900 px-3 py-2 rounded-md text-center' : 'text-slate-600'} text-xl block mt-2 hover:text-slate-600`}>Crear</Link>
                    </li>

                    <li className="text-center">
                        <Link to='/dashboard/chat' className={`${urlActual === '/dashboard/chat' ? 'text-slate-100 bg-gray-900 px-3 py-2 rounded-md text-center' : 'text-slate-600'} text-xl block mt-2 hover:text-slate-600`}>Chat</Link>
                    </li>
                </ul>
                </div>
            </aside>

            {/* Área principal (contenido y barra superior) */}
            <div className="flex-1 flex flex-col justify-between h-screen">

                {/* Barra superior - estilo oscuro */}
                <header className="bg-gray-800 px-6 py-3 flex justify-end items-center gap-4 shadow">
                    <img
                        src="https://tse2.mm.bing.net/th/id/OIP.6izc_1ssklKdYfOk564lrwHaHa?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"
                        alt="Usuario"
                        className="w-10 h-10 border-2 border-gray-600"
                    />
                    <Link
                        to="/"
                        className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-full transition-all"
                        onClick={() => clearToken()}
                    >
                        Salir
                    </Link>
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
