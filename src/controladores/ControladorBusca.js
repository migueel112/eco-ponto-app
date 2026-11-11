// ControladorBusca: casos de uso da busca de pontos de coleta
// (RF01, RF02, RF03, RF04, RF08).
//
// O controlador não fala direto com o Firebase nem com o serviço de mapas:
// recebe esses serviços como parâmetro. Assim os testes usam versões
// fictícias, e as telas recebem o controlador já montado com os serviços reais.
//
// Serviços esperados:
// - repositorioPontos.listarPontosAtivos({ uf, cidade }) -> Promise<ponto[]>
//   (uf e cidade são opcionais; sem eles, devolve os pontos de todo o país)
// - geocodificador.geocodificar(texto) -> Promise<[{ descricao, latitude, longitude }]>
//
// A origem (GPS ou endereço) só existe dentro de uma Busca, que é encerrada
// ao fim de cada pedido. Nada aqui grava a localização (RNF04).

import { ESTADOS } from '../dominio/estados';
import { somenteAtivos } from '../dominio/pontoDeColeta';
import { filtrarPorMateriais } from '../dominio/materiais';
import { ordenarPontos } from '../dominio/ordenacao';
import { criarBusca, TIPO_ORIGEM_GPS, TIPO_ORIGEM_ENDERECO } from '../dominio/busca';
import { normalizarTexto } from '../dominio/texto';

export const MENSAGENS_BUSCA = {
  cidadeSemPontos: 'Nenhum ponto de coleta cadastrado nesta cidade',
  filtroSemResultado: 'Nenhum ponto aceita todos os materiais escolhidos',
  nenhumProximo: 'Nenhum ponto de coleta encontrado para os materiais escolhidos',
  enderecoVazio: 'Digite um endereço para pesquisar',
  enderecoNaoEncontrado: 'Endereço não encontrado. Confira o texto e tente de novo',
  enderecoAmbiguo: 'Encontramos mais de um endereço. Escolha o correto',
};

export function criarControladorBusca({ repositorioPontos, geocodificador }) {
  // RN01 também é aplicada aqui, mesmo que o repositório já filtre.
  async function pontosAtivos(filtro = {}) {
    return somenteAtivos(await repositorioPontos.listarPontosAtivos(filtro));
  }

  // Calcula o mais próximo e sempre encerra a busca, descartando a origem.
  async function calcularMaisProximo(tipoOrigem, origem, tipos) {
    const busca = criarBusca(tipoOrigem, origem);
    try {
      const resultado = busca.calcularMaisProximo(await pontosAtivos(), tipos);
      return {
        resultado,
        mensagem: resultado ? null : MENSAGENS_BUSCA.nenhumProximo,
      };
    } finally {
      busca.encerrar();
    }
  }

  // Continua a busca com o endereço que o usuário escolheu nas sugestões.
  // Devolve também a origem (as coordenadas do endereço PESQUISADO, não do
  // GPS), para a tela de detalhes mostrar a distância. Fica só em memória.
  async function buscarPorSugestao(sugestao, tipos = []) {
    const origem = { latitude: sugestao.latitude, longitude: sugestao.longitude };
    const { resultado, mensagem } = await calcularMaisProximo(TIPO_ORIGEM_ENDERECO, origem, tipos);
    return { situacao: 'encontrado', endereco: sugestao.descricao, origem, resultado, mensagem };
  }

  return {
    // Estados que têm pelo menos um ponto ativo, em ordem alfabética.
    async listarEstados() {
      const siglas = new Set((await pontosAtivos()).map((ponto) => ponto.uf));
      return ESTADOS.filter((estado) => siglas.has(estado.sigla));
    },

    // RF01: cidades do Estado com ponto ativo, sem repetir, em ordem alfabética.
    async listarCidades(uf) {
      const porNome = new Map();
      for (const ponto of await pontosAtivos({ uf })) {
        const chave = normalizarTexto(ponto.cidade);
        if (chave !== '' && !porNome.has(chave)) {
          porNome.set(chave, ponto.cidade.trim());
        }
      }
      return [...porNome.values()].sort((a, b) =>
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
      );
    },

    // RF04 e RF08: pontos ativos da cidade, filtrados por material. Com
    // origem, ordena por distância; senão, por nome. idCidade = { uf, cidade }.
    async listarPontos(idCidade, tipos = [], origem = null) {
      const daCidade = await pontosAtivos(idCidade);
      if (daCidade.length === 0) {
        return { pontos: [], mensagem: MENSAGENS_BUSCA.cidadeSemPontos, podeLimparFiltro: false };
      }
      const filtrados = filtrarPorMateriais(daCidade, tipos);
      if (filtrados.length === 0) {
        return { pontos: [], mensagem: MENSAGENS_BUSCA.filtroSemResultado, podeLimparFiltro: true };
      }
      return { pontos: ordenarPontos(filtrados, origem), mensagem: null, podeLimparFiltro: false };
    },

    // RF02: ponto ativo mais próximo da posição do GPS.
    async buscarMaisProximo(origem, tipos = []) {
      return calcularMaisProximo(TIPO_ORIGEM_GPS, origem, tipos);
    },

    // RF03: pesquisa o endereço e, se ele for único, busca o mais próximo.
    // Endereço inexistente avisa; ambíguo devolve sugestões para escolher.
    async buscarPorEndereco(texto, tipos = []) {
      if (normalizarTexto(texto) === '') {
        return { situacao: 'naoEncontrado', mensagem: MENSAGENS_BUSCA.enderecoVazio };
      }
      const candidatos = await geocodificador.geocodificar(texto.trim());
      if (candidatos.length === 0) {
        return { situacao: 'naoEncontrado', mensagem: MENSAGENS_BUSCA.enderecoNaoEncontrado };
      }
      if (candidatos.length > 1) {
        return {
          situacao: 'sugestoes',
          sugestoes: candidatos,
          mensagem: MENSAGENS_BUSCA.enderecoAmbiguo,
        };
      }
      return buscarPorSugestao(candidatos[0], tipos);
    },

    buscarPorSugestao,
  };
}
