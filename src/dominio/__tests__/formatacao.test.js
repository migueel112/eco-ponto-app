// Textos de endereço, materiais e distância para as telas.
import {
  descreverEndereco,
  descreverMateriais,
  descreverDistancia,
  comInicialMaiuscula,
} from '../formatacao';

describe('descreverEndereco', () => {
  test('logradouro, número e bairro', () => {
    const ponto = { endereco: { logradouro: 'Avenida Paulista', numero: '1578', bairro: 'Bela Vista' } };
    expect(descreverEndereco(ponto)).toBe('Avenida Paulista, 1578 - Bela Vista');
  });

  test('omite partes vazias', () => {
    expect(descreverEndereco({ endereco: { logradouro: 'Rua A', bairro: 'Centro' } })).toBe('Rua A - Centro');
    expect(descreverEndereco({ endereco: { bairro: 'Centro' } })).toBe('Centro');
    expect(descreverEndereco(null)).toBe('');
  });
});

describe('descreverMateriais', () => {
  test('junta com vírgula e "e"', () => {
    expect(descreverMateriais(['papel', 'plástico', 'vidro'])).toBe('papel, plástico e vidro');
    expect(descreverMateriais(['papel', 'metal'])).toBe('papel e metal');
    expect(descreverMateriais(['vidro'])).toBe('vidro');
  });

  test('lista vazia ou ausente vira texto vazio', () => {
    expect(descreverMateriais([])).toBe('');
    expect(descreverMateriais(undefined)).toBe('');
  });
});

describe('descreverDistancia', () => {
  test('metros abaixo de 1 km, quilômetros com vírgula acima', () => {
    expect(descreverDistancia(0.85)).toBe('850 m');
    expect(descreverDistancia(2.6034)).toBe('2,6 km');
    expect(descreverDistancia(360.75)).toBe('360,8 km');
    expect(descreverDistancia(0)).toBe('0 m');
  });

  test('sem distância, texto vazio', () => {
    expect(descreverDistancia(null)).toBe('');
    expect(descreverDistancia(undefined)).toBe('');
  });
});

test('comInicialMaiuscula', () => {
  expect(comInicialMaiuscula('plástico')).toBe('Plástico');
  expect(comInicialMaiuscula('')).toBe('');
  expect(comInicialMaiuscula(null)).toBe('');
});
