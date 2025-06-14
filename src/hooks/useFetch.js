import axios from 'axios'
import { toast } from 'react-toastify'

function useFetch() {

    const fetchDataBackend = async (url, form = null, method = 'POST') => {

        try {
            let respuesta
            if (method === 'POST') {
                respuesta = await axios.post(url, form)
            } else if (method === 'GET') {
                respuesta = await axios.get(url)
            }
            toast.success(respuesta?.data?.msg)
            return respuesta?.data
            
        } catch (error) {
            toast.error(error.response?.data?.msg)
            const errorMsg = error.response?.data?.msg || 'Error desconocido';
            throw new Error(errorMsg);
        }
    }

    return { fetchDataBackend }
}

export default useFetch
