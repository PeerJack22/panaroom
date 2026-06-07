import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Details from "../pages/Details";
import useFetch from "../hooks/useFetch";

// Mocks previos iguales...
vi.mock("../hooks/useFetch");
vi.mock("../context/storeAuth", () => ({
  default: () => ({ 
    rol: "estudiante", 
    user: { _id: "st_123", nombre: "Test", apellido: "User" },
    token: "fake-token"
  }),
}));

// Mock Leaflet, Swiper y Router (mismos que ya tenías)
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div />,
  Marker: () => <div />,
}));
vi.mock('swiper/react', () => ({
  Swiper: ({ children }) => <div data-testid="swiper-mock">{children}</div>,
  SwiperSlide: ({ children }) => <div data-testid="swiper-slide-mock">{children}</div>,
}));
vi.mock('swiper/modules', () => ({ Autoplay: {}, Pagination: {}, Navigation: {} }));
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useParams: () => ({ id: "123" }) };
});

describe("Details - Visualización de información completa", () => {
  const mockDepartamento = {
    _id: "123",
    titulo: "Departamento Acogedor",
    precioMensual: "300",
    descripcion: "Hermoso lugar cerca de la EPN",
    direccion: "Av. Ladrón de Guevara",
    numeroHabitaciones: 2,
    numeroBanos: 1,
    parqueadero: true,
    serviciosIncluidos: ["Luz", "Agua", "Internet"],
    arrendatario: "propietario_123" // ID del arrendatario
  };

  const mockPropietario = {
    _id: "propietario_123",
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@test.com",
    celular: "0999999999"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // MOCK INTELIGENTE: Responder según la URL solicitada
    const fetchDataBackend = vi.fn().mockImplementation((url) => {
      if (url.includes("/departamento/123")) return Promise.resolve(mockDepartamento);
      if (url.includes("/arrendatario/")) return Promise.resolve(mockPropietario);
      if (url.includes("/listararrendatarios")) return Promise.resolve([mockPropietario]);
      return Promise.resolve([]);
    });

    useFetch.mockReturnValue({ fetchDataBackend });
    Storage.prototype.getItem = vi.fn(() => JSON.stringify({ state: { token: "fake-token" } }));
  });

  it("debería mostrar toda la información del departamento y propietario", async () => {
    render(
      <MemoryRouter initialEntries={["/details/123"]}>
        <Routes>
          <Route path="/details/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );

    // Usamos waitFor para esperar a que los efectos asíncronos terminen
    await waitFor(() => {
      expect(screen.getByText(/Departamento Acogedor/i)).toBeInTheDocument();
    });

    // Verificaciones
    expect(screen.getByText(/\$ 300/i)).toBeInTheDocument();
    expect(screen.getByText(/Av. Ladrón de Guevara/i)).toBeInTheDocument();
    
    // Servicios
    expect(screen.getByText("Luz")).toBeInTheDocument();
    expect(screen.getByText("Agua")).toBeInTheDocument();

    // Información del Propietario (que requiere la segunda llamada mockeada)
    expect(await screen.findByText(/Juan Pérez/i)).toBeInTheDocument();
    expect(screen.getByText(/juan@test.com/i)).toBeInTheDocument();
  });
});