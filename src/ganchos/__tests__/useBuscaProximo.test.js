// Gancho useBuscaProximo: GPS, endereço, sugestões e mensagens de erro (CT02, CT03, CT05, CT06).
import { Text } from 'react-native';
import { render, act } from '@testing-library/react-native';
import useBuscaProximo, { MENSAGENS_PROXIMO } from '../useBuscaProximo';
import { controladorBusca } from '../../montagem';
import { obterPosicaoAtual } from '../../servicos/localizacao';

jest.mock('../../montagem', () => ({
  controladorBusca: { buscarMaisProximo: jest.fn(), buscarPorEndereco: jest.fn(), buscarPorSugestao: jest.fn() },
}));
jest.mock('../../servicos/localizacao', () => ({
  ...jest.requireActual('../../servicos/localizacao'),
  obterPosicaoAtual: jest.fn(),
}));

const ORIGEM = { latitude: -23.55, longitude: -46.63 };
const RESULTADO = { ponto: { id: 'p1', nome: 'Ecoponto Teste Sé' }, distanciaKm: 0.1 };
const erro = (codigo, extra = {}) => Object.assign(new Error(codigo), { codigo, ...extra });

let busca;
function Sonda() {
  busca = useBuscaProximo();
  return <Text>{busca.estado.fase}</Text>;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await render(<Sonda />);
});

test('começa ocioso e limpar volta ao início', async () => {
  expect(busca.estado).toEqual({ fase: 'ocioso' });
  controladorBusca.buscarMaisProximo.mockResolvedValue({ resultado: RESULTADO, mensagem: null });
  obterPosicaoAtual.mockResolvedValue(ORIGEM);
  await act(() => busca.usarGps());
  await act(async () => busca.limpar());
  expect(busca.estado).toEqual({ fase: 'ocioso' });
});

describe('GPS', () => {
  test('mostra "buscando" e depois o mais próximo com a origem (CT03)', async () => {
    let liberar;
    obterPosicaoAtual.mockReturnValue(new Promise((r) => (liberar = r)));
    controladorBusca.buscarMaisProximo.mockResolvedValue({ resultado: RESULTADO, mensagem: null });

    let pedido;
    await act(async () => {
      pedido = busca.usarGps();
    });
    expect(busca.estado).toEqual({ fase: 'buscando', textoBuscando: MENSAGENS_PROXIMO.obtendoLocalizacao });

    await act(async () => {
      liberar(ORIGEM);
      await pedido;
    });
    expect(controladorBusca.buscarMaisProximo).toHaveBeenCalledWith(ORIGEM);
    expect(busca.estado).toEqual({ fase: 'pronto', resultado: RESULTADO, origem: ORIGEM, endereco: null });
  });

  test('sem ponto que atenda, mostra o aviso do controlador', async () => {
    obterPosicaoAtual.mockResolvedValue(ORIGEM);
    controladorBusca.buscarMaisProximo.mockResolvedValue({ resultado: null, mensagem: 'Nenhum ponto' });
    await act(() => busca.usarGps());
    expect(busca.estado).toEqual({ fase: 'aviso', mensagem: 'Nenhum ponto' });
  });

  test.each([
    [erro('permissao-negada', { podePerguntarDeNovo: true }), MENSAGENS_PROXIMO.permissaoNegada, false],
    [
      erro('permissao-negada', { podePerguntarDeNovo: false }),
      `${MENSAGENS_PROXIMO.permissaoNegada} ${MENSAGENS_PROXIMO.permissaoNosAjustes}`,
      true,
    ],
    [erro('gps-desligado'), MENSAGENS_PROXIMO.gpsDesligado, false],
    [erro('tempo-esgotado'), MENSAGENS_PROXIMO.tempoEsgotado, false],
    [erro('sem-conexao'), MENSAGENS_PROXIMO.semConexao, false],
    [new Error('qualquer'), MENSAGENS_PROXIMO.erroGenerico, false],
    [undefined, MENSAGENS_PROXIMO.erroGenerico, false],
  ])('erro do GPS vira mensagem (CT02): %#', async (falha, mensagem, abrirAjustes) => {
    obterPosicaoAtual.mockRejectedValue(falha);
    await act(() => busca.usarGps());
    expect(busca.estado).toEqual({ fase: 'aviso', mensagem, abrirAjustes });
    expect(controladorBusca.buscarMaisProximo).not.toHaveBeenCalled();
  });
});

describe('endereço', () => {
  test('endereço único mostra o resultado com o endereço pesquisado (CT05)', async () => {
    controladorBusca.buscarPorEndereco.mockResolvedValue({
      situacao: 'encontrado',
      endereco: 'Avenida Paulista',
      origem: ORIGEM,
      resultado: RESULTADO,
      mensagem: null,
    });
    await act(() => busca.pesquisarEndereco('Avenida Paulista'));
    expect(controladorBusca.buscarPorEndereco).toHaveBeenCalledWith('Avenida Paulista');
    expect(busca.estado).toEqual({ fase: 'pronto', resultado: RESULTADO, origem: ORIGEM, endereco: 'Avenida Paulista' });
  });

  test('endereço ambíguo mostra sugestões; escolher uma continua a busca (CT06)', async () => {
    const sugestao = { descricao: 'Rua A, Santos', latitude: -23.9, longitude: -46.3 };
    controladorBusca.buscarPorEndereco.mockResolvedValue({
      situacao: 'sugestoes',
      sugestoes: [sugestao],
      mensagem: 'Escolha o correto',
    });
    await act(() => busca.pesquisarEndereco('Rua A'));
    expect(busca.estado).toEqual({ fase: 'sugestoes', sugestoes: [sugestao], mensagem: 'Escolha o correto' });

    controladorBusca.buscarPorSugestao.mockResolvedValue({
      situacao: 'encontrado',
      endereco: sugestao.descricao,
      origem: { latitude: -23.9, longitude: -46.3 },
      resultado: RESULTADO,
      mensagem: null,
    });
    await act(() => busca.escolherSugestao(sugestao));
    expect(controladorBusca.buscarPorSugestao).toHaveBeenCalledWith(sugestao);
    expect(busca.estado.fase).toBe('pronto');
    expect(busca.estado.endereco).toBe('Rua A, Santos');
  });

  test('endereço inexistente mostra o aviso (CT06)', async () => {
    controladorBusca.buscarPorEndereco.mockResolvedValue({ situacao: 'naoEncontrado', mensagem: 'Não encontrado' });
    await act(() => busca.pesquisarEndereco('xyz'));
    expect(busca.estado).toEqual({ fase: 'aviso', mensagem: 'Não encontrado' });
  });

  test('sem internet, avisa', async () => {
    controladorBusca.buscarPorEndereco.mockRejectedValue(erro('sem-conexao'));
    await act(() => busca.pesquisarEndereco('Rua A'));
    expect(busca.estado.mensagem).toBe(MENSAGENS_PROXIMO.semConexao);
  });
});
