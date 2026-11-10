// ControladorPontoDeColeta: detalhes do ponto, distância e rota (RF05, RF07).
//
// Serviços recebidos como parâmetro (versões fictícias nos testes):
// - repositorioPontos.obterPonto(idPonto) -> Promise<ponto | null>
// - servicoRotas.calcularRota(origem, destino)
//     -> Promise<{ distanciaKm, tempoEstimadoMin, trajeto: [{ latitude, longitude }] }>
//   Sem internet, o serviço deve lançar um erro com codigo = ERRO_SEM_CONEXAO.
//
// A Rota (distanciaKm, tempoEstimado) é transitória: só vive em memória.
// A origem do usuário é usada no cálculo e não volta na resposta (RNF04).

import { localizacaoValida } from '../dominio/distancia';
import { estaAtivo, estaAberto } from '../dominio/pontoDeColeta';
import { distanciaAtePonto } from '../dominio/ordenacao';

import { ERRO_SEM_CONEXAO } from '../dominio/erros';

// Reexportado para quem já importava daqui.
export { ERRO_SEM_CONEXAO };

export const MENSAGENS_PONTO = {
  naoEncontrado: 'Ponto de coleta não encontrado',
  semOrigem: 'Use o GPS ou pesquise um endereço para calcular a rota',
  semConexao: 'Sem conexão com a internet: não é possível calcular a rota agora',
  erroRota: 'Não foi possível calcular a rota. Tente novamente',
};

export function criarControladorPontoDeColeta({ repositorioPontos, servicoRotas }) {
  // RN01: ponto inativo é tratado como inexistente em detalhes e rotas.
  async function obterPontoAtivo(idPonto) {
    const ponto = await repositorioPontos.obterPonto(idPonto);
    return estaAtivo(ponto) ? ponto : null;
  }

  // Distância em km entre a origem e o ponto, ou null sem posição de
  // referência ou sem coordenadas no ponto.
  function calcularDistancia(origem, ponto) {
    return localizacaoValida(origem) ? distanciaAtePonto(origem, ponto) : null;
  }

  return {
    calcularDistancia,

    // RF05: dados do ponto, se está aberto agora e a distância (só quando há
    // posição de referência).
    async obterDetalhes(idPonto, origem = null, dataHoraAtual = new Date()) {
      const ponto = await obterPontoAtivo(idPonto);
      if (!ponto) {
        return { ponto: null, mensagem: MENSAGENS_PONTO.naoEncontrado };
      }
      return {
        ponto,
        aberto: estaAberto(ponto, dataHoraAtual),
        distanciaKm: calcularDistancia(origem, ponto),
        mensagem: null,
      };
    },

    // RF07: trajeto, distância e tempo até o ponto. Também devolve o destino,
    // que a tela usa para abrir o app de navegação do celular.
    async calcularRota(origem, idPonto) {
      if (!localizacaoValida(origem)) {
        return { rota: null, mensagem: MENSAGENS_PONTO.semOrigem };
      }
      const ponto = await obterPontoAtivo(idPonto);
      if (!ponto) {
        return { rota: null, mensagem: MENSAGENS_PONTO.naoEncontrado };
      }

      const destino = { latitude: ponto.latitude, longitude: ponto.longitude };
      try {
        const { distanciaKm, tempoEstimadoMin, trajeto } = await servicoRotas.calcularRota(
          { latitude: origem.latitude, longitude: origem.longitude },
          destino
        );
        return {
          rota: { distanciaKm, tempoEstimadoMin, trajeto },
          destino: { ...destino, nome: ponto.nome },
          mensagem: null,
        };
      } catch (erro) {
        const semConexao = erro?.codigo === ERRO_SEM_CONEXAO;
        return {
          rota: null,
          destino: { ...destino, nome: ponto.nome },
          mensagem: semConexao ? MENSAGENS_PONTO.semConexao : MENSAGENS_PONTO.erroRota,
        };
      }
    },
  };
}
