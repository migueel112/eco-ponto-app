// Serviço de rotas (OSRM) com a rede simulada (CT12).
import { criarServicoRotas, URL_OSRM, USER_AGENT, ERRO_SEM_ROTA } from '../rotas';

const ORIGEM = { latitude: -23.5505, longitude: -46.6333 };
const DESTINO = { latitude: -23.5614, longitude: -46.6559 };

const resposta = (dados, status = 200) => ({ ok: status === 200, status, json: async () => dados });
const ROTA_OK = {
  code: 'Ok',
  routes: [
    {
      distance: 3456.7,
      duration: 545,
      geometry: { type: 'LineString', coordinates: [[-46.6333, -23.5505], [-46.6559, -23.5614]] },
    },
  ],
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('pede a rota com longitude,latitude e converte a resposta', async () => {
  const buscar = jest.fn(async () => resposta(ROTA_OK));
  const rota = await criarServicoRotas({ buscar }).calcularRota(ORIGEM, DESTINO);

  const [url, opcoes] = buscar.mock.calls[0];
  expect(url).toBe(`${URL_OSRM}/-46.6333,-23.5505;-46.6559,-23.5614?overview=full&geometries=geojson`);
  expect(opcoes.headers['User-Agent']).toBe(USER_AGENT);
  expect(rota.distanciaKm).toBeCloseTo(3.4567, 6);
  expect(rota.tempoEstimadoMin).toBe(9);
  expect(rota.trajeto).toEqual([ORIGEM, DESTINO]);
});

test('trajeto muito curto conta pelo menos 1 minuto', async () => {
  const curta = { code: 'Ok', routes: [{ ...ROTA_OK.routes[0], duration: 10 }] };
  const rota = await criarServicoRotas({ buscar: async () => resposta(curta) }).calcularRota(ORIGEM, DESTINO);
  expect(rota.tempoEstimadoMin).toBe(1);
});

test('sem internet, lança erro sem-conexao (CT12)', async () => {
  const buscar = async () => {
    throw new TypeError('Network request failed');
  };
  await expect(criarServicoRotas({ buscar }).calcularRota(ORIGEM, DESTINO)).rejects.toMatchObject({
    codigo: 'sem-conexao',
  });
});

test.each([
  ['sem rota', resposta({ code: 'NoRoute', routes: [] }, 400)],
  ['resposta que não é JSON', { ok: false, status: 502, json: async () => JSON.parse('<html>') }],
])('%s lança erro sem-rota', async (_, falha) => {
  await expect(
    criarServicoRotas({ buscar: async () => falha }).calcularRota(ORIGEM, DESTINO)
  ).rejects.toMatchObject({ codigo: ERRO_SEM_ROTA });
});

test('espera 1 segundo entre dois pedidos', async () => {
  let relogio = 0;
  const buscar = jest.fn(async () => resposta(ROTA_OK));
  const servico = criarServicoRotas({ buscar, agora: () => relogio });
  await servico.calcularRota(ORIGEM, DESTINO);
  relogio = 400;
  const segundo = servico.calcularRota(ORIGEM, DESTINO);
  await Promise.resolve();
  expect(buscar).toHaveBeenCalledTimes(1);
  relogio = 1000;
  await jest.advanceTimersByTimeAsync(600);
  await segundo;
  expect(buscar).toHaveBeenCalledTimes(2);
});

test('usa o fetch e o relógio padrão quando nada é informado', async () => {
  global.fetch = jest.fn(async () => resposta(ROTA_OK));
  await expect(criarServicoRotas().calcularRota(ORIGEM, DESTINO)).resolves.toMatchObject({ tempoEstimadoMin: 9 });
});
