import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Home } from '../pages/Home';
import { expect, test, vi } from 'vitest';
import axios from 'axios';
import storeAuth from '../context/storeAuth';

// Mock axios para evitar llamadas de red reales
vi.mock('axios');

// Mock storeAuth (Zustand)
vi.mock('../context/storeAuth', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    token: null, // Puedes cambiar esto a un token mock si necesitas probar estados de autenticación
    setToken: vi.fn(),
    setRol: vi.fn(),
    setUser: vi.fn(),
  })),
}));

// Mock react-router-dom para manejar la navegación y los enlaces
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
    // Mock de Link para que se renderice como un <a> tag
    Link: vi.fn(({ children, to, ...props }) => <a href={to} {...props}>{children}</a>),
  };
});

// Mock de Swiper y sus módulos para evitar errores de DOM en JSDOM
vi.mock('swiper/react', () => ({
  Swiper: vi.fn(({ children }) => <div data-testid="swiper-mock">{children}</div>),
  SwiperSlide: vi.fn(({ children }) => <div data-testid="swiper-slide-mock">{children}</div>),
}));

vi.mock('swiper/modules', () => ({
  Autoplay: vi.fn(),
  Pagination: vi.fn(),
}));

// Mock de los archivos CSS de Swiper
vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/pagination', () => ({}));

// Mock del hook useFetch
vi.mock('../hooks/useFetch', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    fetchDataBackend: vi.fn(),
  })),
}));

// Mock de las importaciones de imágenes para evitar errores de carga en JSDOM
vi.mock('../assets/logo_proyecto.png', () => ({ default: 'test-logo-path' }));
vi.mock('/images/quito.webp', () => ({ default: 'test-image-path' }));
vi.mock('/images/chico_laptop.webp', () => ({ default: 'test-image-path' }));

test('El componente Home se renderiza correctamente y muestra el título principal y la navegación', async () => {
  // Configurar los mocks de axios para las llamadas que hace Home
  axios.get.mockImplementation((url) => {
    if (url.includes('/public/departamentoInfo')) {
      return Promise.resolve({ data: [] }); // Simula que no hay propiedades inicialmente
    }
    if (url.includes('/departamento/comentarios/')) {
      return Promise.resolve({ data: { comentarios: [] } }); // Simula que no hay comentarios
    }
    return Promise.reject(new Error('Solicitud axios no manejada: ' + url));
  });

  // Envolvemos el render y las esperas iniciales en act para manejar las actualizaciones de estado asíncronas
  await act(async () => {
    render(<BrowserRouter><Home /></BrowserRouter>);
  });

  // Verifica que el título principal esté en el documento
  expect(screen.getByRole('heading', { name: /Encuentra tu residencia ideal/i })).toBeInTheDocument();

  // CORRECCIÓN: Registrarse e Iniciar Sesión son botones en tu código, no enlaces
  expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  
  // Este sí es un enlace (Link)
  expect(screen.getByRole('link', { name: /Publicar residencias/i })).toBeInTheDocument();

  // Verifica que la sección "Acerca de PanaRoom" esté presente
  expect(screen.getByRole('heading', { name: /Acerca de PanaRoom/i })).toBeInTheDocument();

  // Verifica que la sección "Residencias disponibles" esté presente
  expect(screen.getByRole('heading', { name: /Residencias disponibles/i })).toBeInTheDocument();

  // Espera a que el mensaje de "No hay resultados" aparezca, lo que indica que la carga de datos ha finalizado
  await screen.findByText(/No hay resultados con esos filtros/i);
});
