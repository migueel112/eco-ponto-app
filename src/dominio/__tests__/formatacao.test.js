// Textos de endereço, materiais e distância para as telas.
import {
  descreverEndereco,
  descreverMateriais,
  descreverDistancia,
  comInicialMaiuscula,
  NOMES_DOS_DIAS,
  descreverHorario,
  ordenarHorarios,
  descreverTelefone,
  descreverCep,
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

describe('horários', () => {
  test('descreve um horário com o nome do dia', () => {
    expect(descreverHorario({ diaDaSemana: 1, horaAbertura: '08:00', horaFechamento: '17:00' })).toBe(
      'Segunda-feira: 08:00 às 17:00'
    );
    expect(NOMES_DOS_DIAS[0]).toBe('Domingo');
    expect(NOMES_DOS_DIAS[6]).toBe('Sábado');
  });

  test('ordena de segunda a domingo e pela abertura', () => {
    const horarios = [
      { diaDaSemana: 0, horaAbertura: '08:00', horaFechamento: '12:00' },
      { diaDaSemana: 3, horaAbertura: '14:00', horaFechamento: '18:00' },
      { diaDaSemana: 1, horaAbertura: '08:00', horaFechamento: '17:00' },
      { diaDaSemana: 3, horaAbertura: '08:00', horaFechamento: '12:00' },
    ];
    expect(ordenarHorarios(horarios).map(descreverHorario)).toEqual([
      'Segunda-feira: 08:00 às 17:00',
      'Quarta-feira: 08:00 às 12:00',
      'Quarta-feira: 14:00 às 18:00',
      'Domingo: 08:00 às 12:00',
    ]);
    expect(horarios[0].diaDaSemana).toBe(0); // não altera a lista original
    expect(ordenarHorarios(undefined)).toEqual([]);
  });
});

describe('telefone e CEP', () => {
  test('formata telefone fixo e celular', () => {
    expect(descreverTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(descreverTelefone('11988887777')).toBe('(11) 98888-7777');
  });

  test('telefone em outro formato fica como veio', () => {
    expect(descreverTelefone('0800 123')).toBe('0800 123');
    expect(descreverTelefone(undefined)).toBe('');
  });

  test('formata o CEP e mantém outros formatos', () => {
    expect(descreverCep('01310200')).toBe('01310-200');
    expect(descreverCep('0131')).toBe('0131');
    expect(descreverCep(null)).toBe('');
  });
});

test('comInicialMaiuscula', () => {
  expect(comInicialMaiuscula('plástico')).toBe('Plástico');
  expect(comInicialMaiuscula('')).toBe('');
  expect(comInicialMaiuscula(null)).toBe('');
});
