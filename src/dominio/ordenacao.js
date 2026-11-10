// Ordem da lista de pontos (RF04): por distância quando há posição de
// referência; senão, em ordem alfabética pelo nome.

import { distanciaHaversine, localizacaoValida } from './distancia';

// Compara nomes em português, sem diferenciar maiúsculas e acentos.
export function compararPorNome(pontoA, pontoB) {
  return (pontoA?.nome ?? '').localeCompare(pontoB?.nome ?? '', 'pt-BR', {
    sensitivity: 'base',
  });
}

// Distância em km entre a origem e o ponto, ou null se o ponto não tiver
// coordenadas válidas.
export function distanciaAtePonto(origem, ponto) {
  const destino = { latitude: ponto?.latitude, longitude: ponto?.longitude };
  return localizacaoValida(destino) ? distanciaHaversine(origem, destino) : null;
}

// Devolve uma lista nova, sem alterar a original.
// - Sem origem: ordem alfabética.
// - Com origem: cada ponto ganha o campo distanciaKm e a lista vai do mais
//   perto ao mais longe (empate por nome). Pontos sem coordenadas válidas
//   ficam no fim, com distanciaKm = null.
export function ordenarPontos(pontos, origem = null) {
  const lista = Array.isArray(pontos) ? [...pontos] : [];

  if (!localizacaoValida(origem)) {
    return lista.sort(compararPorNome);
  }

  return lista
    .map((ponto) => ({ ...ponto, distanciaKm: distanciaAtePonto(origem, ponto) }))
    .sort((a, b) => {
      const semDistanciaA = a.distanciaKm === null;
      const semDistanciaB = b.distanciaKm === null;
      if (semDistanciaA && semDistanciaB) {
        return compararPorNome(a, b);
      }
      if (semDistanciaA) {
        return 1; // a vai para o fim
      }
      if (semDistanciaB) {
        return -1; // b vai para o fim
      }
      return a.distanciaKm - b.distanciaKm || compararPorNome(a, b);
    });
}
