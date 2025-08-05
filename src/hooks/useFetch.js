import axios from "axios";
import { toast } from "react-toastify";

function useFetch() {
    const fetchDataBackend = async (url, data = null, method = "GET", headers = {}) => {
        const loadingToast = toast.loading("Procesando solicitud...");
        try {
            const isFormData = data instanceof FormData;
            const isDelete = method === "DELETE";

            const finalHeaders = isFormData
                ? { ...headers }
                : isDelete && !data
                    ? { ...headers } // No agregues Content-Type en DELETE sin body
                    : { "Content-Type": "application/json", ...headers };

            const options = {
                method,
                url,
                headers: finalHeaders,
                ...(data && { data }),
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