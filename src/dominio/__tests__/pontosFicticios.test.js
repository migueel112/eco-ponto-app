// Confere que os pontos fictícios do script popular-banco passam em todas
// as validações do cadastro (campos, RN02, RN03 e RN05).
import dados from '../../../scripts/pontos-ficticios.json';
import { validarPonto } from '../validacao';

describe('pontos fictícios de teste', () => {
  test.each(dados.pontos.map((ponto) => [ponto.nome, ponto]))('%s é válido', (nome, ponto) => {
    expect(validarPonto(ponto).erros).toEqual({});
  });

  test('não há dois pontos no mesmo endereço (RN05)', () => {
    dados.pontos.forEach((ponto, indice) => {
      const outros = dados.pontos
        .filter((_, i) => i !== indice)
        .map((outro, i) => ({ ...outro, id: String(i), situacao: 'ativo' }));
      expect(validarPonto(ponto, outros).valido).toBe(true);
    });
  });

  test('os nomes começam com "Ecoponto Teste" para não parecerem reais', () => {
    dados.pontos.forEach((ponto) => expect(ponto.nome).toMatch(/^Ecoponto Teste /));
  });
});
