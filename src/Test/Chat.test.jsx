import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Chat from "../pages/Chat";
import axios from "axios";

vi.mock("axios");

vi.mock("../context/storeAuth", () => ({
  default: () => ({
    rol: "estudiante",
    token: "token",
    user: {
      _id: "123",
      nombre: "Jordy",
      apellido: "Cisneros",
    },
  }),
}));

vi.mock("socket.io-client", () => ({
  io: () => ({
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("Chat", () => {
  it("renderiza el módulo de chat", async () => {
    axios.get.mockResolvedValue({
      data: [],
    });

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>
    );

    expect(
      screen.getByText("Chat")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/comunicación directa/i)
    ).toBeInTheDocument();
  });
});