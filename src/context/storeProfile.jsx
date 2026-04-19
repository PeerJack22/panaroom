import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";


const getAuthHeaders = (isFormData = false) => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"));
    return {
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            Authorization: `Bearer ${storedUser?.state?.token}`,
        },
    };
};

const getCurrentRole = () => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"));
    return storedUser?.state?.rol;
};


const storeProfile = create((set) => ({
        
        user: null,
        clearUser: () => set({ user: null }),
        profile: async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem("auth-token"));
                const endpoint = storedUser.state.rol === "administrador" ? "perfilAd" : "perfil";
                const url = `${import.meta.env.VITE_BACKEND_URL}/${endpoint}`;
                const respuesta = await axios.get(url, getAuthHeaders())
                set({ user: respuesta.data })
            } catch (error) {
                console.error(error)
            }
        },
        updateProfile:async(data,id)=>{
            try {
                // Detectar si data es un FormData para no enviar Content-Type
                const isFormData = data instanceof FormData;
                console.log("Enviando con FormData:", isFormData);

                const rol = getCurrentRole();
                const endpoints = rol === "administrador"
                    ? [
                        `${import.meta.env.VITE_BACKEND_URL}/administrador/${id}`,
                        `${import.meta.env.VITE_BACKEND_URL}/arrendatario/${id}`,
                    ]
                    : [
                        `${import.meta.env.VITE_BACKEND_URL}/arrendatario/${id}`,
                        `${import.meta.env.VITE_BACKEND_URL}/administrador/${id}`,
                    ];

                let respuesta;
                let lastError;

                for (const url of endpoints) {
                    try {
                        respuesta = await axios.put(url, data, getAuthHeaders(isFormData));
                        break;
                    } catch (error) {
                        lastError = error;
                    }
                }

                if (!respuesta) {
                    throw lastError;
                }

                set({ user: respuesta.data })
                return respuesta; // Añadir return para poder manejar la respuesta
            } catch (error) {
                console.log(error)
                toast.error(error.response?.data?.msg || "Error al actualizar el perfil")
                throw error; // Re-lanzar el error para manejarlo en el componente
            }
        },
        updatePasswordProfile:async(data,id)=>{
            try {
                const rol = getCurrentRole();
                const endpoints = rol === "administrador"
                    ? [
                        `${import.meta.env.VITE_BACKEND_URL}/administrador/actualizarpassword/${id}`,
                        `${import.meta.env.VITE_BACKEND_URL}/arrendatario/actualizarpassword/${id}`,
                    ]
                    : [
                        `${import.meta.env.VITE_BACKEND_URL}/arrendatario/actualizarpassword/${id}`,
                        `${import.meta.env.VITE_BACKEND_URL}/administrador/actualizarpassword/${id}`,
                    ];

                let respuesta;
                let lastError;

                for (const url of endpoints) {
                    try {
                        respuesta = await axios.put(url, data, getAuthHeaders());
                        break;
                    } catch (error) {
                        lastError = error;
                    }
                }

                if (!respuesta) {
                    throw lastError;
                }

                toast.success(respuesta?.data?.msg)
                return respuesta
            } catch (error) {
                console.log(error)
                toast.error(error.response?.data?.msg)
            }
        }
    })
)

export default storeProfile;
