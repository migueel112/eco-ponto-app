// ControladorBusca com serviços fictícios em memória (sem Firebase e sem internet).
// Casos: CT01 (Estado e cidade), CT07 (ativos, inativos e cidade vazia),
// CT13 (filtro de materiais), CT03 e CT05/CT06 (mais próximo e endereço).
import { criarControladorBusca, MENSAGENS_BUSCA } from '../ControladorBusca';

const PRACA_DA_SE = { latitude: -23.5505, longitude: -46.6333 };

const ponto = (id, nome, uf, cidade, latitude, longitude, extra = {}) => ({
  id,
  nome,
  uf,
  cidade,
  latitude,
  longitude,
  situacao: 'ativo',
  materiais: ['papel'],
  horarios: [{ diaDaSemana: 1, horaAbertura: '08:00', horaFechamento: '17:00' }],
  ...extra,
});

const PONTOS = [
  ponto('1', 'Ecoponto Sé', 'SP', 'São Paulo', -23.5510, -46.6340),
  ponto('2', 'Ecoponto Paulista', 'SP', 'São Paulo', -23.5614, -46.6559, { materiais: ['papel', 'vidro'] }),
  ponto('3', 'Ecoponto Inativo', 'SP', 'Santos', -23.9608, -46.3336, { situacao: 'inativo' }),
  ponto('4', 'Ecoponto Campinas', 'SP', 'Campinas', -22.9056, -47.0608),
  ponto('5', 'Ecoponto Abc', 'SP', ' são paulo ', -23.5600, -46.6400),
  ponto('6', 'Ecoponto Carioca', 'RJ', 'Rio de Janeiro', -22.9068, -43.1729, { materiais: ['vidro'] }),
  ponto('7', 'Ecoponto Atibaia', 'SP', 'Atibaia', -23.1171, -46.5563),
];

// Repositório fictício: filtra por uf e cidade como o Firestore fará.
// De propósito devolve também os inativos, para provar que o controlador
// aplica a RN01 por conta própria.
function criarRepositorio(pontos = PONTOS) {
  return {
    listarPontosAtivos: jest.fn(async ({ uf, cidade } = {}) =>
      pontos.filter(
        (p) =>
          (uf === undefined || p.uf === uf) &&
          (cidade === undefined || p.cidade.trim().toLowerCase() === cidade.trim().toLowerCase())
      )
    ),
  };
}

function criarControlador({ pontos, candidatos = [] } = {}) {
  const repositorioPontos = criarRepositorio(pontos);
  const geocodificador = { geocodificar: jest.fn(async () => candidatos) };
  return {
    controlador: criarControladorBusca({ repositorioPontos, geocodificador }),
    repositorioPontos,
    geocodificador,
  };
}

describe('listarEstados', () => {
  test('só Estados com ponto ativo, em ordem alfabética', async () => {
    const { controlador } = criarControlador();
    expect(await controlador.listarEstados()).toEqual([
      { sigla: 'RJ', nome: 'Rio de Janeiro' },
      { sigla: 'SP', nome: 'São Paulo' },
    ]);
  });

  test('Estado só com ponto inativo não aparece', async () => {
    const { controlador } = criarControlador({
      pontos: [ponto('1', 'X', 'MG', 'Belo Horizonte', -19.9, -43.9, { situacao: 'inativo' })],
    });
    expect(await controlador.listarEstados()).toEqual([]);
  });
});

describe('listarCidades (CT01)', () => {
  test('cidades com ponto ativo, sem repetir, em ordem alfabética', async () => {
    const { controlador, repositorioPontos } = criarControlador();
    expect(await controlador.listarCidades('SP')).toEqual(['Atibaia', 'Campinas', 'São Paulo']);
    expect(repositorioPontos.listarPontosAtivos).toHaveBeenCalledWith({ uf: 'SP' });
  });

  test('ignora ponto sem cidade', async () => {
    const { controlador } = criarControlador({
      pontos: [ponto('1', 'X', 'SP', '  ', -23.5, -46.6), ponto('2', 'Y', 'SP', 'Osasco', -23.5, -46.7)],
    });
    expect(await controlador.listarCidades('SP')).toEqual(['Osasco']);
  });

  test('Estado sem pontos devolve lista vazia', async () => {
    const { controlador } = criarControlador();
    expect(await controlador.listarCidades('AM')).toEqual([]);
  });
});

describe('listarPontos (CT07, CT13)', () => {
  const SAO_PAULO = { uf: 'SP', cidade: 'São Paulo' };

  test('só ativos da cidade, em ordem alfabética sem origem', async () => {
    const { controlador } = criarControlador();
    const { pontos, mensagem } = await controlador.listarPontos(SAO_PAULO);
    expect(pontos.map((p) => p.id)).toEqual(['5', '2', '1']);
    expect(mensagem).toBeNull();
  });

  test('com origem, ordena por distância e informa a distância', async () => {
    const { controlador } = criarControlador();
    const { pontos } = await controlador.listarPontos(SAO_PAULO, [], PRACA_DA_SE);
    expect(pontos.map((p) => p.id)).toEqual(['1', '5', '2']);
    expect(pontos[0].distanciaKm).toBeLessThan(0.1);
  });

  test('cidade só com inativos mostra a mensagem de cidade vazia', async () => {
    const { controlador } = criarControlador();
    expect(await controlador.listarPontos({ uf: 'SP', cidade: 'Santos' })).toEqual({
      pontos: [],
      mensagem: MENSAGENS_BUSCA.cidadeSemPontos,
      podeLimparFiltro: false,
    });
  });

  test('filtro por materiais: só os que aceitam todos', async () => {
    const { controlador } = criarControlador();
    const { pontos } = await controlador.listarPontos(SAO_PAULO, ['papel', 'vidro']);
    expect(pontos.map((p) => p.id)).toEqual(['2']);
  });

  test('filtro sem resultado avisa e oferece limpar o filtro', async () => {
    const { controlador } = criarControlador();
    expect(await controlador.listarPontos(SAO_PAULO, ['metal'])).toEqual({
      pontos: [],
      mensagem: MENSAGENS_BUSCA.filtroSemResultado,
      podeLimparFiltro: true,
    });
  });
});

describe('buscarMaisProximo (CT03)', () => {
  test('acha o ponto ativo mais próximo da posição', async () => {
    const { controlador } = criarControlador();
    const { resultado, mensagem } = await controlador.buscarMaisProximo(PRACA_DA_SE);
    expect(resultado.ponto.id).toBe('1');
    expect(mensagem).toBeNull();
  });

  test('respeita o filtro de materiais', async () => {
    const { controlador } = criarControlador();
    const { resultado } = await controlador.buscarMaisProximo(PRACA_DA_SE, ['vidro']);
    expect(resultado.ponto.id).toBe('2');
  });

  test('sem ponto que atenda, avisa', async () => {
    const { controlador } = criarControlador();
    expect(await controlador.buscarMaisProximo(PRACA_DA_SE, ['eletrônico'])).toEqual({
      resultado: null,
      mensagem: MENSAGENS_BUSCA.nenhumProximoComFiltro,
    });
  });

  test('sem pontos e sem filtro, a mensagem não fala em materiais', async () => {
    const { controlador } = criarControlador({ pontos: [] });
    expect(await controlador.buscarMaisProximo(PRACA_DA_SE)).toEqual({
      resultado: null,
      mensagem: 'Nenhum ponto de coleta ativo foi encontrado',
    });
  });

  test('busca no país todo, sem filtro de Estado', async () => {
    const { controlador, repositorioPontos } = criarControlador();
    await controlador.buscarMaisProximo(PRACA_DA_SE);
    expect(repositorioPontos.listarPontosAtivos).toHaveBeenCalledWith({});
  });

  test('posição inválida gera erro', async () => {
    const { controlador } = criarControlador();
    await expect(controlador.buscarMaisProximo({ latitude: 999, longitude: 0 })).rejects.toThrow(
      'Localização inválida'
    );
  });

  test('erro do repositório chega à tela', async () => {
    const { controlador, repositorioPontos } = criarControlador();
    repositorioPontos.listarPontosAtivos.mockRejectedValueOnce(new Error('Sem conexão'));
    await expect(controlador.buscarMaisProximo(PRACA_DA_SE)).rejects.toThrow('Sem conexão');
  });

  test('o resultado não carrega a posição do usuário (RNF04)', async () => {
    const { controlador } = criarControlador();
    const resposta = await controlador.buscarMaisProximo({ latitude: -23.5501, longitude: -46.6301 });
    expect(JSON.stringify(resposta)).not.toContain('-23.5501');
  });
});

describe('buscarPorEndereco (CT05, CT06)', () => {
  const PAULISTA = { descricao: 'Avenida Paulista, 1000, São Paulo', latitude: -23.5650, longitude: -46.6520 };
  const OUTRA = { descricao: 'Rua Paulista, Campinas', latitude: -22.9, longitude: -47.06 };

  test('endereço único: busca o mais próximo a partir dele', async () => {
    const { controlador, geocodificador } = criarControlador({ candidatos: [PAULISTA] });
    const resposta = await controlador.buscarPorEndereco('  Avenida Paulista, 1000 ');
    expect(geocodificador.geocodificar).toHaveBeenCalledWith('Avenida Paulista, 1000');
    expect(resposta.situacao).toBe('encontrado');
    expect(resposta.endereco).toBe(PAULISTA.descricao);
    expect(resposta.origem).toEqual({ latitude: PAULISTA.latitude, longitude: PAULISTA.longitude });
    expect(resposta.resultado.ponto.id).toBe('2');
  });

  test('endereço inexistente avisa (CT06)', async () => {
    const { controlador } = criarControlador({ candidatos: [] });
    expect(await controlador.buscarPorEndereco('Rua Que Não Existe 999')).toEqual({
      situacao: 'naoEncontrado',
      mensagem: MENSAGENS_BUSCA.enderecoNaoEncontrado,
    });
  });

  test('endereço ambíguo devolve sugestões (CT06)', async () => {
    const { controlador } = criarControlador({ candidatos: [PAULISTA, OUTRA] });
    expect(await controlador.buscarPorEndereco('Paulista')).toEqual({
      situacao: 'sugestoes',
      sugestoes: [PAULISTA, OUTRA],
      mensagem: MENSAGENS_BUSCA.enderecoAmbiguo,
    });
  });

  test('texto vazio não chama o geocodificador', async () => {
    const { controlador, geocodificador } = criarControlador();
    expect(await controlador.buscarPorEndereco('   ')).toEqual({
      situacao: 'naoEncontrado',
      mensagem: MENSAGENS_BUSCA.enderecoVazio,
    });
    expect(await controlador.buscarPorEndereco(undefined)).toMatchObject({ situacao: 'naoEncontrado' });
    expect(geocodificador.geocodificar).not.toHaveBeenCalled();
  });

  test('escolher uma sugestão continua a busca', async () => {
    const { controlador } = criarControlador();
    const { buscarPorSugestao } = controlador;
    const resposta = await buscarPorSugestao(OUTRA);
    expect(resposta.situacao).toBe('encontrado');
    expect(resposta.resultado.ponto.id).toBe('4');
  });

  test('sugestão sem ponto que atenda ao filtro avisa', async () => {
    const { controlador } = criarControlador();
    const resposta = await controlador.buscarPorSugestao(PAULISTA, ['eletrônico']);
    expect(resposta.resultado).toBeNull();
    expect(resposta.mensagem).toBe(MENSAGENS_BUSCA.nenhumProximoComFiltro);
  });
});
