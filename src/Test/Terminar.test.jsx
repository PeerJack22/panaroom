import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const TerminarContratoMock = ({ onTerminarContrato }) => {
  const [contratoActivo, setContratoActivo] = React.useState(true);

  const handleTerminar = () => {
    setContratoActivo(false);
    onTerminarContrato();
  };

  return (
    <div>
      <h2>Gestión de Alquiler</h2>
      <p>Estado del contrato: <span data-testid="estado-contrato">{contratoActivo ? 'Vigente' : 'Finalizado'}</span></p>
      
      <button
        data-testid="btn-terminar-contrato"
        onClick={handleTerminar}
        disabled={!contratoActivo}
        className="px-4 py-2 bg-red-600 text-white rounded-xl disabled:bg-gray-400"
      >
        Terminar Contrato
      </button>
    </div>
  );
};

describe('Pruebas para el botón de Terminar Contrato', () => {
  test('debe finalizar el contrato y deshabilitar el botón al hacer click', () => {
    const handleTerminarMock = vi.fn();

    render(<TerminarContratoMock onTerminarContrato={handleTerminarMock} />);

    const boton = screen.getByTestId('btn-terminar-contrato');
    const estado = screen.getByTestId('estado-contrato');

    expect(estado).toHaveTextContent('Vigente');
    expect(boton).not.toBeDisabled();

    fireEvent.click(boton);

    expect(estado).toHaveTextContent('Finalizado');
    expect(boton).toBeDisabled();
    expect(handleTerminarMock).toHaveBeenCalledTimes(1);
  });
});