import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Chat from '../pages/Chat';
import storeAuth from '../context/storeAuth';
import axios from 'axios';

// Mocks necesarios
vi.mock('axios');
vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    off: vi.fn(),
  }),
}));
vi.mock('../context/storeAuth');

describe('Componente Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Simular autenticación
    storeAuth.mockReturnValue({ 
      rol: 'estudiante', 
      user: { _id: 'estudiante123', nombre: 'Juan' },
      token: 'fake-token' 
    });

    // Mock para la carga inicial de contactos (evita el estado vacío)
    axios.get.mockResolvedValue({ 
      data: [{ 
        _id: 'chat1', 
        contactoId: 'arrendatario456', 
        contactoNombre: 'Dueño Test' 
      }] 
    });
  });

  test('debe renderizar y enviar un mensaje', async () => {
    const stateMock = {
      contactoId: 'arrendatario456',
      departamentoId: 'dpto1',
      contactoNombre: 'Dueño Test'
    };

    axios.post.mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/chat', state: stateMock }]}>
        <Chat />
      </MemoryRouter>
    );

    // 1. Esperar por el área de escritura
    const textarea = await screen.findByPlaceholderText(/escribe tu mensaje/i);
    expect(textarea).toBeInTheDocument();

    // 2. Simular escritura
    fireEvent.change(textarea, { target: { value: 'Hola, ¿sigue disponible?' } });

    // 3. Selección robusta del botón de envío dentro del formulario
    // Buscamos todos los botones y filtramos manualmente el que es tipo "submit"
    const botones = screen.getAllByRole('button');
    const botonEnviar = botones.find(b => b.getAttribute('type') === 'submit');

    expect(botonEnviar).toBeDefined();
    fireEvent.click(botonEnviar);

    // 4. Verificar que se envió la petición
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });
});