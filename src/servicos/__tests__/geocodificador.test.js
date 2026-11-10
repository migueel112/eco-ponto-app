// Geocodificador (Nominatim) com a rede simulada: parâmetros, conversão,
// intervalo de 1 segundo, cache e erros.
import { criarGeocodificador, URL_NOMINATIM, USER_AGENT, INTERVALO_MINIMO_MS } from '../geocodificador';

const RESPOSTA = [
  { display_name: 'Avenida Paulista, Bela Vista, São Paulo', lat: '-23.5614', lon: '-46.6559' },
  { display_name: 'Sem coordenadas', lat: 'x', lon: 'y' },
];

const ok = (dados) => ({ ok: true, status: 200, json: async () => dados });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('pede ao Nominatim no Brasil, em português, e identifica o app', async () => {
  const buscar = jest.fn(async () => ok(RESPOSTA));
  const resultado = await criarGeocodificador({ buscar }).geocodificar('  Avenida Paulista, 1578 ');

  const [url, opcoes] = buscar.mock.calls[0];
  expect(url.startsWith(`${URL_NOMINATIM}?`)).toBe(true);
  const parametros = new URL(url).searchParams;
  expect(parametros.get('q')).toBe('Avenida Paulista, 1578');
  expect(parametros.get('format')).toBe('jsonv2');
  expect(parametros.get('countrycodes')).toBe('br');
  expect(parametros.get('limit')).toBe('5');
  expect(parametros.get('accept-language')).toBe('pt-BR');
  expect(opcoes.headers['User-Agent']).toBe(USER_AGENT);

  // Converte lat/lon (texto) em número e descarta resultados sem coordenadas.
  expect(resultado).toEqual([
    { descricao: 'Avenida Paulista, Bela Vista, São Paulo', latitude: -23.5614, longitude: -46.6559 },
  ]);
});

test('espera 1 segundo entre dois pedidos (política do Nominatim)', async () => {
  let relogio = 0;
  const buscar = jest.fn(async () => ok([]));
  const geocodificador = criarGeocodificador({ buscar, agora: () => relogio });

  await geocodificador.geocodificar('primeiro');
  relogio = 300;
  const segundo = geocodificador.geocodificar('segundo');
  await Promise.resolve();
  expect(buscar).toHaveBeenCalledTimes(1);

  relogio = INTERVALO_MINIMO_MS;
  await jest.advanceTimersByTimeAsync(INTERVALO_MINIMO_MS - 300);
  await segundo;
  expect(buscar).toHaveBeenCalledTimes(2);
});

test('repetir o mesmo texto usa o cache, sem novo pedido', async () => {
  const buscar = jest.fn(async () => ok(RESPOSTA));
  let relogio = 0;
  const geocodificador = criarGeocodificador({ buscar, agora: () => (relogio += 2000) });
  await geocodificador.geocodificar('Rua A');
  await geocodificador.geocodificar('  rua a ');
  expect(buscar).toHaveBeenCalledTimes(1);
});

test('o cache guarda no máximo 50 endereços', async () => {
  const buscar = jest.fn(async () => ok([]));
  let relogio = 0;
  const geocodificador = criarGeocodificador({ buscar, agora: () => (relogio += 2000) });
  for (let i = 0; i <= 50; i += 1) {
    await geocodificador.geocodificar(`rua ${i}`);
  }
  await geocodificador.geocodificar('rua 0'); // o mais antigo saiu do cache
  expect(buscar).toHaveBeenCalledTimes(52);
});

test('sem internet, lança erro com o código sem-conexao', async () => {
  const buscar = jest.fn(async () => {
    throw new TypeError('Network request failed');
  });
  await expect(criarGeocodificador({ buscar }).geocodificar('Rua A')).rejects.toMatchObject({
    codigo: 'sem-conexao',
  });
});

test('resposta de erro do servidor lança serviço indisponível', async () => {
  const buscar = jest.fn(async () => ({ ok: false, status: 429 }));
  await expect(criarGeocodificador({ buscar }).geocodificar('Rua A')).rejects.toMatchObject({
    codigo: 'servico-indisponivel',
  });
});

test('usa o fetch e o relógio padrão quando nada é informado', async () => {
  global.fetch = jest.fn(async () => ok([]));
  await expect(criarGeocodificador().geocodificar('Rua B')).resolves.toEqual([]);
  expect(global.fetch).toHaveBeenCalled();
});
