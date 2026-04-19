import storeAuth from '../context/storeAuth';
import { Navigate } from 'react-router-dom';


export default function PrivateRouteWithRole({ children }) {

    const {rol} = storeAuth()
    
    return (rol === "administrador") ? children : <Navigate to="/dashboard" replace />
    
}