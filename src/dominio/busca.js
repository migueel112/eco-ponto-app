// Entidade Busca (dataHora, tipoOrigem GPS | endereco).
// A Busca é TRANSITÓRIA: existe só em memória e nunca é gravada (RNF04).
// A origem (posição do usuário ou do endereço pesquisado) fica guardada
// apenas dentro da busca e é descartada em encerrar().

import { localizacaoValida } from './distancia';
import { somenteAtivos, estaAberto } from './pontoDeColeta';
import { filtrarPorMateriais } from './materiais';
import { distanciaAtePonto } from './ordenacao';

export const TIPO_ORIGEM_GPS = 'GPS';
export const TIPO_ORIGEM_ENDERECO = 'endereco';

// Distâncias com diferença menor que 1 metro contam como empate (RN06).
export const TOLERANCIA_EMPATE_KM = 0.001;

// RN06: entre os pontos ativos que atendem ao filtro de materiais, o mais
// próximo é o de menor distância em linha reta (Haversine). Em caso de
// empate vence o ponto aberto no momento. Devolve { ponto, distanciaKm } ou
// null se nenhum ponto servir.
export function maisProximo(origem, pontos, tipos = [], dataHora = new Date()) {
  if (!localizacaoValida(origem)) {
    throw new Error('Localização inválida');
  }

  let melhor = null;
  for (const ponto of filtrarPorMateriais(somenteAtivos(pontos), tipos)) {
    const distanciaKm = distanciaAtePonto(origem, ponto);
    if (distanciaKm === null) {
      continue; // ponto sem coordenadas válidas não entra na disputa
    }
    const candidato = { ponto, distanciaKm, aberto: estaAberto(ponto, dataHora) };
    if (melhor === null || venceDe(candidato, melhor)) {
      melhor = candidato;
    }
  }

  return melhor && { ponto: melhor.ponto, distanciaKm: melhor.distanciaKm };
}

// O candidato vence se estiver mais perto ou, no empate, se estiver aberto
// e o atual não.
function venceDe(candidato, atual) {
  const diferenca = candidato.distanciaKm - atual.distanciaKm;
  if (Math.abs(diferenca) < TOLERANCIA_EMPATE_KM) {
    return candidato.aberto && !atual.aberto;
  }
  return diferenca < 0;
}

// Cria uma Busca a partir de uma origem. Métodos do modelo de ES:
// calcularMaisProximo(pontos), distanciaHaversine(origem, ponto) e encerrar().
export function criarBusca(tipoOrigem, origem, dataHora = new Date()) {
  if (tipoOrigem !== TIPO_ORIGEM_GPS && tipoOrigem !== TIPO_ORIGEM_ENDERECO) {
    throw new Error('Tipo de origem inválido');
  }
  if (!localizacaoValida(origem)) {
    throw new Error('Localização inválida');
  }

  // Cópia própria: a busca não guarda referência ao objeto de quem chamou.
  let origemDaBusca = { latitude: origem.latitude, longitude: origem.longitude };

  function exigirAtiva() {
    if (origemDaBusca === null) {
      throw new Error('Busca encerrada');
    }
  }

  return {
    dataHora,
    tipoOrigem,

    estaEncerrada() {
      return origemDaBusca === null;
    },

    calcularMaisProximo(pontos, tipos = []) {
      exigirAtiva();
      return maisProximo(origemDaBusca, pontos, tipos, dataHora);
    },

    // Distância da origem desta busca até o ponto (null sem coordenadas).
    distanciaHaversine(ponto) {
      exigirAtiva();
      return distanciaAtePonto(origemDaBusca, ponto);
    },

    // Descarta a origem: depois disso a busca não calcula mais nada.
    encerrar() {
      origemDaBusca = null;
    },
  };
}
