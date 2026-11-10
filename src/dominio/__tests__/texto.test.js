// Funções de apoio para comparar textos.
import { normalizarTexto, somenteDigitos } from '../texto';
import { materialConhecido } from '../materiais';

describe('normalizarTexto', () => {
  test('remove acentos, maiúsculas e espaços extras', () => {
    expect(normalizarTexto('  Rua  São   Bento ')).toBe('rua sao bento');
    expect(normalizarTexto('AVENIDA PAULISTA')).toBe('avenida paulista');
  });

  test('valor que não é texto vira texto vazio', () => {
    expect(normalizarTexto(null)).toBe('');
    expect(normalizarTexto(10)).toBe('');
  });
});

describe('somenteDigitos', () => {
  test('mantém só os números', () => {
    expect(somenteDigitos('(11) 3333-4444')).toBe('1133334444');
    expect(somenteDigitos('01310-100')).toBe('01310100');
  });

  test('valor que não é texto vira texto vazio', () => {
    expect(somenteDigitos(undefined)).toBe('');
  });
});

describe('materialConhecido', () => {
  test('reconhece os tipos cadastrados, com ou sem acento', () => {
    expect(materialConhecido('vidro')).toBe(true);
    expect(materialConhecido('Eletronico')).toBe(true);
    expect(materialConhecido('madeira')).toBe(false);
    expect(materialConhecido('')).toBe(false);
  });
});
