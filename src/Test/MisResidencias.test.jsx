import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Details from '../pages/Details';
import useFetch from '../hooks/useFetch';
import storeAuth from '../context/storeAuth';

// Mock de mocks globales
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
}));
vi.mock('swiper/react', () => ({
  Swiper: ({ children }) => <div>{children}</div>,
  SwiperSlide: ({ children }) => <div>{children}</div>,
}));
vi.mock('axios');
vi.mock('../hooks/useFetch');
vi.mock('../context/storeAuth');

describe('Componente Details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 1. Mock de localStorage para evitar el error de 'null' en la línea 344
    const mockToken = JSON.stringify({ state: { token: 'fake-token' } });
    Storage.prototype.getItem = vi.fn().mockReturnValue(mockToken);
    
    storeAuth.mockReturnValue({ rol: 'estudiante', user: { nombre: 'Test' } });
  });

  test('debe mostrar mensaje de carga inicialmente', () => {
    useFetch.mockReturnValue({ fetchDataBackend: vi.fn().mockReturnValue(new Promise(() => {})) });
    
    render(
      <MemoryRouter initialEntries={['/departamento/1']}>
        <Routes>
          <Route path="/departamento/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/cargando datos del departamento/i)).toBeInTheDocument();
  });

  test('debe abrir modal de queja al hacer click en el botón', async () => {
    const mockDepartamento = {
      _id: '1',
      titulo: 'Departamento Test',
      estudianteId: 'user123',
      imagenes: []
    };
    
    // Configuramos el mock para que responda inmediatamente
    useFetch.mockReturnValue({ 
      fetchDataBackend: vi.fn().mockResolvedValue(mockDepartamento) 
    });

    render(
      <MemoryRouter initialEntries={['/departamento/1']}>
        <Routes>
          <Route path="/departamento/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );

    // 2. Usamos findByText buscando el texto exacto del título para evitar problemas de selectores
    const titulo = await screen.findByText('Departamento Test');
    expect(titulo).toBeInTheDocument();

    const botonQueja = screen.getByRole('button', { name: /queja o sugerencia/i });
    fireEvent.click(botonQueja);

    expect(screen.getByText(/escribe tu queja o sugerencia/i)).toBeInTheDocument();
  });
});