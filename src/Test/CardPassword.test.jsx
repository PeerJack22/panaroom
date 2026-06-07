import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import CardPassword from '../components/profile/CardPassword';

const mockUpdatePasswordProfile = vi.fn();
const mockClearToken = vi.fn();

vi.mock('../context/storeProfile', () => ({
  default: vi.fn(() => ({
    user: {
      _id: '123',
    },
    updatePasswordProfile: mockUpdatePasswordProfile,
  })),
}));

vi.mock('../context/storeAuth', () => ({
  default: vi.fn(() => ({
    clearToken: mockClearToken,
  })),
}));

describe('CardPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Debe renderizar correctamente el formulario', () => {
    render(<CardPassword />);

    expect(
      screen.getByText('Actualizar contraseña')
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('Ingresa tu contraseña actual')
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('Ingresa la nueva contraseña')
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue('Cambiar')
    ).toBeInTheDocument();
  });

  test('Debe mostrar errores cuando los campos están vacíos', async () => {
    render(<CardPassword />);

    fireEvent.click(screen.getByDisplayValue('Cambiar'));

    expect(
      await screen.findByText('La contraseña actual es obligatoria')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('La nueva contraseña es obligatoria')
    ).toBeInTheDocument();
  });

  test('Debe actualizar la contraseña correctamente', async () => {
    mockUpdatePasswordProfile.mockResolvedValueOnce(true);

    render(<CardPassword />);

    fireEvent.change(
      screen.getByPlaceholderText('Ingresa tu contraseña actual'),
      {
        target: { value: 'Password123!' },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText('Ingresa la nueva contraseña'),
      {
        target: { value: 'NuevaPass123!' },
      }
    );

    fireEvent.click(screen.getByDisplayValue('Cambiar'));

    await waitFor(() => {
      expect(mockUpdatePasswordProfile).toHaveBeenCalledWith(
        {
          passwordactual: 'Password123!',
          passwordnuevo: 'NuevaPass123!',
        },
        '123'
      );

      expect(mockClearToken).toHaveBeenCalled();
    });
  });

  test('No debe ejecutar clearToken si updatePasswordProfile falla', async () => {
    mockUpdatePasswordProfile.mockResolvedValueOnce(false);

    render(<CardPassword />);

    fireEvent.change(
      screen.getByPlaceholderText('Ingresa tu contraseña actual'),
      {
        target: { value: 'Password123!' },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText('Ingresa la nueva contraseña'),
      {
        target: { value: 'NuevaPass123!' },
      }
    );

    fireEvent.click(screen.getByDisplayValue('Cambiar'));

    await waitFor(() => {
      expect(mockUpdatePasswordProfile).toHaveBeenCalled();
      expect(mockClearToken).not.toHaveBeenCalled();
    });
  });
});