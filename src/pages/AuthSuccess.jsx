import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import storeAuth from '../context/storeAuth';

const AuthSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setToken, setRol, setUser } = storeAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (!token) {
            toast.error('No se recibió el token de autenticación');
            navigate('/login');
            return;
        }

        try {
            // Guardar el token
            setToken(token);

            // Construir el objeto usuario con los datos de la URL
            const user = {
                _id: searchParams.get('id'),
                nombre: searchParams.get('nombre'),
                apellido: searchParams.get('apellido'),
                email: searchParams.get('email'),
                direccion: searchParams.get('direccion'),
                celular: searchParams.get('celular')
            };

            // Guardar el rol y los datos del usuario
            setRol(searchParams.get('rol'));
            setUser(user);

            // Redirigir al dashboard
            toast.success('¡Inicio de sesión exitoso!');
            navigate('/dashboard');
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
