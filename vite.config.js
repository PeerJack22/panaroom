import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Esto permite usar funciones como 'describe', 'it', 'expect' sin importarlas en cada archivo
    globals: true, 
    // Indicamos que usaremos jsdom para las pruebas de componentes
    environment: 'jsdom',
    // Archivo de configuración inicial (opcional pero recomendado)
    setupFiles: './src/setupTests.js',
    // Directorios donde Vitest buscará los archivos de prueba
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
