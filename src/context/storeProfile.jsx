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

const getProfileEndpoint = (rol) => {
    if (rol === "administrador") return "perfilAd";
    if (rol === "estudiante") return "estudiante/perfil";
    return "arrendatario/perfil";
};

const getUpdateProfileEndpoint = (rol, id) => {
    if (rol === "administrador") return `${import.meta.env.VITE_BACKEND_URL}/administrador/perfil/${id}`;
    if (rol === "estudiante") return `${import.meta.env.VITE_BACKEND_URL}/estudiante/perfil/${id}`;
    return `${import.meta.env.VITE_BACKEND_URL}/arrendatario/${id}`;
};

const getUpdatePasswordEndpoint = (rol, id) => {
    if (rol === "administrador") return `${import.meta.env.VITE_BACKEND_URL}/administrador/actualizarpassword/${id}`;
    if (rol === "estudiante") return `${import.meta.env.VITE_BACKEND_URL}/estudiante/actualizarpassword/${id}`;
    return `${import.meta.env.VITE_BACKEND_URL}/arrendatario/actualizarpassword/${id}`;
};


const storeProfile = create((set) => ({
        
        user: null,
        clearUser: () => set({ user: null }),
        profile: async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem("auth-token"));
                const endpoint = getProfileEndpoint(storedUser?.state?.rol);
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
                const url = getUpdateProfileEndpoint(rol, id);
                const respuesta = await axios.put(url, data, getAuthHeaders(isFormData));

                set({ user: respuesta.data })
                return respuesta; // Añadir return para poder manejar la respuesta
            } catch (error) {
                console.log(error)
                toast.error(error.response?.data?.msg || "Error al actualizar el perfil")
                throw error; // Re-lanzar el error para manejarlo en el componente
            }
        },
        updatePasswordProfile:async(data,id,token = null,useResetEndpoint = false)=>{
            try {
                const rol = getCurrentRole();
                if (useResetEndpoint && rol === "administrador" && token) {
                    const url = `${import.meta.env.VITE_BACKEND_URL}/administrador/nuevopassword/${token}`;
                    const respuesta = await axios.post(url, data);
                    toast.success(respuesta?.data?.msg)
                    return respuesta;
                }

                const url = getUpdatePasswordEndpoint(rol, id);
                const respuesta = await axios.put(url, data, getAuthHeaders());

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
