// RN06 – ponto mais próximo por Haversine, com desempate pelo ponto aberto.
import {
  TIPO_ORIGEM_GPS,
  TIPO_ORIGEM_ENDERECO,
  maisProximo,
  criarBusca,
} from '../busca';

const PRACA_DA_SE = { latitude: -23.5505, longitude: -46.6333 };
// 10/11/2026 é terça-feira (dia 2), 10h.
const TERCA_10H = new Date(2026, 10, 10, 10, 0);
const HORARIO_TERCA = [{ diaDaSemana: 2, horaAbertura: '08:00', horaFechamento: '17:00' }];
const HORARIO_DOMINGO = [{ diaDaSemana: 0, horaAbertura: '08:00', horaFechamento: '17:00' }];

const ponto = (nome, latitude, longitude, extra = {}) => ({
  nome,
  latitude,
  longitude,
  situacao: 'ativo',
  materiais: ['papel'],
  horarios: HORARIO_TERCA,
  ...extra,
});

const perto = ponto('Perto', -23.5510, -46.6340);
const medio = ponto('Médio', -23.5614, -46.6559, { materiais: ['papel', 'vidro'] });
const longe = ponto('Longe', -23.5874, -46.6576, { materiais: ['papel', 'vidro'] });

describe('maisProximo', () => {
  test('escolhe o ponto de menor distância', () => {
    const resultado = maisProximo(PRACA_DA_SE, [longe, perto, medio], [], TERCA_10H);
    expect(resultado.ponto).toBe(perto);
    expect(resultado.distanciaKm).toBeLessThan(0.1);
  });

  test('ignora pontos inativos (RN01)', () => {
    const pertoInativo = { ...perto, situacao: 'inativo' };
    expect(maisProximo(PRACA_DA_SE, [pertoInativo, medio], [], TERCA_10H).ponto).toBe(medio);
  });

  test('considera só os pontos que atendem ao filtro de materiais', () => {
    expect(maisProximo(PRACA_DA_SE, [perto, medio, longe], ['vidro'], TERCA_10H).ponto).toBe(medio);
  });

  test('ignora pontos sem coordenadas válidas', () => {
    const semCoordenadas = ponto('Sem', undefined, undefined);
    expect(maisProximo(PRACA_DA_SE, [semCoordenadas, longe], [], TERCA_10H).ponto).toBe(longe);
  });

  test('empate na distância: vence o ponto aberto', () => {
    const fechado = ponto('Fechado', -23.5600, -46.6400, { horarios: HORARIO_DOMINGO });
    const aberto = ponto('Aberto', -23.5600, -46.6400);
    expect(maisProximo(PRACA_DA_SE, [fechado, aberto], [], TERCA_10H).ponto).toBe(aberto);
    expect(maisProximo(PRACA_DA_SE, [aberto, fechado], [], TERCA_10H).ponto).toBe(aberto);
  });

  test('empate entre dois abertos: fica o primeiro da lista', () => {
    const a = ponto('A', -23.5600, -46.6400);
    const b = ponto('B', -23.5600, -46.6400);
    expect(maisProximo(PRACA_DA_SE, [a, b], [], TERCA_10H).ponto).toBe(a);
  });

  test('o mais perto vence mesmo fechado', () => {
    const pertoFechado = { ...perto, horarios: HORARIO_DOMINGO };
    expect(maisProximo(PRACA_DA_SE, [medio, pertoFechado], [], TERCA_10H).ponto).toBe(pertoFechado);
  });

  test('null quando nenhum ponto serve', () => {
    expect(maisProximo(PRACA_DA_SE, [], [], TERCA_10H)).toBeNull();
    expect(maisProximo(PRACA_DA_SE, [perto], ['metal'], TERCA_10H)).toBeNull();
  });

  test('usa valores padrão para filtro e data', () => {
    expect(maisProximo(PRACA_DA_SE, [medio, perto]).ponto).toBe(perto);
  });

  test('lança erro com origem inválida', () => {
    expect(() => maisProximo(null, [perto])).toThrow('Localização inválida');
  });
});

describe('criarBusca', () => {
  test('guarda dataHora e tipoOrigem e calcula o mais próximo', () => {
    const busca = criarBusca(TIPO_ORIGEM_GPS, PRACA_DA_SE, TERCA_10H);
    expect(busca.dataHora).toBe(TERCA_10H);
    expect(busca.tipoOrigem).toBe('GPS');
    expect(busca.calcularMaisProximo([medio, perto]).ponto).toBe(perto);
    expect(busca.calcularMaisProximo([perto, medio], ['vidro']).ponto).toBe(medio);
  });

  test('calcula a distância até um ponto', () => {
    const busca = criarBusca(TIPO_ORIGEM_ENDERECO, PRACA_DA_SE);
    expect(busca.distanciaHaversine(medio)).toBeCloseTo(2.6, 1);
    expect(busca.distanciaHaversine({ nome: 'Sem' })).toBeNull();
  });

  test('não expõe a origem nem guarda o objeto recebido', () => {
    const origem = { ...PRACA_DA_SE };
    const busca = criarBusca(TIPO_ORIGEM_GPS, origem);
    origem.latitude = 0;
    expect(busca).not.toHaveProperty('origem');
    expect(JSON.stringify(busca)).not.toContain('-23.5505');
    expect(busca.calcularMaisProximo([medio, perto]).ponto).toBe(perto);
  });

  test('encerrar descarta a origem e impede novos cálculos', () => {
    const busca = criarBusca(TIPO_ORIGEM_GPS, PRACA_DA_SE);
    expect(busca.estaEncerrada()).toBe(false);
    busca.encerrar();
    expect(busca.estaEncerrada()).toBe(true);
    expect(() => busca.calcularMaisProximo([perto])).toThrow('Busca encerrada');
    expect(() => busca.distanciaHaversine(perto)).toThrow('Busca encerrada');
  });

  test('recusa tipo de origem ou localização inválidos', () => {
    expect(() => criarBusca('wifi', PRACA_DA_SE)).toThrow('Tipo de origem inválido');
    expect(() => criarBusca(TIPO_ORIGEM_GPS, { latitude: 'x', longitude: 0 })).toThrow(
      'Localização inválida'
    );
  });
});
