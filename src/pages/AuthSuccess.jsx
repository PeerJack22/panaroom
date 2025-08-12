import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import storeAuth from '../context/storeAuth';

const AuthSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setToken, setRol, setUser } = storeAuth();

    useEffect(() => {
        // Debugging: Mostrar todos los parámetros recibidos
        console.log('AuthSuccess: URL completa =', window.location.href);
        console.log('AuthSuccess: Todos los parámetros =', Object.fromEntries(searchParams.entries()));

        try {
            // Simplificar el proceso usando directamente los parámetros de la URL
            const tokenParam = searchParams.get('token');
            
            if (!tokenParam) {
                console.error('No se encontró token en los parámetros');
                toast.error('No se encontró token de autenticación');
                navigate('/login');
                return;
            }
            
            // Construir el objeto de datos del usuario directamente desde los parámetros
            const userData = {
                token: tokenParam,
                _id: searchParams.get('_id'),
                nombre: searchParams.get('nombre'),
                apellido: searchParams.get('apellido'),
                email: searchParams.get('email'),
                direccion: searchParams.get('direccion') || '',
                celular: searchParams.get('celular') || '',
                rol: searchParams.get('rol') || 'arrendatario'
            };
            
            console.log('AuthSuccess: Datos de usuario construidos =', userData);
            
            // Guardar token, rol y datos de usuario
            setToken(userData.token);
            setRol(userData.rol);
            
            const user = {
                _id: userData._id,
                nombre: userData.nombre,
                apellido: userData.apellido,
                direccion: userData.direccion,
                celular: userData.celular,
                email: userData.email
            };
            
            setUser(user);
            
            console.log('AuthSuccess: Datos guardados en store, redirigiendo a dashboard');
            
            // Redirigir al dashboard - intentar con redirección directa
            toast.success('¡Inicio de sesión exitoso!');
            
            console.log('AuthSuccess: Intentando redirección a /dashboard');
            
            // Usar window.location directamente para mayor seguridad
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 500);
        } catch (error) {
            console.error('Error al procesar los datos de autenticación:', error);
            toast.error('Error al procesar los datos de autenticación');
            navigate('/login');
        }
    }, [navigate, searchParams, setToken, setRol, setUser]);

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg">Procesando tu inicio de sesión...</p>
            <button 
                onClick={() => window.location.href = '/dashboard'}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
                Haz clic aquí si no eres redirigido automáticamente
            </button>
        </div>
    );
};

export default AuthSuccess;
