// CT13 – filtro por tipo de material (RF08).
import {
  TIPOS_DE_MATERIAL,
  normalizarMaterial,
  aceitaMateriais,
  filtrarPorMateriais,
} from '../materiais';

const centro = { nome: 'Ecoponto Centro', materiais: ['papel', 'plástico', 'vidro'] };
const sul = { nome: 'Ecoponto Sul', materiais: ['papel', 'metal'] };
const eletro = { nome: 'Coleta de Eletrônicos', materiais: ['eletrônico'] };
const pontos = [centro, sul, eletro];

test('há os cinco tipos de material, cada um com nome e descrição', () => {
  expect(TIPOS_DE_MATERIAL.map((tipo) => tipo.nome)).toEqual([
    'papel',
    'plástico',
    'vidro',
    'metal',
    'eletrônico',
  ]);
  TIPOS_DE_MATERIAL.forEach((tipo) => expect(tipo.descricao).toBeTruthy());
});

describe('normalizarMaterial', () => {
  test('ignora maiúsculas, acentos e espaços nas pontas', () => {
    expect(normalizarMaterial(' Plástico ')).toBe('plastico');
    expect(normalizarMaterial('ELETRÔNICO')).toBe('eletronico');
  });

  test('valor que não é texto vira texto vazio', () => {
    expect(normalizarMaterial(undefined)).toBe('');
    expect(normalizarMaterial(3)).toBe('');
  });
});

describe('aceitaMateriais', () => {
  test('sem filtro, qualquer ponto atende', () => {
    expect(aceitaMateriais(centro)).toBe(true);
    expect(aceitaMateriais(centro, [])).toBe(true);
  });

  test('precisa aceitar todos os materiais pedidos', () => {
    expect(aceitaMateriais(centro, ['papel', 'vidro'])).toBe(true);
    expect(aceitaMateriais(centro, ['papel', 'metal'])).toBe(false);
  });

  test('compara sem diferenciar acento e maiúscula', () => {
    expect(aceitaMateriais(centro, ['Plastico'])).toBe(true);
  });

  test('ponto sem materiais não atende a nenhum filtro', () => {
    expect(aceitaMateriais({ nome: 'Vazio' }, ['papel'])).toBe(false);
    expect(aceitaMateriais(null, ['papel'])).toBe(false);
  });
});

describe('filtrarPorMateriais', () => {
  test('um material: todos os pontos que o aceitam', () => {
    expect(filtrarPorMateriais(pontos, ['papel'])).toEqual([centro, sul]);
  });

  test('vários materiais: só os pontos que aceitam todos', () => {
    expect(filtrarPorMateriais(pontos, ['papel', 'metal'])).toEqual([sul]);
  });

  test('sem filtro devolve todos os pontos', () => {
    expect(filtrarPorMateriais(pontos)).toEqual(pontos);
  });

  test('nenhum ponto atende: lista vazia', () => {
    expect(filtrarPorMateriais(pontos, ['vidro', 'eletrônico'])).toEqual([]);
  });

  test('entrada que não é lista devolve lista vazia', () => {
    expect(filtrarPorMateriais(null, ['papel'])).toEqual([]);
  });
});
