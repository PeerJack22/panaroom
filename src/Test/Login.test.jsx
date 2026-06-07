import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { toast } from 'react-toastify';
import Login from '../pages/Login';

// ======================
// Mocks compartidos
// ======================
const mockSetToken = vi.fn();
const mockSetRol = vi.fn();
const mockSetUser = vi.fn();

vi.mock('axios');

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
    dismiss: vi.fn(),
  },
}));

vi.mock('../context/storeAuth', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    setToken: mockSetToken,
    setRol: mockSetRol,
    setUser: mockSetUser,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('Debe mostrar errores si los campos están vacíos al intentar ingresar', async () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  fireEvent.click(
    screen.getByRole('button', {
      name: /Iniciar sesión/i,
    })
  );

  expect(
    await screen.findByText(/El correo es obligatorio/i)
  ).toBeInTheDocument();

  expect(
    await screen.findByText(/La contraseña es obligatoria/i)
  ).toBeInTheDocument();
});

test('Debe iniciar sesión correctamente como estudiante y guardar la información', async () => {
  axios.post.mockResolvedValueOnce({
    data: {
      token: 'token-falso-123',
      rol: 'estudiante',
      _id: 'id123',
      nombre: 'Juan',
      apellido: 'Pérez',
      direccion: 'Quito',
      celular: '0999999999',
    },
  });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: 'estudiante' },
  });

  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu correo/i), {
    target: { value: 'juan@test.com' },
  });

  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu contraseña/i), {
    target: { value: 'Password123!' },
  });

  fireEvent.click(
    screen.getByRole('button', {
      name: /Iniciar sesión/i,
    })
  );

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalled();
  });

  await waitFor(() => {
    expect(mockSetToken).toHaveBeenCalledWith('token-falso-123');
  });

  await waitFor(() => {
    expect(mockSetRol).toHaveBeenCalledWith('estudiante');
  });

  await waitFor(() => {
    expect(mockSetUser).toHaveBeenCalledWith({
      _id: 'id123',
      nombre: 'Juan',
      apellido: 'Pérez',
      direccion: 'Quito',
      celular: '0999999999',
    });
  });

  expect(toast.dismiss).toHaveBeenCalled();
});

test('Debe mostrar un mensaje de error si las credenciales son incorrectas', async () => {
  axios.post.mockRejectedValueOnce({
    response: {
      data: {
        msg: 'Credenciales inválidas',
      },
    },
  });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu correo/i), {
    target: { value: 'error@test.com' },
  });

  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu contraseña/i), {
    target: { value: 'wrongpass' },
  });

  fireEvent.click(
    screen.getByRole('button', {
      name: /Iniciar sesión/i,
    })
  );

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Credenciales inválidas');
  });
});