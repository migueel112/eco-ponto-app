// Entidade Estado (sigla, nome), usada na escolha de Estado e cidade (RF01).
import { ESTADOS, estadoValido, buscarEstado } from '../estados';

test('há as 27 unidades federativas, sem siglas repetidas', () => {
  expect(ESTADOS).toHaveLength(27);
  expect(new Set(ESTADOS.map((estado) => estado.sigla)).size).toBe(27);
  ESTADOS.forEach((estado) => expect(estado.sigla).toMatch(/^[A-Z]{2}$/));
});

test('estão em ordem alfabética pelo nome', () => {
  const nomes = ESTADOS.map((estado) => estado.nome);
  const ordenados = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  expect(nomes).toEqual(ordenados);
});

test('estadoValido aceita só siglas existentes, em maiúsculas', () => {
  expect(estadoValido('SP')).toBe(true);
  expect(estadoValido('DF')).toBe(true);
  expect(estadoValido('sp')).toBe(false);
  expect(estadoValido('XX')).toBe(false);
  expect(estadoValido(undefined)).toBe(false);
});

test('buscarEstado devolve o Estado ou null', () => {
  expect(buscarEstado('RJ')).toEqual({ sigla: 'RJ', nome: 'Rio de Janeiro' });
  expect(buscarEstado('XX')).toBeNull();
});
