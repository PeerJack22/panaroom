import axios from "axios";
import { toast } from "react-toastify";
import { useCallback } from "react";

function useFetch() {
    const fetchDataBackend = useCallback(async (url, data = null, method = "GET", headers = {}) => {
        const normalizedMethod = String(method || "GET").toUpperCase();
        const shouldShowSuccessToast = ["POST", "PUT", "PATCH", "DELETE"].includes(normalizedMethod);
        const loadingToast = toast.loading("Procesando solicitud...");
        try {
            const isFormData = data instanceof FormData;
            const isDelete = normalizedMethod === "DELETE";

            const finalHeaders = isFormData
                ? { ...headers }
                : isDelete && !data
                    ? { ...headers } // No agregues Content-Type en DELETE sin body
                    : { "Content-Type": "application/json", ...headers };

            const options = {
                method: normalizedMethod,
                url,
                headers: finalHeaders,
                ...(data && { data }),
            };

            const response = await axios(options);
            toast.dismiss(loadingToast);

            const successMessage = response?.data?.msg || response?.data?.message;
            if (successMessage) {
                toast.success(successMessage);
            } else if (shouldShowSuccessToast) {
                toast.success("Operación realizada correctamente");
            }

            return response?.data;
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error(error);

            const errorMessage =
                error?.response?.data?.msg ||
                error?.response?.data?.message ||
                error?.message ||
                "Error en la solicitud";

            toast.error(errorMessage);
            return null;
        }
    }, []);

    return { fetchDataBackend };
}

export default useFetch;