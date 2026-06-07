import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Details from '../pages/Details';
import useFetch from '../hooks/useFetch';
import storeAuth from '../context/storeAuth';
import axios from 'axios';

// Mocks
vi.mock('axios');
vi.mock('../hooks/useFetch');
vi.mock('../context/storeAuth');

describe('Componente Details - Modal Quejas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 1. Mock de localStorage para evitar que el JSON.parse falle
    const mockUser = JSON.stringify({ state: { token: 'fake-token' } });
    Storage.prototype.getItem = vi.fn().mockReturnValue(mockUser);

    // 2. Mock de Auth para que el componente crea que es un estudiante
    storeAuth.mockReturnValue({ rol: 'estudiante', user: { nombre: 'Test' } });
  });

  test('debe enviar una queja correctamente', async () => {
    // 3. Mock de datos: debe incluir lo necesario para que el botón sea visible
    const mockDepto = {
      _id: '1',
      titulo: 'Departamento Test',
      estudianteId: 'user123',
      imagenes: []
    };

    useFetch.mockReturnValue({ 
      fetchDataBackend: vi.fn().mockResolvedValue(mockDepto) 
    });

    axios.post.mockResolvedValue({ data: { msg: 'Comentario enviado' } });
    
    render(
      <MemoryRouter initialEntries={['/departamento/1']}>
        <Routes>
          <Route path="/departamento/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Esperar a que el título aparezca (significa que la carga terminó)
    const titulo = await screen.findByText(/Departamento Test/i);
    expect(titulo).toBeInTheDocument();

    // Ahora el botón debería estar presente
    const botonAbrir = await screen.findByRole('button', { name: /queja o sugerencia/i });
    fireEvent.click(botonAbrir);

    expect(screen.getByText(/escribe tu queja o sugerencia/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/cuéntanos tu queja o sugerencia/i);
    fireEvent.change(textarea, { target: { value: 'Esta es una queja de prueba' } });

    const botonEnviar = screen.getByRole('button', { name: /^enviar$/i });
    fireEvent.click(botonEnviar);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });
});