import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Feedback from "../pages/Feedback";
import axios from "axios";

vi.mock("axios");

vi.mock("../context/storeAuth", () => ({
  default: () => ({
    rol: "administrador",
    token: "fake-token",
  }),
}));

describe("Feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra las quejas pendientes por defecto", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          tipo: "queja",
          descripcion: "Queja pendiente",
          estado: false,
        },
        {
          _id: "2",
          tipo: "queja",
          descripcion: "Queja revisada",
          estado: true,
        },
      ],
    });

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    expect(
      await screen.findByText("Queja pendiente")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Queja revisada")
    ).not.toBeInTheDocument();
  });

  it("muestra las quejas revisadas al cambiar el filtro", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          tipo: "queja",
          descripcion: "Pendiente",
          estado: false,
        },
        {
          _id: "2",
          tipo: "queja",
          descripcion: "Revisada",
          estado: true,
        },
      ],
    });

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    const botonRevisados = await screen.findByRole("button", {
      name: /revisados/i,
    });

    fireEvent.click(botonRevisados);

    expect(
      await screen.findByText("Revisada")
    ).toBeInTheDocument();
  });

  it("muestra el botón responder cuando la queja no tiene respuesta", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          tipo: "queja",
          descripcion: "Problema con la residencia",
          estado: false,
        },
      ],
    });

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("button", {
        name: /responder/i,
      })
    ).toBeInTheDocument();
  });

  it("abre el modal al presionar responder", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          tipo: "queja",
          descripcion: "Problema de prueba",
          estado: false,
        },
      ],
    });

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    const botonResponder = await screen.findByRole("button", {
      name: /responder/i,
    });

    fireEvent.click(botonResponder);

    expect(
      screen.getByText(/tu respuesta/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /enviar/i,
      })
    ).toBeInTheDocument();
  });

  it("muestra los contadores de pendientes y revisados", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          tipo: "queja",
          descripcion: "Pendiente",
          estado: false,
        },
        {
          _id: "2",
          tipo: "queja",
          descripcion: "Revisada",
          estado: true,
        },
      ],
    });

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Pendientes \(1\)/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Revisados \(1\)/i)
    ).toBeInTheDocument();
  });

  it("muestra mensaje cuando no existen registros", async () => {
    axios.get.mockResolvedValueOnce({
      data: [],
    });

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/No existen registros para mostrar/i)
    ).toBeInTheDocument();
  });
});