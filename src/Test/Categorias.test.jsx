import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import Table from "../components/list/Table";

// ====================================
// MOCKS
// ====================================

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockFetchDataBackend = vi.fn().mockResolvedValue([
  {
    _id: "1",
    titulo: "Suite Norte",
    descripcion: "Suite amoblada",
    direccion: "Quito Norte",
    precioMensual: 250,
    categoria: "suit",
    disponible: true,
    numeroHabitaciones: 1,
    numeroBanos: 1,
    imagenes: [{ url: "test.jpg" }],
  },
  {
    _id: "2",
    titulo: "Departamento Sur",
    descripcion: "Departamento amplio",
    direccion: "Quito Sur",
    precioMensual: 400,
    categoria: "departamento",
    disponible: true,
    numeroHabitaciones: 3,
    numeroBanos: 2,
    imagenes: [{ url: "test2.jpg" }],
  },
]);

vi.mock("../hooks/useFetch", () => ({
  default: () => ({
    fetchDataBackend: mockFetchDataBackend,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// ====================================
// TESTS
// ====================================

describe("Filtros Table", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    localStorage.setItem(
      "auth-token",
      JSON.stringify({
        state: {
          token: "token-test",
          rol: "administrador",
          user: {
            _id: "123",
          },
        },
      })
    );
  });

  it("renderiza departamentos", async () => {
    render(<Table />);

    expect(await screen.findByText("Suite Norte")).toBeInTheDocument();
    expect(await screen.findByText("Departamento Sur")).toBeInTheDocument();
  });

  it("filtra por titulo", async () => {
    render(<Table />);

    await screen.findByText("Suite Norte");

    const input = screen.getByPlaceholderText(
      "Filtrar por título"
    );

    fireEvent.change(input, {
      target: { value: "Suite" },
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Departamento Sur")
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("Suite Norte")).toBeInTheDocument();
  });

  it("filtra por categoria", async () => {
    render(<Table />);

    await screen.findByText("Suite Norte");

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[1], {
      target: {
        value: "departamento",
      },
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Suite Norte")
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByText("Departamento Sur")
    ).toBeInTheDocument();
  });

  it("limpia filtros", async () => {
    render(<Table />);

    await screen.findByText("Suite Norte");

    const input = screen.getByPlaceholderText(
      "Filtrar por título"
    );

    fireEvent.change(input, {
      target: {
        value: "Suite",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /limpiar filtros/i,
      })
    );

    expect(input.value).toBe("");
  });
});