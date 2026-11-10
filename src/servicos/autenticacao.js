// Login do parceiro ambiental com Firebase Authentication (e-mail e senha).
// Implementa autenticacao.usuarioAtual(), que o ControladorCadastro usa,
// e as ações de entrar, sair e acompanhar a sessão usadas pelas telas.

import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Mensagens em português para os erros mais comuns do Firebase Auth.
export const MENSAGENS_LOGIN = {
  camposVazios: 'Informe o e-mail e a senha',
  credenciaisInvalidas: 'E-mail ou senha incorretos',
  emailInvalido: 'E-mail inválido',
  contaDesativada: 'Esta conta foi desativada',
  muitasTentativas: 'Muitas tentativas. Aguarde um pouco e tente de novo',
  semConexao: 'Sem conexão com a internet',
  erroGenerico: 'Não foi possível entrar. Tente novamente',
};

const MENSAGEM_POR_CODIGO = {
  'auth/invalid-credential': MENSAGENS_LOGIN.credenciaisInvalidas,
  'auth/wrong-password': MENSAGENS_LOGIN.credenciaisInvalidas,
  'auth/user-not-found': MENSAGENS_LOGIN.credenciaisInvalidas,
  'auth/invalid-email': MENSAGENS_LOGIN.emailInvalido,
  'auth/user-disabled': MENSAGENS_LOGIN.contaDesativada,
  'auth/too-many-requests': MENSAGENS_LOGIN.muitasTentativas,
  'auth/network-request-failed': MENSAGENS_LOGIN.semConexao,
};

export function mensagemDoErro(erro) {
  return MENSAGEM_POR_CODIGO[erro?.code] ?? MENSAGENS_LOGIN.erroGenerico;
}

// Só o uid e o e-mail saem daqui; o resto do usuário do Firebase não é exposto.
function paraSessao(usuario) {
  return usuario ? { uid: usuario.uid, email: usuario.email } : null;
}

export function criarAutenticacao(auth) {
  return {
    usuarioAtual() {
      return paraSessao(auth.currentUser);
    },

    // Devolve { sucesso, sessao } ou { sucesso: false, mensagem }.
    async entrar(email, senha) {
      const emailLimpo = typeof email === 'string' ? email.trim() : '';
      if (emailLimpo === '' || !senha) {
        return { sucesso: false, mensagem: MENSAGENS_LOGIN.camposVazios };
      }
      try {
        const credencial = await signInWithEmailAndPassword(auth, emailLimpo, senha);
        return { sucesso: true, sessao: paraSessao(credencial.user) };
      } catch (erro) {
        return { sucesso: false, mensagem: mensagemDoErro(erro) };
      }
    },

    async sair() {
      await signOut(auth);
    },

    // Chama o callback sempre que o parceiro entra ou sai. Devolve a função
    // que cancela o acompanhamento (para usar no useEffect das telas).
    observarSessao(callback) {
      return onAuthStateChanged(auth, (usuario) => callback(paraSessao(usuario)));
    },
  };
}
