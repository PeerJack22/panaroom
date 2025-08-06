import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";

const storeDepartamento = create(() => ({
    payDepartamento: async (data) => {
        try {
        const storedUser = JSON.parse(localStorage.getItem("auth-token"));
        const url = `${import.meta.env.VITE_BACKEND_URL}/departamento/pago`; // Ajustar ruta
        const options = {
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser.state.token}`,
            },
        };

        console.log("Datos enviados al backend:", data);
        
        const respuesta = await axios.post(url, data, options);
        toast.success(respuesta.data.msg);
        } catch (error) {
        console.error("Error al procesar el pago:", error);
        toast.error("No se pudo procesar el pago");
        }
    },
    }));

export default storeDepartamento;
