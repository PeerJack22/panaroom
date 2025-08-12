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
            // Intentar obtener datos de la URL
            const jsonStr = searchParams.get('data');
            const tokenParam = searchParams.get('token');
            
            console.log('Parámetros recibidos:', { 
                data: jsonStr, 
                token: tokenParam,
                todos: Object.fromEntries(searchParams.entries())
            });
            
            let userData;
            
            // Primero intentamos con el parámetro data
            if (jsonStr) {
                try {
                    // Intentar parsear data como JSON
                    userData = JSON.parse(decodeURIComponent(jsonStr));
                    console.log('Datos JSON parseados correctamente:', userData);
                } catch (error) {
                    console.error('Error al parsear JSON:', error);
                    // Probar como si fuera una cadena que no necesita parsing
                    if (jsonStr.includes('"token"')) {
                        try {
                            // A veces el JSON viene como string sin codificar
                            userData = JSON.parse(jsonStr);
                            console.log('Datos JSON parseados en segundo intento:', userData);
                        } catch (e) {
                            console.error('Error en segundo intento de parsing:', e);
                        }
                    }
                }
            } 
            
            // Si no tenemos userData pero tenemos token, construimos el objeto
            if (!userData && tokenParam) {
                userData = {
                    token: tokenParam,
                    _id: searchParams.get('_id') || searchParams.get('id'),
                    nombre: searchParams.get('nombre'),
                    apellido: searchParams.get('apellido'),
                    email: searchParams.get('email'),
                    direccion: searchParams.get('direccion'),
                    celular: searchParams.get('celular'),
                    rol: searchParams.get('rol')
                };
                console.log('Datos construidos desde parámetros:', userData);
            }
            
            // Si aún no tenemos datos, intentamos ver si todo viene en un solo parámetro
            if (!userData) {
                // Buscar algún parámetro que parezca un JSON
                for (const [key, value] of searchParams.entries()) {
                    if (value && (value.includes('{') || value.includes('"token"'))) {
                        try {
                            userData = JSON.parse(value);
                            console.log(`Datos encontrados en el parámetro ${key}:`, userData);
                            break;
                        } catch (e) {
                            console.error(`Error al parsear parámetro ${key}:`, e);
                        }
                    }
                }
            }

            // Verificar que tengamos datos válidos
            if (!userData || !userData.token) {
                toast.error('No se pudieron procesar los datos de autenticación');
                console.error('Datos de autenticación inválidos:', userData);
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
