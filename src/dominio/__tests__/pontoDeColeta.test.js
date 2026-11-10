// RN01 – só pontos ativos aparecem (parte de domínio do CT07).
import {
  SITUACAO_ATIVO,
  SITUACAO_INATIVO,
  estaAtivo,
  somenteAtivos,
} from '../pontoDeColeta';

const ativo = { nome: 'Ecoponto Centro', situacao: SITUACAO_ATIVO };
const inativo = { nome: 'Ecoponto Fechado', situacao: SITUACAO_INATIVO };

describe('estaAtivo', () => {
  test('verdadeiro só para a situação "ativo"', () => {
    expect(estaAtivo(ativo)).toBe(true);
    expect(estaAtivo(inativo)).toBe(false);
    expect(estaAtivo({ nome: 'Sem situação' })).toBe(false);
    expect(estaAtivo({ situacao: 'Ativo' })).toBe(false);
    expect(estaAtivo(null)).toBe(false);
  });
});

describe('somenteAtivos', () => {
  test('remove os inativos e mantém a ordem', () => {
    const outroAtivo = { nome: 'Ecoponto Sul', situacao: SITUACAO_ATIVO };
    expect(somenteAtivos([ativo, inativo, outroAtivo])).toEqual([ativo, outroAtivo]);
  });

  test('não altera a lista original', () => {
    const pontos = [ativo, inativo];
    somenteAtivos(pontos);
    expect(pontos).toHaveLength(2);
  });

  test('lista vazia quando não há ativos ou a entrada não é lista', () => {
    expect(somenteAtivos([inativo])).toEqual([]);
    expect(somenteAtivos([])).toEqual([]);
    expect(somenteAtivos(undefined)).toEqual([]);
  });
});
