import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Users from './Users';

// 1. Mock de Axios
vi.mock('axios');

// 2. Mock de react-router-dom (useNavigate)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 3. Mock de variables de entorno
vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:api');

// 4. Datos ficticios (Mock Data) para simular la respuesta de la API
const mockUsersData = [
  {
    _id: 'arrendatario-1',
    nombre: 'Geralt',
    apellido: 'de Rivia',
    email: 'geralt@kaermorhen.com',
    celular: '0999999999',
    rol: 'arrendatario',
    confirmEmail: true,
    imagenesDocumentos: ['http://imagen.com/doc1.jpg']
  }
];

const mockEstudiantesData = [
  {
    _id: 'estudiante-1',
    nombre: 'Ciri',
    apellido: 'Fiona',
    email: 'ciri@cintra.com',
    celular: '0888888888',
    rol: 'estudiante',
    confirmEmail: false
  }
];

// Simulamos que el arrendatario 1 está en la lista de no confirmados por el admin
const mockNoConfirmadosData = [{ _id: 'arrendatario-1' }];
const mockDepartamentosData = [];

describe('Pruebas unitarias e integración para componente Users', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Configurar LocalStorage ficticio para el token de autenticación
    const mockToken = { state: { token: 'fake-token-123' } };
    Storage.prototype.getItem = vi.fn(() => JSON.stringify(mockToken));

    // Configurar las respuestas por defecto de Axios de manera secuencial
    axios.get.mockImplementation((url) => {
      if (url.includes('/listarArrendatarios')) return Promise.resolve({ data: mockUsersData });
      if (url.includes('/estudiantes')) return Promise.resolve({ data: mockEstudiantesData });
      if (url.includes('/arrendatarios/noconfirmados')) return Promise.resolve({ data: mockNoConfirmadosData });
      if (url.includes('/departamentos')) return Promise.resolve({ data: mockDepartamentosData });
      return Promise.resolve({ data: [] });
    });
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <Users />
    </BrowserRouter>
  );

  // --- PRUEBA 1: Renderizado y Carga de Datos ---
  test('debería renderizar la lista de usuarios correctamente tras cargar la API', async () => {
    renderComponent();

    // Esperar a que desaparezca el spinner de carga y aparezcan los nombres
    await waitFor(() => {
      expect(screen.getByText('Geralt de Rivia')).toBeInTheDocument();
      expect(screen.getByText('Ciri Fiona')).toBeInTheDocument();
    });
  });

  // --- PRUEBA 2: Modal de Detalle de Estudiante ---
  test('debería abrir y cerrar el modal de detalle de un Estudiante', async () => {
    renderComponent();
    
    await waitFor(() => screen.getByText('Ciri Fiona'));

    // Buscar el botón de información (MdInfo) de Ciri. 
    // Como hay múltiples botones con MdInfo, los filtramos por posición o un contenedor.
    const botonesInfo = screen.getAllByTitle('Ver detalles');
    
    // El segundo usuario renderizado es el estudiante (Ciri)
    fireEvent.click(botonesInfo[1]);

    // Verificar que el modal se abrió y muestra los títulos del Portal
    expect(screen.getByText('Información del Estudiante')).toBeInTheDocument();
    expect(screen.getByText('ciri@cintra.com')).toBeInTheDocument();

    // Cerrar el modal mediante el botón "Close"
    const botonCerrar = screen.getByRole('button', { name: '' }); // El icono MdClose
    fireEvent.click(botonCerrar);

    // Verificar que el modal ya no está en el documento
    expect(screen.queryByText('Información del Estudiante')).not.toBeInTheDocument();
  });

  // --- PRUEBA 3: Modal de Detalle de Arrendatario ---
  test('debería abrir el modal de detalle del Arrendatario y visualizar sus documentos', async () => {
    renderComponent();

    await waitFor(() => screen.getByText('Geralt de Rivia'));

    const botonesInfo = screen.getAllByTitle('Ver detalles');
    fireEvent.click(botonesInfo[0]); // Primer usuario (Geralt)

    // Verificar apertura del portal de arrendatarios
    expect(screen.getByText('Detalle del arrendatario')).toBeInTheDocument();
    expect(screen.getByText('Documentos subidos')).toBeInTheDocument();

    // Cerrar modal desde el botón de texto "Cerrar"
    const botonCerrarTexto = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.click(botonCerrarTexto);

    expect(screen.queryByText('Detalle del arrendatario')).not.toBeInTheDocument();
  });

  // --- PRUEBA 4: Interactividad del Modal de Rechazo ---
  test('debería abrir el modal de rechazo, validar la longitud del texto y enviar la solicitud', async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    renderComponent();

    await waitFor(() => screen.getByText('Geralt de Rivia'));

    // Al estar marcado como "no confirmado", debe aparecer el botón "Rechazar"
    const botonRechazar = screen.getByRole('button', { name: 'Rechazar' });
    fireEvent.click(botonRechazar);

    // Verificar apertura de modal de rechazo
    expect(screen.getByText('Rechazar solicitud')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Ej: Los documentos de identidad no son legibles/i);
    const botonConfirmar = screen.getByRole('button', { name: 'Confirmar rechazo' });

    // El botón debe estar deshabilitado inicialmente porque el texto tiene 0 caracteres (mínimo es 20)
    expect(botonConfirmar).toBeDisabled();

    // Escribir un motivo válido (más de 20 caracteres)
    fireEvent.change(textarea, { target: { value: 'Los documentos adjuntos no son legibles en lo absoluto.' } });

    // Ahora el botón debería habilitarse
    expect(botonConfirmar).not.toBeDisabled();

    // Simular el clic de confirmación
    fireEvent.click(botonConfirmar);

    // Verificar que axios llamó al endpoint de eliminación correcto
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/administrador/eliminar-arrendatario/arrendatario-1'),
        expect.any(Object)
      );
    });
  });
});