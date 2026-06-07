import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";

import Users from "../pages/Users";
import axios from "axios";

// MOCKS
vi.mock("axios");

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../utils/swal", () => ({
  confirm: vi.fn().mockResolvedValue(true),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Users - filtros y visualización", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    localStorage.setItem(
      "auth-token",
      JSON.stringify({
        state: {
          token: "token-test",
        },
      })
    );

    axios.get.mockImplementation((url) => {
      if (url.includes("listarArrendatarios")) {
        return Promise.resolve({
          data: [
            {
              _id: "1",
              nombre: "Juan",
              apellido: "Perez",
              email: "juan@test.com",
              celular: "099999999",
              rol: "arrendatario",
              confirmEmail: true,
              imagenesDocumentos: [],
            },
            {
              _id: "2",
              nombre: "Maria",
              apellido: "Lopez",
              email: "maria@test.com",
              celular: "088888888",
              rol: "arrendatario",
              confirmEmail: false,
              imagenesDocumentos: [],
            },
          ],
        });
      }

      if (url.includes("/estudiantes")) {
        return Promise.resolve({
          data: [
            {
              _id: "3",
              nombre: "Carlos",
              apellido: "Ramirez",
              email: "carlos@test.com",
              celular: "077777777",
              rol: "estudiante",
              confirmEmail: true,
            },
          ],
        });
      }

      if (url.includes("noconfirmados")) {
        return Promise.resolve({
          data: [
            {
              _id: "2",
            },
          ],
        });
      }

      if (url.includes("/departamentos")) {
        return Promise.resolve({
          data: [],
        });
      }

      return Promise.resolve({ data: [] });
    });
  });

  it("renderiza usuarios", async () => {
    render(<Users />);

    expect(await screen.findByText(/Juan Perez/i)).toBeInTheDocument();
    expect(screen.getByText(/Maria Lopez/i)).toBeInTheDocument();
    expect(screen.getByText(/Carlos Ramirez/i)).toBeInTheDocument();
  });

  it("filtra por nombre", async () => {
    render(<Users />);

    await screen.findByText(/Juan Perez/i);

    const input = screen.getByPlaceholderText(
      /Filtrar por nombre/i
    );

    fireEvent.change(input, {
      target: { value: "Juan" },
    });

    expect(screen.getByText(/Juan Perez/i)).toBeInTheDocument();

    expect(
      screen.queryByText(/Maria Lopez/i)
    ).not.toBeInTheDocument();
  });

  it("filtra por rol estudiante", async () => {
    render(<Users />);

    await screen.findByText(/Juan Perez/i);

    const select = screen.getByRole("combobox");

    fireEvent.change(select, {
      target: { value: "estudiante" },
    });

    expect(
      screen.getByText(/Carlos Ramirez/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/Juan Perez/i)
    ).not.toBeInTheDocument();
  });

  it("filtra solo arrendatarios no confirmados", async () => {
    render(<Users />);

    await screen.findByText(/Juan Perez/i);

    const checkbox = screen.getByLabelText(
      /Solo arrendatarios no confirmados/i
    );

    fireEvent.click(checkbox);

    expect(
      screen.getByText(/Maria Lopez/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/Juan Perez/i)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(/Carlos Ramirez/i)
    ).not.toBeInTheDocument();
  });

  it("abre modal de detalles", async () => {
    render(<Users />);

    await screen.findByText(/Juan Perez/i);

    const botonesInfo = screen.getAllByTitle(
      /Ver detalles/i
    );

    fireEvent.click(botonesInfo[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/Detalle del arrendatario/i)
      ).toBeInTheDocument();
    });
  });
});