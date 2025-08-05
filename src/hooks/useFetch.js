import axios from "axios";
import { toast } from "react-toastify";

function useFetch() {
    const fetchDataBackend = async (url, data = null, method = "GET", headers = {}) => {
        const loadingToast = toast.loading("Procesando solicitud...");
        try {
            // Detecta si data es FormData
            const isFormData = data instanceof FormData;

            const options = {
                method,
                url,
                headers: isFormData
                    ? { ...headers } // NO agregues Content-Type si es FormData
                    : { "Content-Type": "application/json", ...headers },
                data,
            };

            const response = await axios(options);
            toast.dismiss(loadingToast);
            toast.success(response?.data?.msg);
            return response?.data;
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error(error);
            toast.error(error.response?.data?.msg);
        }
    };

    return { fetchDataBackend };
}

export default useFetch;