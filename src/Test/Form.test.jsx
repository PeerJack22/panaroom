import { vi, describe, test, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Form } from '../components/create/Form';

// Mocks necesarios
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div />,
  Marker: () => <div />,
  useMapEvents: () => vi.fn(),
}));

vi.mock('../../context/storeAuth.jsx', () => ({
  default: { getState: () => ({ user: { _id: '123' }, token: 'fake-token' }) }
}));

vi.mock('../../hooks/useFetch', () => ({
  default: () => ({
    fetchDataBackend: vi.fn().mockResolvedValue({ data: [] }),
    loading: false,
    error: null
  })
}));

describe('Flujo Completo de Formulario', () => {
  test('debe navegar exitosamente por todos los pasos hasta el resumen', async () => {
    render(<Form />);

    // --- PASO 1: Llenar y avanzar ---
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/ingresar título/i), { target: { value: 'Casa de Prueba' } });
      fireEvent.change(screen.getByPlaceholderText(/ingresa la descripción/i), { target: { value: 'Descripción de prueba necesaria' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'departamento' } });
    });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // --- PASO 2: Llenar y avanzar ---
    const inputDir = await screen.findByPlaceholderText(/ingresar dirección/i);
    await act(async () => {
      fireEvent.change(inputDir, { target: { value: 'Calle Falsa 123' } });
      fireEvent.change(screen.getByPlaceholderText(/ingresar referencia del lugar/i), { target: { value: 'Cerca de EPN' } });
    });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // --- PASO 3: Esperar carga y llenar ---
    // Si spinbutton falla, probamos con todos los campos de texto disponibles
    const inputs = await screen.findAllByRole('textbox'); 
    await act(async () => {
      // Intentamos cambiar el primero y segundo encontrado
      if (inputs.length >= 1) fireEvent.change(inputs[0], { target: { value: '2' } });
      if (inputs.length >= 2) fireEvent.change(inputs[1], { target: { value: '1' } });
    });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // --- PASO 4: Avanzar ---
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // --- PASO 5: Avanzar ---
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    // --- PASO 6: Verificar Resumen ---
    await waitFor(() => {
      // Buscamos un texto que solo aparezca en el resumen
      expect(screen.getByText(/resumen/i)).toBeDefined();
    }, { timeout: 3000 });
  });
});