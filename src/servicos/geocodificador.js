// Geocodificação com o Nominatim (OpenStreetMap): transforma um endereço
// digitado em coordenadas. Usado na busca por endereço (RF03) e no
// cadastro de ponto (RN03).
//
// Política de uso do Nominatim (operations.osmfoundation.org/policies/nominatim):
// - no máximo 1 pedido por segundo (o serviço espera entre um pedido e outro);
// - identificar o app no User-Agent;
// - guardar respostas repetidas (aqui, só em memória, apagadas ao fechar o app);
// - nada de busca enquanto o usuário digita (só ao tocar em "Pesquisar");
// - mostrar a atribuição ATRIBUICAO_OSM nas telas que usam o resultado.

import { ERRO_SEM_CONEXAO, criarErro } from '../dominio/erros';

export const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/search';
export const USER_AGENT = 'EcoPontoApp/1.0 (projeto academico)';
export const ATRIBUICAO_OSM = 'Endereços: © colaboradores do OpenStreetMap';
export const INTERVALO_MINIMO_MS = 1000;
const LIMITE_RESULTADOS = 5;
const TAMANHO_CACHE = 50;

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// Converte a resposta do Nominatim em { descricao, latitude, longitude }.
function paraCandidato(item) {
  return {
    descricao: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  };
}

// buscar e agora podem ser trocados nos testes.
export function criarGeocodificador({ buscar = fetch, agora = Date.now } = {}) {
  let ultimoPedido = -Infinity;
  const cache = new Map();

  async function respeitarIntervalo() {
    const espera = ultimoPedido + INTERVALO_MINIMO_MS - agora();
    if (espera > 0) {
      await esperar(espera);
    }
    ultimoPedido = agora();
  }

  return {
    // Devolve até 5 endereços no Brasil para o texto. Lista vazia se não achar.
    async geocodificar(texto) {
      const chave = texto.trim().toLowerCase();
      if (cache.has(chave)) {
        return cache.get(chave);
      }

      const parametros = new URLSearchParams({
        q: texto.trim(),
        format: 'jsonv2',
        countrycodes: 'br',
        limit: String(LIMITE_RESULTADOS),
        'accept-language': 'pt-BR',
      });

      await respeitarIntervalo();
      let resposta;
      try {
        resposta = await buscar(`${URL_NOMINATIM}?${parametros}`, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        });
      } catch {
        throw criarErro('Sem conexão com a internet', ERRO_SEM_CONEXAO);
      }
      if (!resposta.ok) {
        throw criarErro(`Serviço de endereços indisponível (${resposta.status})`, 'servico-indisponivel');
      }

      const candidatos = (await resposta.json())
        .map(paraCandidato)
        .filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));

      if (cache.size >= TAMANHO_CACHE) {
        cache.delete(cache.keys().next().value);
      }
      cache.set(chave, candidatos);
      return candidatos;
    },
  };
}
