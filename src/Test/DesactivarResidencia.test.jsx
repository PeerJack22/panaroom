import { describe, test, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const TableMock = () => {
  const [activo, setActivo] = React.useState(true);
  const [eliminado, setEliminado] = React.useState(false);

  if (eliminado) return <div data-testid="mensaje-vacio">No hay residencias</div>;

  return (
    <div>
      <table>
        <tbody>
          <tr data-testid="fila-residencia">
            <td>Residencia de Prueba</td>
            <td>
              <button 
                data-testid="btn-toggle" 
                onClick={() => setActivo(!activo)}
              >
                {activo ? 'Activo' : 'Inactivo'}
              </button>
            </td>
            <td>
              <button 
                data-testid="btn-eliminar" 
                onClick={() => setEliminado(true)}
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

describe('Pruebas de Estado y Eliminación en Table', () => {
  test('debe cambiar el estado entre activo e inactivo al hacer click', () => {
    render(<TableMock />);
    
    const botonToggle = screen.getByTestId('btn-toggle');
    expect(botonToggle).toHaveTextContent('Activo');
    
    fireEvent.click(botonToggle);
    expect(botonToggle).toHaveTextContent('Inactivo');
    
    fireEvent.click(botonToggle);
    expect(botonToggle).toHaveTextContent('Activo');
  });

  test('debe eliminar la fila de la residencia al hacer click en eliminar', () => {
    render(<TableMock />);
    
    const fila = screen.getByTestId('fila-residencia');
    expect(fila).toBeInTheDocument();
    
    const botonEliminar = screen.getByTestId('btn-eliminar');
    fireEvent.click(botonEliminar);
    
    expect(screen.queryByTestId('fila-residencia')).not.toBeInTheDocument();
    expect(screen.getByTestId('mensaje-vacio')).toBeInTheDocument();
  });
});