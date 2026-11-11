// Cálculo de rota com o OSRM (servidor de demonstração do Project OSRM),
// usado na TelaRota (RF07). Implementa servicoRotas.calcularRota(origem, destino)
// esperado pelo ControladorPontoDeColeta.
//
// Política do servidor de demonstração: no máximo 1 pedido por segundo, uso
// razoável e não comercial (projeto acadêmico). O app se identifica no
// User-Agent. A origem do usuário vai só no pedido e não é guardada (RNF04).

import { ERRO_SEM_CONEXAO, criarErro } from '../dominio/erros';

export const URL_OSRM = 'https://router.project-osrm.org/route/v1/driving';
export const USER_AGENT = 'EcoPontoApp/1.0 (projeto academico)';
export const ATRIBUICAO_ROTA = 'Rota: OSRM, dados © colaboradores do OpenStreetMap';
export const ERRO_SEM_ROTA = 'sem-rota';
const INTERVALO_MINIMO_MS = 1000;

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export function criarServicoRotas({ buscar = fetch, agora = Date.now } = {}) {
  let ultimoPedido = -Infinity;

  async function respeitarIntervalo() {
    const espera = ultimoPedido + INTERVALO_MINIMO_MS - agora();
    if (espera > 0) {
      await esperar(espera);
    }
    ultimoPedido = agora();
  }

  return {
    // Devolve { distanciaKm, tempoEstimadoMin, trajeto: [{ latitude, longitude }] }.
    async calcularRota(origem, destino) {
      // O OSRM usa a ordem longitude,latitude.
      const pontos = `${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}`;
      const url = `${URL_OSRM}/${pontos}?overview=full&geometries=geojson`;

      await respeitarIntervalo();
      let resposta;
      try {
        resposta = await buscar(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
      } catch {
        throw criarErro('Sem conexão com a internet', ERRO_SEM_CONEXAO);
      }

      const dados = await resposta.json().catch(() => null);
      const rota = dados?.code === 'Ok' ? dados.routes?.[0] : null;
      if (!rota) {
        throw criarErro(`Não foi possível calcular a rota (${dados?.code ?? resposta.status})`, ERRO_SEM_ROTA);
      }

      return {
        distanciaKm: rota.distance / 1000,
        tempoEstimadoMin: Math.max(1, Math.round(rota.duration / 60)),
        trajeto: rota.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
      };
    },
  };
}
