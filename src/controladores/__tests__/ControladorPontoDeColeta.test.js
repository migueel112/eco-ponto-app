// ControladorPontoDeColeta com serviços fictícios (sem Firebase e sem internet).
// Casos: CT08 (detalhes, distância, aberto ou fechado) e CT12 (rota com e sem internet).
import {
  criarControladorPontoDeColeta,
  ERRO_SEM_CONEXAO,
  MENSAGENS_PONTO,
} from '../ControladorPontoDeColeta';

const PRACA_DA_SE = { latitude: -23.5505, longitude: -46.6333 };
// 10/11/2026 é terça-feira (dia 2).
const TERCA_10H = new Date(2026, 10, 10, 10, 0);
const TERCA_20H = new Date(2026, 10, 10, 20, 0);

const PAULISTA = {
  id: 'p1',
  nome: 'Ecoponto Paulista',
  situacao: 'ativo',
  latitude: -23.5614,
  longitude: -46.6559,
  materiais: ['papel'],
  horarios: [{ diaDaSemana: 2, horaAbertura: '08:00', horaFechamento: '17:00' }],
};
const INATIVO = { ...PAULISTA, id: 'p2', situacao: 'inativo' };

const ROTA = {
  distanciaKm: 3.4,
  tempoEstimadoMin: 9,
  trajeto: [PRACA_DA_SE, { latitude: -23.5614, longitude: -46.6559 }],
};

function criarControlador({ rota = ROTA, erroRota = null } = {}) {
  const pontos = { p1: PAULISTA, p2: INATIVO };
  const repositorioPontos = { obterPonto: jest.fn(async (id) => pontos[id] ?? null) };
  const servicoRotas = {
    calcularRota: jest.fn(async () => {
      if (erroRota) {
        throw erroRota;
      }
      return rota;
    }),
  };
  return {
    controlador: criarControladorPontoDeColeta({ repositorioPontos, servicoRotas }),
    servicoRotas,
  };
}

describe('obterDetalhes (CT08)', () => {
  test('com posição de referência mostra a distância', async () => {
    const { controlador } = criarControlador();
    const detalhes = await controlador.obterDetalhes('p1', PRACA_DA_SE, TERCA_10H);
    expect(detalhes.ponto).toBe(PAULISTA);
    expect(detalhes.distanciaKm).toBeCloseTo(2.6, 1);
    expect(detalhes.mensagem).toBeNull();
  });

  test('sem posição de referência não mostra a distância', async () => {
    const { controlador } = criarControlador();
    expect((await controlador.obterDetalhes('p1', null, TERCA_10H)).distanciaKm).toBeNull();
  });

  test('marca aberto ou fechado conforme o horário', async () => {
    const { controlador } = criarControlador();
    expect((await controlador.obterDetalhes('p1', null, TERCA_10H)).aberto).toBe(true);
    expect((await controlador.obterDetalhes('p1', null, TERCA_20H)).aberto).toBe(false);
  });

  test('usa a data e hora atuais por padrão', async () => {
    const { controlador } = criarControlador();
    expect(typeof (await controlador.obterDetalhes('p1')).aberto).toBe('boolean');
  });

  test('ponto inativo ou inexistente não é mostrado (RN01)', async () => {
    const { controlador } = criarControlador();
    const esperado = { ponto: null, mensagem: MENSAGENS_PONTO.naoEncontrado };
    expect(await controlador.obterDetalhes('p2', PRACA_DA_SE)).toEqual(esperado);
    expect(await controlador.obterDetalhes('nao-existe')).toEqual(esperado);
  });
});

describe('calcularDistancia', () => {
  test('distância em km com origem válida, senão null', () => {
    const { controlador } = criarControlador();
    expect(controlador.calcularDistancia(PRACA_DA_SE, PAULISTA)).toBeCloseTo(2.6, 1);
    expect(controlador.calcularDistancia(null, PAULISTA)).toBeNull();
    expect(controlador.calcularDistancia(PRACA_DA_SE, { nome: 'sem coordenadas' })).toBeNull();
  });
});

describe('calcularRota (CT12)', () => {
  test('com internet: trajeto, distância, tempo e destino', async () => {
    const { controlador, servicoRotas } = criarControlador();
    const resposta = await controlador.calcularRota(PRACA_DA_SE, 'p1');
    expect(resposta).toEqual({
      rota: ROTA,
      destino: { latitude: -23.5614, longitude: -46.6559, nome: 'Ecoponto Paulista' },
      mensagem: null,
    });
    expect(servicoRotas.calcularRota).toHaveBeenCalledWith(PRACA_DA_SE, {
      latitude: -23.5614,
      longitude: -46.6559,
    });
  });

  test('sem internet: informa que não é possível calcular a rota', async () => {
    const erro = Object.assign(new Error('offline'), { codigo: ERRO_SEM_CONEXAO });
    const { controlador } = criarControlador({ erroRota: erro });
    const resposta = await controlador.calcularRota(PRACA_DA_SE, 'p1');
    expect(resposta.rota).toBeNull();
    expect(resposta.mensagem).toBe(MENSAGENS_PONTO.semConexao);
    expect(resposta.destino.nome).toBe('Ecoponto Paulista');
  });

  test('outro erro do serviço: mensagem genérica', async () => {
    const { controlador } = criarControlador({ erroRota: new Error('falhou') });
    expect((await controlador.calcularRota(PRACA_DA_SE, 'p1')).mensagem).toBe(MENSAGENS_PONTO.erroRota);
  });

  test('falha sem objeto de erro também é tratada', async () => {
    const { controlador, servicoRotas } = criarControlador();
    servicoRotas.calcularRota.mockRejectedValueOnce(undefined);
    expect((await controlador.calcularRota(PRACA_DA_SE, 'p1')).mensagem).toBe(MENSAGENS_PONTO.erroRota);
  });

  test('sem origem não chama o serviço de rotas', async () => {
    const { controlador, servicoRotas } = criarControlador();
    expect(await controlador.calcularRota(null, 'p1')).toEqual({
      rota: null,
      mensagem: MENSAGENS_PONTO.semOrigem,
    });
    expect(servicoRotas.calcularRota).not.toHaveBeenCalled();
  });

  test('ponto inativo não tem rota (RN01)', async () => {
    const { controlador, servicoRotas } = criarControlador();
    expect(await controlador.calcularRota(PRACA_DA_SE, 'p2')).toEqual({
      rota: null,
      mensagem: MENSAGENS_PONTO.naoEncontrado,
    });
    expect(servicoRotas.calcularRota).not.toHaveBeenCalled();
  });

  test('a resposta não carrega a posição do usuário (RNF04)', async () => {
    const { controlador } = criarControlador({ rota: { ...ROTA, trajeto: [] } });
    const resposta = await controlador.calcularRota({ latitude: -23.5501, longitude: -46.6301 }, 'p1');
    expect(JSON.stringify(resposta)).not.toContain('-23.5501');
  });
});
