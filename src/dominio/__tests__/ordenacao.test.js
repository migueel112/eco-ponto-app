// RF04 – ordem da lista: por distância com posição de referência, senão alfabética.
import { compararPorNome, distanciaAtePonto, ordenarPontos } from '../ordenacao';

const PRACA_DA_SE = { latitude: -23.5505, longitude: -46.6333 };

// Pontos fictícios em São Paulo.
const masp = { nome: 'Ecoponto Paulista', latitude: -23.5614, longitude: -46.6559 };
const se = { nome: 'ecoponto Sé', latitude: -23.5503, longitude: -46.6340 };
const ibirapuera = { nome: 'Árvore Viva', latitude: -23.5874, longitude: -46.6576 };
const semCoordenadas = { nome: 'Bairro Novo' };

describe('compararPorNome', () => {
  test('ignora maiúsculas e acentos', () => {
    expect(compararPorNome({ nome: 'árvore' }, { nome: 'Arvore' })).toBe(0);
    expect(compararPorNome({ nome: 'Bairro' }, { nome: 'Árvore' })).toBeGreaterThan(0);
  });

  test('nome ausente vem antes', () => {
    expect(compararPorNome({}, { nome: 'A' })).toBeLessThan(0);
    expect(compararPorNome(null, null)).toBe(0);
  });
});

describe('distanciaAtePonto', () => {
  test('calcula a distância até o ponto', () => {
    expect(distanciaAtePonto(PRACA_DA_SE, masp)).toBeCloseTo(2.6, 1);
  });

  test('null para ponto sem coordenadas válidas', () => {
    expect(distanciaAtePonto(PRACA_DA_SE, semCoordenadas)).toBeNull();
  });
});

describe('ordenarPontos', () => {
  const pontos = [masp, semCoordenadas, ibirapuera, se];

  test('sem origem: ordem alfabética e sem distância', () => {
    const lista = ordenarPontos(pontos);
    expect(lista.map((p) => p.nome)).toEqual([
      'Árvore Viva',
      'Bairro Novo',
      'Ecoponto Paulista',
      'ecoponto Sé',
    ]);
    expect(lista[0]).not.toHaveProperty('distanciaKm');
  });

  test('com origem inválida também usa a ordem alfabética', () => {
    expect(ordenarPontos(pontos, { latitude: 200, longitude: 0 })[0].nome).toBe('Árvore Viva');
  });

  test('com origem: do mais perto ao mais longe, com a distância', () => {
    const lista = ordenarPontos(pontos, PRACA_DA_SE);
    expect(lista.map((p) => p.nome)).toEqual([
      'ecoponto Sé',
      'Ecoponto Paulista',
      'Árvore Viva',
      'Bairro Novo',
    ]);
    expect(lista[0].distanciaKm).toBeLessThan(lista[1].distanciaKm);
    expect(lista[3].distanciaKm).toBeNull();
  });

  test('mesma distância: desempata pelo nome', () => {
    const b = { nome: 'B', latitude: -23.56, longitude: -46.64 };
    const a = { nome: 'A', latitude: -23.56, longitude: -46.64 };
    expect(ordenarPontos([b, a], PRACA_DA_SE).map((p) => p.nome)).toEqual(['A', 'B']);
  });

  test('vários pontos sem coordenadas ficam no fim, em ordem alfabética', () => {
    const lista = ordenarPontos([{ nome: 'Z' }, masp, { nome: 'C' }], PRACA_DA_SE);
    expect(lista.map((p) => p.nome)).toEqual(['Ecoponto Paulista', 'C', 'Z']);
  });

  test('não altera a lista original', () => {
    const original = [masp, se];
    ordenarPontos(original, PRACA_DA_SE);
    expect(original).toEqual([masp, se]);
    expect(masp).not.toHaveProperty('distanciaKm');
  });

  test('entrada que não é lista devolve lista vazia', () => {
    expect(ordenarPontos(undefined)).toEqual([]);
  });
});
