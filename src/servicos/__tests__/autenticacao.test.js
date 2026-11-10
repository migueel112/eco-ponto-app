// Serviço de autenticação com o Firebase Auth simulado (jest.mock), sem rede.
import { criarAutenticacao, mensagemDoErro, MENSAGENS_LOGIN } from '../autenticacao';
import * as firebaseAuth from 'firebase/auth';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

const USUARIO = { uid: 'u1', email: 'parceiro@exemplo.com', displayName: 'não sai daqui' };

beforeEach(() => jest.clearAllMocks());

describe('usuarioAtual', () => {
  test('devolve só uid e e-mail, ou null sem login', () => {
    expect(criarAutenticacao({ currentUser: USUARIO }).usuarioAtual()).toEqual({
      uid: 'u1',
      email: 'parceiro@exemplo.com',
    });
    expect(criarAutenticacao({ currentUser: null }).usuarioAtual()).toBeNull();
  });
});

describe('entrar', () => {
  const auth = { currentUser: null };

  test('login certo devolve a sessão', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockResolvedValue({ user: USUARIO });
    const resposta = await criarAutenticacao(auth).entrar('  parceiro@exemplo.com ', 'senha-teste');
    expect(resposta).toEqual({ sucesso: true, sessao: { uid: 'u1', email: 'parceiro@exemplo.com' } });
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'parceiro@exemplo.com',
      'senha-teste'
    );
  });

  test('campos vazios nem chamam o Firebase', async () => {
    const autenticacao = criarAutenticacao(auth);
    expect(await autenticacao.entrar('', 'x')).toEqual({ sucesso: false, mensagem: MENSAGENS_LOGIN.camposVazios });
    expect(await autenticacao.entrar('a@b.com', '')).toMatchObject({ sucesso: false });
    expect(await autenticacao.entrar(undefined, 'x')).toMatchObject({ sucesso: false });
    expect(firebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('erro do Firebase vira mensagem em português', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/invalid-credential' });
    expect(await criarAutenticacao(auth).entrar('a@b.com', 'errada')).toEqual({
      sucesso: false,
      mensagem: MENSAGENS_LOGIN.credenciaisInvalidas,
    });
  });
});

test('mensagemDoErro cobre os códigos conhecidos e cai na genérica', () => {
  expect(mensagemDoErro({ code: 'auth/network-request-failed' })).toBe(MENSAGENS_LOGIN.semConexao);
  expect(mensagemDoErro({ code: 'auth/too-many-requests' })).toBe(MENSAGENS_LOGIN.muitasTentativas);
  expect(mensagemDoErro({ code: 'auth/qualquer' })).toBe(MENSAGENS_LOGIN.erroGenerico);
  expect(mensagemDoErro(undefined)).toBe(MENSAGENS_LOGIN.erroGenerico);
});

test('sair encerra a sessão', async () => {
  const auth = {};
  await criarAutenticacao(auth).sair();
  expect(firebaseAuth.signOut).toHaveBeenCalledWith(auth);
});

test('observarSessao avisa entradas e saídas e devolve o cancelamento', () => {
  const cancelar = jest.fn();
  firebaseAuth.onAuthStateChanged.mockImplementation((auth, ouvinte) => {
    ouvinte(USUARIO);
    ouvinte(null);
    return cancelar;
  });
  const callback = jest.fn();
  expect(criarAutenticacao({}).observarSessao(callback)).toBe(cancelar);
  expect(callback.mock.calls).toEqual([[{ uid: 'u1', email: 'parceiro@exemplo.com' }], [null]]);
});
