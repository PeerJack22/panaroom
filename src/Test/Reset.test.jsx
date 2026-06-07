import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Reset from '../pages/Reset';
import axios from 'axios';

vi.mock('axios');

vi.mock('../assets/passwordRecovery.jpg', () => ({
  default: 'test-image.jpg',
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
    dismiss: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({
    token: 'token123',
    rol: 'estudiante',
  }),
}));

describe('Reset', () => {
  test('Debe mostrar el formulario cuando el token es válido', async () => {
    axios.get.mockResolvedValueOnce({ data: { msg: 'Token válido' } });

    render(<Reset />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ingresa tu nueva contraseña')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText('Repite tu contraseña')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Enviar/i })
    ).toBeInTheDocument();
  });

  test('Debe mostrar errores cuando los campos están vacíos', async () => {
    axios.get.mockResolvedValueOnce({ data: { msg: 'Token válido' } });

    render(<Reset />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ingresa tu nueva contraseña')
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Enviar/i })
    );

    expect(
      await screen.findByText('La contraseña es obligatoria')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('La confirmación es obligatoria')
    ).toBeInTheDocument();
  });
});