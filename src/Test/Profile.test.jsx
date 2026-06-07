import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Profile from '../pages/Profile';

// Mock del store
vi.mock('../context/storeProfile', () => ({
  default: vi.fn(() => ({
    user: {
      _id: '1',
      nombre: 'Juan',
      apellido: 'Pérez',
      direccion: 'Quito',
      celular: '0999999999',
      email: 'juan@test.com',
      avatarUrl: 'https://test.com/avatar.jpg',
    },
  })),
}));

// Mock de CardPassword
vi.mock('../components/profile/CardPassword', () => ({
  default: () => (
    <div data-testid="card-password">
      Cambio de contraseña
    </div>
  ),
}));

// Mock de FormProfile
vi.mock('../components/profile/FormProfile', () => ({
  default: () => (
    <div data-testid="form-profile">
      Formulario de edición de perfil
    </div>
  ),
}));

describe('Profile', () => {
  test('Debe renderizar correctamente el módulo de perfil', () => {
    render(<Profile />);

    // Título y descripción
    expect(screen.getByText('Perfil')).toBeInTheDocument();

    expect(
      screen.getByText(
        /Este módulo te permite gestionar el perfil del usuario/i
      )
    ).toBeInTheDocument();

    // Datos del usuario (CardProfile real)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Quito')).toBeInTheDocument();
    expect(screen.getByText('0999999999')).toBeInTheDocument();
    expect(screen.getByText('juan@test.com')).toBeInTheDocument();

    // Componentes del módulo
    expect(screen.getByTestId('card-password')).toBeInTheDocument();
    expect(screen.getByTestId('form-profile')).toBeInTheDocument();

    // Imagen de perfil
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});