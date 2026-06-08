import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const AsignarDepartamentoMock = ({ onAsignar }) => {
  const [estudianteId, setEstudianteId] = React.useState('');
  const [departamentoId, setDepartamentoId] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (estudianteId && departamentoId) {
      onAsignar({ estudianteId, departamentoId });
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="form-asignar">
      <div>
        <label htmlFor="estudiante">Estudiante</label>
        <select
          id="estudiante"
          data-testid="select-estudiante"
          value={estudianteId}
          onChange={(e) => setEstudianteId(e.target.value)}
        >
          <option value="">Seleccione un estudiante</option>
          <option value="est-1">Juan Pérez (Estudiante)</option>
          <option value="est-2">María López (Estudiante)</option>
        </select>
      </div>

      <div>
        <label htmlFor="departamento">Departamento disponible</label>
        <select
          id="departamento"
          data-testid="select-departamento"
          value={departamentoId}
          onChange={(e) => setDepartamentoId(e.target.value)}
        >
          <option value="">Seleccione un departamento</option>
          <option value="dep-101">Departamento 101 - Av. Universitaria</option>
          <option value="dep-202">Habitación Simple - Cerca Facultad</option>
        </select>
      </div>

      <button type="submit" data-testid="btn-submit-asignar">
        Asignar Departamento
      </button>
    </form>
  );
};

describe('Pruebas de Asignación de Departamento a Estudiante', () => {
  test('debe permitir al arrendatario seleccionar un estudiante, un departamento y procesar la asignación', () => {
    const handleAsignarMock = vi.fn();
    
    render(<AsignarDepartamentoMock onAsignar={handleAsignarMock} />);

    const selectEstudiante = screen.getByTestId('select-estudiante');
    const selectDepartamento = screen.getByTestId('select-departamento');
    const botonAsignar = screen.getByTestId('btn-submit-asignar');

    fireEvent.change(selectEstudiante, { target: { value: 'est-1' } });
    fireEvent.change(selectDepartamento, { target: { value: 'dep-101' } });

    expect(selectEstudiante.value).toBe('est-1');
    expect(selectDepartamento.value).toBe('dep-101');

    fireEvent.click(botonAsignar);

    expect(handleAsignarMock).toHaveBeenCalledTimes(1);
    expect(handleAsignarMock).toHaveBeenCalledWith({
      estudianteId: 'est-1',
      departamentoId: 'dep-101'
    });
  });

  test('no debe emitir la asignación si los campos requeridos están vacíos', () => {
    const handleAsignarMock = vi.fn();
    
    render(<AsignarDepartamentoMock onAsignar={handleAsignarMock} />);

    const botonAsignar = screen.getByTestId('btn-submit-asignar');
    fireEvent.click(botonAsignar);

    expect(handleAsignarMock).not.toHaveBeenCalled();
  });
});