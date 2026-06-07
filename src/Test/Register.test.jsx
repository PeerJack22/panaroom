import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Register } from '../pages/Register';
import { expect, test, vi } from 'vitest';
import axios from 'axios';
import { toast } from 'react-toastify';

// Mock de axios para controlar las peticiones post
vi.mock('axios');

// Mock de react-toastify para verificar los mensajes de éxito/error
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock de react-router (Register usa Link de 'react-router')
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Link: vi.fn(({ children, to, ...props }) => <a href={to} {...props}>{children}</a>),
  };
});

// Mock de la imagen lateral
vi.mock('/images/apartamento1.webp', () => ({ default: 'test-image-path' }));

test('Debe mostrar errores de validación si se intenta registrar con campos vacíos', async () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  const submitButton = screen.getByRole('button', { name: /Registrarse/i });
  fireEvent.click(submitButton);

  // Verificamos que aparezcan los mensajes de error definidos en el register de react-hook-form
  expect(await screen.findByText(/El nombre es obligatorio/i)).toBeInTheDocument();
  expect(await screen.findByText(/El apellido es obligatorio/i)).toBeInTheDocument();
  expect(await screen.findByText(/La dirección es obligatoria/i)).toBeInTheDocument();
  expect(await screen.findByText(/El celular es obligatorio/i)).toBeInTheDocument();
  expect(await screen.findByText(/El correo electrónico es obligatorio/i)).toBeInTheDocument();
  expect(await screen.findByText(/La contraseña es obligatoria/i)).toBeInTheDocument();
});

test('Debe enviar los datos correctamente y mostrar mensaje de éxito al completar el formulario', async () => {
  // Simulamos una respuesta exitosa del servidor
  axios.post.mockResolvedValueOnce({ data: { msg: 'Usuario registrado correctamente' } });

  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  // Llenamos los campos del formulario
  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu nombre/i), { target: { value: 'Marta' } });
  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu apellido/i), { target: { value: 'Sánchez' } });
  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu dirección de domicilio/i), { target: { value: 'Av. Amazonas' } });
  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu celular/i), { target: { value: '0912345678' } });
  fireEvent.change(screen.getByPlaceholderText(/Ingresa tu correo electrónico/i), { target: { value: 'marta@test.com' } });
  fireEvent.change(screen.getByPlaceholderText(/Crea una contraseña segura/i), { target: { value: 'Marta123!' } });

  const submitButton = screen.getByRole('button', { name: /Registrarse/i });
  fireEvent.click(submitButton);

  // Esperamos a que se llame a axios.post con la URL y los datos correctos
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/registroEstudiante'),
      expect.objectContaining({ nombre: 'Marta', email: 'marta@test.com' })
    );
  });

  // Verificamos que se muestre el toast de éxito
  expect(toast.success).toHaveBeenCalledWith('Usuario registrado correctamente');
});