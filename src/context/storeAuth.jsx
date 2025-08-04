import { create } from "zustand";
import { persist } from "zustand/middleware";

const storeAuth = create(
    persist(
        (set) => ({
            token: null,
            rol: null,
            user: null, // ✅ Agregamos el estado 'user'
            setToken: (token) => set({ token }),
            setRol: (rol) => set({ rol }),
            setUser: (user) => set({ user }), // ✅ Agregamos un método para guardar el usuario
            clearToken: () => set({ token: null, rol: null, user: null }), // ✅ Limpiamos todo al salir
        }),
        { name: "auth-token" }
    )
);

export default storeAuth;