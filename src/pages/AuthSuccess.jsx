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
            
            // Redirigir al dashboard - primero intentar con navigate
            toast.success('¡Inicio de sesión exitoso!');
            
            try {
                navigate('/dashboard');
                
                // Como respaldo, también configuramos un temporizador para redirigir después de 1 segundo
                // si el navigate no funciona correctamente
                setTimeout(() => {
                    if (window.location.pathname !== '/dashboard') {
                        console.log('Redirección fallida con navigate, intentando con window.location');
                        window.location.href = '/dashboard';
                    }
                }, 1000);
            } catch (navError) {
                console.error('Error en navigate:', navError);
                // Si falla navigate, usamos window.location directamente
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error('Error al procesar los datos de autenticación:', error);
            toast.error('Error al procesar los datos de autenticación');
            navigate('/login');
        }
    }, [navigate, searchParams, setToken, setRol, setUser]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default AuthSuccess;
