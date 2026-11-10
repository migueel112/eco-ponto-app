// Repositório de pontos com o Firestore simulado (jest.mock), sem rede.
import { criarRepositorioPontos, COLECAO_PONTOS } from '../repositorioPontos';
import * as firestore from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, nome) => ({ tipo: 'colecao', nome })),
  query: jest.fn((colecao, ...filtros) => ({ colecao, filtros })),
  where: jest.fn((campo, operador, valor) => ({ campo, operador, valor })),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn((db, colecao, id) => ({ colecao, id })),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

const DB = { falso: true };
const documento = (id, dados) => ({ id, data: () => dados, exists: () => true });

beforeEach(() => jest.clearAllMocks());

test('usa a coleção "pontos"', () => {
  criarRepositorioPontos(DB);
  expect(firestore.collection).toHaveBeenCalledWith(DB, COLECAO_PONTOS);
});

describe('listarPontosAtivos', () => {
  test('filtra por situação, Estado e cidade e devolve com id', async () => {
    firestore.getDocs.mockResolvedValue({ docs: [documento('a', { nome: 'Ecoponto A' })] });
    const pontos = await criarRepositorioPontos(DB).listarPontosAtivos({ uf: 'SP', cidade: 'Santos' });
    expect(pontos).toEqual([{ id: 'a', nome: 'Ecoponto A' }]);
    expect(firestore.where.mock.calls).toEqual([
      ['situacao', '==', 'ativo'],
      ['uf', '==', 'SP'],
      ['cidade', '==', 'Santos'],
    ]);
  });

  test('sem filtros, só a situação', async () => {
    firestore.getDocs.mockResolvedValue({ docs: [] });
    await criarRepositorioPontos(DB).listarPontosAtivos();
    expect(firestore.where.mock.calls).toEqual([['situacao', '==', 'ativo']]);
  });
});

test('listarPontosDoParceiro filtra pelo parceiro', async () => {
  firestore.getDocs.mockResolvedValue({ docs: [documento('b', { parceiroId: 'p1' })] });
  expect(await criarRepositorioPontos(DB).listarPontosDoParceiro('p1')).toEqual([
    { id: 'b', parceiroId: 'p1' },
  ]);
  expect(firestore.where).toHaveBeenCalledWith('parceiroId', '==', 'p1');
});

describe('obterPonto', () => {
  test('devolve o ponto ou null se não existir', async () => {
    const repositorio = criarRepositorioPontos(DB);
    firestore.getDoc.mockResolvedValueOnce(documento('c', { nome: 'C' }));
    expect(await repositorio.obterPonto('c')).toEqual({ id: 'c', nome: 'C' });
    firestore.getDoc.mockResolvedValueOnce({ exists: () => false });
    expect(await repositorio.obterPonto('x')).toBeNull();
  });

  test('acesso negado pelas regras vira null; outros erros sobem', async () => {
    const repositorio = criarRepositorioPontos(DB);
    firestore.getDoc.mockRejectedValueOnce({ code: 'permission-denied' });
    expect(await repositorio.obterPonto('d')).toBeNull();
    firestore.getDoc.mockRejectedValueOnce(new Error('sem rede'));
    await expect(repositorio.obterPonto('d')).rejects.toThrow('sem rede');
  });
});

describe('gravação', () => {
  test('criarPonto grava sem o id e devolve o novo id', async () => {
    firestore.addDoc.mockResolvedValue({ id: 'novo' });
    expect(await criarRepositorioPontos(DB).criarPonto({ id: 'ignorar', nome: 'N' })).toBe('novo');
    expect(firestore.addDoc).toHaveBeenCalledWith({ tipo: 'colecao', nome: 'pontos' }, { nome: 'N' });
  });

  test('atualizarPonto substitui o documento sem o id', async () => {
    await criarRepositorioPontos(DB).atualizarPonto('e', { id: 'e', nome: 'E' });
    expect(firestore.setDoc).toHaveBeenCalledWith({ colecao: 'pontos', id: 'e' }, { nome: 'E' });
  });

  test('excluirPonto apaga o documento', async () => {
    await criarRepositorioPontos(DB).excluirPonto('f');
    expect(firestore.deleteDoc).toHaveBeenCalledWith({ colecao: 'pontos', id: 'f' });
  });
});
