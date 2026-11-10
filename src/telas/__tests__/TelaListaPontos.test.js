// TelaListaPontos: lista da cidade, filtro por material, vazio e erro (CT07, CT13, CT16).
import { render, screen, userEvent } from '@testing-library/react-native';
import TelaListaPontos from '../TelaListaPontos';
import { controladorBusca } from '../../montagem';

jest.mock('../../montagem', () => ({
  controladorBusca: { listarPontos: jest.fn() },
}));

const navigation = { navigate: jest.fn() };
const route = { params: { uf: 'SP', cidade: 'São Paulo' } };

const ponto = (id, nome, materiais) => ({
  id,
  nome,
  materiais,
  endereco: { logradouro: 'Rua Teste', numero: id, bairro: 'Centro' },
});
const SE = ponto('1', 'Ecoponto Teste Sé', ['papel', 'metal']);
const PAULISTA = ponto('2', 'Ecoponto Teste Paulista', ['papel', 'vidro']);

const resposta = (pontos, extra = {}) => ({ pontos, mensagem: null, podeLimparFiltro: false, ...extra });

beforeEach(() => jest.clearAllMocks());

test('lista os pontos da cidade e abre os detalhes no 3º toque', async () => {
  controladorBusca.listarPontos.mockResolvedValue(resposta([PAULISTA, SE]));
  const user = userEvent.setup();
  await render(<TelaListaPontos navigation={navigation} route={route} />);

  expect(await screen.findByText('2 pontos encontrados')).toBeTruthy();
  expect(controladorBusca.listarPontos).toHaveBeenCalledWith({ uf: 'SP', cidade: 'São Paulo' }, []);
  await user.press(screen.getByRole('button', { name: /^Ecoponto Teste Sé/ }));
  expect(navigation.navigate).toHaveBeenCalledWith('Detalhes', { idPonto: '1' });
});

test('marcar materiais refaz a busca com o filtro', async () => {
  controladorBusca.listarPontos
    .mockResolvedValueOnce(resposta([PAULISTA, SE]))
    .mockResolvedValueOnce(resposta([PAULISTA]))
    .mockResolvedValueOnce(resposta([]));
  const user = userEvent.setup();
  await render(<TelaListaPontos navigation={navigation} route={route} />);
  await screen.findByText('2 pontos encontrados');

  await user.press(screen.getByRole('checkbox', { name: 'Filtrar por vidro' }));
  expect(await screen.findByText('1 ponto encontrado')).toBeTruthy();
  expect(controladorBusca.listarPontos).toHaveBeenLastCalledWith({ uf: 'SP', cidade: 'São Paulo' }, ['vidro']);
  expect(screen.getByRole('checkbox', { name: 'Filtrar por vidro' })).toBeChecked();

  await user.press(screen.getByRole('checkbox', { name: 'Filtrar por metal' }));
  expect(controladorBusca.listarPontos).toHaveBeenLastCalledWith(
    { uf: 'SP', cidade: 'São Paulo' },
    ['vidro', 'metal']
  );
});

test('filtro sem resultado avisa e "Limpar filtro" volta a lista completa', async () => {
  controladorBusca.listarPontos
    .mockResolvedValueOnce(resposta([SE]))
    .mockResolvedValueOnce(
      resposta([], { mensagem: 'Nenhum ponto aceita todos os materiais escolhidos', podeLimparFiltro: true })
    )
    .mockResolvedValueOnce(resposta([SE]));
  const user = userEvent.setup();
  await render(<TelaListaPontos navigation={navigation} route={route} />);
  await screen.findByText('1 ponto encontrado');

  await user.press(screen.getByRole('checkbox', { name: 'Filtrar por eletrônico' }));
  expect(await screen.findByText('Nenhum ponto aceita todos os materiais escolhidos')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: 'Limpar filtro' }));
  expect(await screen.findByText('1 ponto encontrado')).toBeTruthy();
  expect(controladorBusca.listarPontos).toHaveBeenLastCalledWith({ uf: 'SP', cidade: 'São Paulo' }, []);
  expect(screen.getByRole('checkbox', { name: 'Filtrar por eletrônico' })).not.toBeChecked();
});

test('desmarcar um material tira ele do filtro', async () => {
  controladorBusca.listarPontos.mockResolvedValue(resposta([SE]));
  const user = userEvent.setup();
  await render(<TelaListaPontos navigation={navigation} route={route} />);
  await screen.findByText('1 ponto encontrado');

  const papel = screen.getByRole('checkbox', { name: 'Filtrar por papel' });
  await user.press(papel);
  await screen.findByText('1 ponto encontrado');
  await user.press(screen.getByRole('checkbox', { name: 'Filtrar por papel' }));
  await screen.findByText('1 ponto encontrado');
  expect(controladorBusca.listarPontos).toHaveBeenLastCalledWith({ uf: 'SP', cidade: 'São Paulo' }, []);
});

test('cidade sem pontos mostra a mensagem do RF04, sem "Limpar filtro"', async () => {
  controladorBusca.listarPontos.mockResolvedValue(
    resposta([], { mensagem: 'Nenhum ponto de coleta cadastrado nesta cidade' })
  );
  await render(<TelaListaPontos navigation={navigation} route={route} />);
  expect(await screen.findByText('Nenhum ponto de coleta cadastrado nesta cidade')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Limpar filtro' })).toBeNull();
});

test('erro oferece tentar de novo', async () => {
  controladorBusca.listarPontos
    .mockRejectedValueOnce(new Error('sem rede'))
    .mockResolvedValueOnce(resposta([SE]));
  const user = userEvent.setup();
  await render(<TelaListaPontos navigation={navigation} route={route} />);
  await user.press(await screen.findByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByText('1 ponto encontrado')).toBeTruthy();
});

test('mostra o título da cidade e o carregando', async () => {
  controladorBusca.listarPontos.mockReturnValue(new Promise(() => {}));
  await render(<TelaListaPontos navigation={navigation} route={route} />);
  expect(screen.getByRole('header')).toHaveTextContent('São Paulo - SP');
  expect(screen.getByText('Carregando os pontos de coleta...')).toBeTruthy();
});
