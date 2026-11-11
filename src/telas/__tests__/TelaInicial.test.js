// TelaInicial: GPS, endereço, resultado e Estados (CT01, CT02, CT03, CT05, CT06, CT16).
import { Linking } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import TelaInicial from '../TelaInicial';
import { controladorBusca } from '../../montagem';
import useBuscaProximo from '../../ganchos/useBuscaProximo';

jest.mock('../../montagem', () => ({
  controladorBusca: { listarEstados: jest.fn() },
}));
jest.mock('../../ganchos/useBuscaProximo', () => jest.fn());

const navigation = { navigate: jest.fn() };
const acoes = {
  usarGps: jest.fn(),
  pesquisarEndereco: jest.fn(),
  escolherSugestao: jest.fn(),
  limpar: jest.fn(),
};
const comBusca = (estado) => useBuscaProximo.mockReturnValue({ estado, ...acoes });

const ORIGEM = { latitude: -23.55, longitude: -46.63 };
const PONTO = {
  id: 'p1',
  nome: 'Ecoponto Teste Sé',
  endereco: { logradouro: 'Praça da Sé', numero: '100', bairro: 'Sé' },
  materiais: ['papel'],
};

beforeEach(() => {
  jest.clearAllMocks();
  controladorBusca.listarEstados.mockResolvedValue([]);
  comBusca({ fase: 'ocioso' });
});

async function renderizar() {
  await render(<TelaInicial navigation={navigation} />);
  await screen.findByText('Ainda não há pontos de coleta cadastrados.');
}

describe('Estados (RF01)', () => {
  test('mostra os Estados com pontos e leva às cidades no 1º toque', async () => {
    controladorBusca.listarEstados.mockResolvedValue([
      { sigla: 'RJ', nome: 'Rio de Janeiro' },
      { sigla: 'SP', nome: 'São Paulo' },
    ]);
    const user = userEvent.setup();
    await render(<TelaInicial navigation={navigation} />);
    await user.press(await screen.findByRole('button', { name: 'Ver cidades de São Paulo' }));
    expect(navigation.navigate).toHaveBeenCalledWith('ConsultaRegiao', { uf: 'SP', nomeEstado: 'São Paulo' });
  });

  test('mostra o carregando enquanto busca', async () => {
    controladorBusca.listarEstados.mockReturnValue(new Promise(() => {}));
    await render(<TelaInicial navigation={navigation} />);
    expect(screen.getByText('Carregando os Estados...')).toBeTruthy();
  });

  test('com erro, oferece tentar de novo', async () => {
    controladorBusca.listarEstados
      .mockRejectedValueOnce(new Error('sem rede'))
      .mockResolvedValueOnce([{ sigla: 'SP', nome: 'São Paulo' }]);
    const user = userEvent.setup();
    await render(<TelaInicial navigation={navigation} />);
    await user.press(await screen.findByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('button', { name: 'Ver cidades de São Paulo' })).toBeTruthy();
  });
});

describe('GPS e endereço', () => {
  test('"Usar minha localização" chama a busca por GPS', async () => {
    const user = userEvent.setup();
    await renderizar();
    await user.press(screen.getByRole('button', { name: 'Usar minha localização' }));
    expect(acoes.usarGps).toHaveBeenCalled();
  });

  test('pesquisa o endereço digitado', async () => {
    const user = userEvent.setup();
    await renderizar();
    await user.type(screen.getByLabelText('Ou pesquise um endereço'), 'Avenida Paulista');
    await user.press(screen.getByRole('button', { name: 'Pesquisar endereço' }));
    expect(acoes.pesquisarEndereco).toHaveBeenCalledWith('Avenida Paulista');
  });

  test('enquanto busca, mostra o andamento e desabilita os botões', async () => {
    comBusca({ fase: 'buscando', textoBuscando: 'Obtendo a sua localização...' });
    await renderizar();
    expect(screen.getByText('Obtendo a sua localização...')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Usar minha localização' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pesquisar endereço' })).toBeDisabled();
  });

  test('resultado do GPS: o toque no ponto abre os detalhes com a origem (2 toques)', async () => {
    comBusca({ fase: 'pronto', resultado: { ponto: PONTO, distanciaKm: 0.85 }, origem: ORIGEM, endereco: null });
    const user = userEvent.setup();
    await renderizar();
    expect(screen.getByText('Ponto de coleta mais próximo')).toBeTruthy();
    expect(screen.getByText('850 m')).toBeTruthy();
    await user.press(screen.getByRole('button', { name: /^Ecoponto Teste Sé/ }));
    expect(navigation.navigate).toHaveBeenCalledWith('Detalhes', { idPonto: 'p1', origem: ORIGEM });
  });

  test('resultado por endereço mostra o endereço de partida e a atribuição', async () => {
    comBusca({
      fase: 'pronto',
      resultado: { ponto: PONTO, distanciaKm: 2.6 },
      origem: ORIGEM,
      endereco: 'Avenida Paulista, São Paulo',
    });
    await renderizar();
    expect(screen.getByText('A partir de: Avenida Paulista, São Paulo')).toBeTruthy();
    expect(screen.getByText(/OpenStreetMap/)).toBeTruthy();
  });

  test('sugestões de endereço: escolher uma continua a busca (CT06)', async () => {
    const sugestao = { descricao: 'Rua A, Santos', latitude: -23.9, longitude: -46.3 };
    comBusca({ fase: 'sugestoes', sugestoes: [sugestao], mensagem: 'Escolha o correto' });
    const user = userEvent.setup();
    await renderizar();
    await user.press(screen.getByRole('button', { name: 'Rua A, Santos' }));
    expect(acoes.escolherSugestao).toHaveBeenCalledWith(sugestao);
  });

  test('aviso de permissão negada oferece os Ajustes e Fechar (CT02)', async () => {
    comBusca({ fase: 'aviso', mensagem: 'Sem permissão de localização.', abrirAjustes: true });
    const abrirAjustes = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const user = userEvent.setup();
    await renderizar();
    expect(screen.getByRole('alert')).toHaveTextContent('Sem permissão de localização.');
    await user.press(screen.getByRole('button', { name: 'Abrir os Ajustes' }));
    expect(abrirAjustes).toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(acoes.limpar).toHaveBeenCalled();
  });

  test('aviso comum não mostra o botão dos Ajustes', async () => {
    comBusca({ fase: 'aviso', mensagem: 'Endereço não encontrado' });
    await renderizar();
    expect(screen.queryByRole('button', { name: 'Abrir os Ajustes' })).toBeNull();
  });
});
