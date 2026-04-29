import { create } from "zustand";
import { persist } from "zustand/middleware";

const storeAuth = create(
    persist(
        (set) => ({
            token: null,
            rol: null,
            user: null, 
            setToken: (token) => set({ token }),
            setRol: (rol) => set({ rol }),
            setUser: (user) => set({ user }), 
            clearToken: () => set({ token: null, rol: null, user: null }), 
        }),
        { name: "auth-token" }
    )
);

export default storeAuth;