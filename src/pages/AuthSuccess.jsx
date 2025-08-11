import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import storeAuth from '../context/storeAuth';

const AuthSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setToken, setRol, setUser } = storeAuth();

    useEffect(() => {
        try {
            // Obtener los datos del usuario desde la URL
            const jsonData = searchParams.get('data');
            
            if (!jsonData) {
                toast.error('No se recibieron los datos de autenticación');
                navigate('/login');
                return;
            }

            // Parsear los datos JSON
            const userData = JSON.parse(jsonData);
            console.log('Datos recibidos:', userData);

            if (!userData.token) {
                toast.error('No se recibió el token de autenticación');
                navigate('/login');
                return;
            }

            // Guardar el token
            setToken(userData.token);

            // Construir el objeto usuario
            const user = {
                _id: userData._id,
                nombre: userData.nombre,
                apellido: userData.apellido,
                direccion: userData.direccion || '',
                celular: userData.celular || '',
                email: userData.email || ''
            };

            // Guardar el rol y los datos del usuario
            setRol(userData.rol);
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
