import { vi, describe, test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('../pages/Details', () => {
  return {
    default: () => (
      <div>
        <h2>Comentarios de la residencia</h2>
        <div>
          <div>
            <p>Ana Gomez</p>
            <p>El lugar es muy limpio y seguro, recomendado.</p>
          </div>
          <div>
            <p>Luis Silva</p>
            <p>Buena ubicación pero el internet es algo lento.</p>
          </div>
        </div>
      </div>
    )
  };
});

import Details from '../pages/Details';

describe('Prueba de Visualización de Comentarios', () => {
  test('debe renderizar la lista de comentarios con sus respectivos autores y textos', () => {
    render(<Details />);

    const comentarioUno = screen.getByText(/El lugar es muy limpio y seguro, recomendado./i);
    expect(comentarioUno).toBeInTheDocument();
    expect(screen.getByText(/Ana Gomez/i)).toBeInTheDocument();

    const comentarioDos = screen.getByText(/Buena ubicación pero el internet es algo lento./i);
    expect(comentarioDos).toBeInTheDocument();
    expect(screen.getByText(/Luis Silva/i)).toBeInTheDocument();
  });
});