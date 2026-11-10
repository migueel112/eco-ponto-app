// ControladorCadastro: o parceiro ambiental cadastra, edita e exclui os
// seus pontos de coleta (RF06, RF09, RF10, RN04).
//
// Serviços recebidos como parâmetro (versões fictícias nos testes):
// - autenticacao.usuarioAtual() -> { uid } | null
// - geocodificador.geocodificar(texto) -> Promise<[{ descricao, latitude, longitude }]>
// - repositorioPontos:
//     listarPontosAtivos({ uf }) -> Promise<ponto[]>
//     listarPontosDoParceiro(parceiroId) -> Promise<ponto[]>
//     obterPonto(idPonto) -> Promise<ponto | null>
//     criarPonto(dados) -> Promise<idPonto>
//     atualizarPonto(idPonto, dados) -> Promise<void>
//     excluirPonto(idPonto) -> Promise<void>
//
// As regras do Firestore também barram escrita sem login ou de outro
// parceiro (RNF06); aqui o controlador confere antes, para avisar o usuário.

import {
  validarMateriaisEHorarios as validarMateriaisEHorariosDoDominio,
  validarPonto,
  normalizarDadosDoPonto,
  MENSAGENS,
} from '../dominio/validacao';
import { compararPorNome } from '../dominio/ordenacao';

export const MENSAGENS_CADASTRO = {
  semLogin: 'Faça login como parceiro para continuar',
  camposInvalidos: 'Confira os campos destacados',
  naoEncontrado: 'Ponto de coleta não encontrado',
  naoEDono: 'Você só pode alterar os seus próprios pontos',
  cadastrado: 'Ponto de coleta cadastrado',
  atualizado: 'Ponto de coleta atualizado',
  excluido: 'Ponto de coleta excluído',
};

// Texto do endereço completo, usado na geocodificação.
export function textoDoEndereco(dados) {
  const endereco = dados?.endereco ?? {};
  return [
    [endereco.logradouro, endereco.numero].filter(Boolean).join(', '),
    endereco.bairro,
    dados?.cidade,
    dados?.uf,
    endereco.cep,
  ]
    .map((parte) => (typeof parte === 'string' ? parte.trim() : ''))
    .filter((parte) => parte !== '')
    .join(', ');
}

export function criarControladorCadastro({ autenticacao, geocodificador, repositorioPontos }) {
  // RN04: só parceiros autenticados alteram pontos.
  function verificarAutenticacao(sessao = autenticacao.usuarioAtual()) {
    return Boolean(sessao?.uid);
  }

  function falha(mensagem, erros = {}) {
    return { sucesso: false, mensagem, erros };
  }

  // RN03: se a tela ainda não tem as coordenadas, geocodifica o endereço.
  // Fica com o primeiro resultado; sem resultado, segue sem coordenadas e a
  // validação recusa o cadastro.
  async function comCoordenadas(dados) {
    if (Number.isFinite(dados?.latitude) && Number.isFinite(dados?.longitude)) {
      return dados;
    }
    const texto = textoDoEndereco(dados);
    const [primeiro] = texto === '' ? [] : await geocodificador.geocodificar(texto);
    return primeiro
      ? { ...dados, latitude: primeiro.latitude, longitude: primeiro.longitude }
      : { ...dados, latitude: null, longitude: null };
  }

  // Valida com todas as regras do domínio (campos, RN02, RN03 e RN05).
  async function validar(dados, idPontoEditado = null) {
    const completos = await comCoordenadas(dados);
    const existentes = await repositorioPontos.listarPontosAtivos({ uf: completos?.uf });
    const { valido, erros } = validarPonto(completos, existentes, idPontoEditado);
    return { valido, erros, dados: completos };
  }

  // Busca o ponto e confere se ele é do parceiro logado (RN04).
  async function obterPontoDoParceiro(idPonto, sessao) {
    const ponto = await repositorioPontos.obterPonto(idPonto);
    if (!ponto) {
      return { erro: falha(MENSAGENS_CADASTRO.naoEncontrado) };
    }
    if (ponto.parceiroId !== sessao.uid) {
      return { erro: falha(MENSAGENS_CADASTRO.naoEDono) };
    }
    return { ponto };
  }

  return {
    verificarAutenticacao,

    // RN02, com o nome do documento de ES. A tela pode usar para validar
    // esses campos antes de enviar.
    validarMateriaisEHorarios(dados) {
      return validarMateriaisEHorariosDoDominio(dados);
    },

    // Pontos do parceiro logado (ativos e inativos), em ordem alfabética.
    async listarMeusPontos() {
      const sessao = autenticacao.usuarioAtual();
      if (!verificarAutenticacao(sessao)) {
        return { sucesso: false, mensagem: MENSAGENS_CADASTRO.semLogin, pontos: [] };
      }
      const pontos = await repositorioPontos.listarPontosDoParceiro(sessao.uid);
      return { sucesso: true, mensagem: null, pontos: [...pontos].sort(compararPorNome) };
    },

    // RF06: o ponto nasce "ativo", ligado ao parceiro logado, e aparece nas
    // buscas assim que é gravado.
    async cadastrarPonto(dados) {
      const sessao = autenticacao.usuarioAtual();
      if (!verificarAutenticacao(sessao)) {
        return falha(MENSAGENS_CADASTRO.semLogin);
      }
      const validacao = await validar(dados);
      if (!validacao.valido) {
        return falha(MENSAGENS_CADASTRO.camposInvalidos, validacao.erros);
      }
      const novoPonto = {
        ...normalizarDadosDoPonto({ ...validacao.dados, situacao: undefined }),
        parceiroId: sessao.uid,
      };
      const id = await repositorioPontos.criarPonto(novoPonto);
      return { sucesso: true, mensagem: MENSAGENS_CADASTRO.cadastrado, erros: {}, id };
    },

    // RF09: mesmas validações do cadastro, só nos pontos do próprio parceiro.
    // A situação e o dono do ponto não mudam na edição.
    async editarPonto(idPonto, dados) {
      const sessao = autenticacao.usuarioAtual();
      if (!verificarAutenticacao(sessao)) {
        return falha(MENSAGENS_CADASTRO.semLogin);
      }
      const { ponto, erro } = await obterPontoDoParceiro(idPonto, sessao);
      if (erro) {
        return erro;
      }
      const validacao = await validar(dados, idPonto);
      if (!validacao.valido) {
        return falha(MENSAGENS_CADASTRO.camposInvalidos, validacao.erros);
      }
      const atualizado = {
        ...normalizarDadosDoPonto({ ...validacao.dados, situacao: ponto.situacao }),
        parceiroId: ponto.parceiroId,
      };
      await repositorioPontos.atualizarPonto(idPonto, atualizado);
      return { sucesso: true, mensagem: MENSAGENS_CADASTRO.atualizado, erros: {}, id: idPonto };
    },

    // RF10: exclui só pontos do próprio parceiro. A confirmação ("Tem
    // certeza?") é feita pela tela antes de chamar este método.
    async excluirPonto(idPonto) {
      const sessao = autenticacao.usuarioAtual();
      if (!verificarAutenticacao(sessao)) {
        return falha(MENSAGENS_CADASTRO.semLogin);
      }
      const { erro } = await obterPontoDoParceiro(idPonto, sessao);
      if (erro) {
        return erro;
      }
      await repositorioPontos.excluirPonto(idPonto);
      return { sucesso: true, mensagem: MENSAGENS_CADASTRO.excluido, erros: {} };
    },
  };
}

// Reexporta as mensagens de validação para a tela mostrar por campo.
export { MENSAGENS as MENSAGENS_VALIDACAO };
