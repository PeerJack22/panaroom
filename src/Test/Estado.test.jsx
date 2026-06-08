import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { confirm } from '../utils/swal';
import Users from '../pages/Users';

vi.mock('axios');
vi.mock('../utils/swal', () => ({ confirm: vi.fn() }));
vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:api');

describe('Prueba corta de Activación/Desactivación', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Inyectamos un Token falso en LocalStorage para que los useEffect no fallen
    const mockAuthStore = { state: { token: 'fake-jwt-token' } };
    Storage.prototype.getItem = vi.fn(() => JSON.stringify(mockAuthStore));
  });

  test('cambia el estado del usuario al hacer clic en el botón', async () => {
    // 1. Simular las respuestas para las llamadas HTTP de carga inicial
    axios.get.mockImplementation((url) => {
      if (url.includes('/estudiantes')) {
        return Promise.resolve({ data: [{ _id: '123', nombre: 'Juan', apellido: 'Perez', rol: 'estudiante', confirmEmail: true }] });
      }
      return Promise.resolve({ data: [] });
    });
    
    confirm.mockResolvedValueOnce(true);
    axios.put.mockResolvedValueOnce({ data: { msg: 'OK' } });

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );

    // 2. Esperar a que renderice Juan Perez en pantalla
    await waitFor(() => {
      expect(screen.getByText(/Juan Perez/i)).toBeInTheDocument();
    });

    // 3. Buscar el botón "Desactivar cuenta" y hacerle clic
    const boton = screen.getByRole('button', { name: 'Desactivar cuenta' });
    fireEvent.click(boton);

    // 4. Verificar el envío correcto de la mutación a la API
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/administrador/estadoUsuario'),
        { id: '123', tipo: 'estudiante', confirmEmail: false },
        expect.any(Object)
      );
    });

    // 5. Verificar que cambia visualmente a "Activar cuenta"
    expect(screen.getByRole('button', { name: 'Activar cuenta' })).toBeInTheDocument();
  });
});