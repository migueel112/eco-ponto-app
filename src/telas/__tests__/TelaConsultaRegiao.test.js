// TelaConsultaRegiao: cidades do Estado, carregando, erro e vazio (CT01, CT16).
import { render, screen, userEvent } from '@testing-library/react-native';
import TelaConsultaRegiao from '../TelaConsultaRegiao';
import { controladorBusca } from '../../montagem';

jest.mock('../../montagem', () => ({
  controladorBusca: { listarCidades: jest.fn() },
}));

const navigation = { navigate: jest.fn(), goBack: jest.fn() };
const route = { params: { uf: 'SP', nomeEstado: 'São Paulo' } };

beforeEach(() => jest.clearAllMocks());

test('lista as cidades do Estado e abre os pontos no 2º toque', async () => {
  controladorBusca.listarCidades.mockResolvedValue(['Campinas', 'São Paulo']);
  const user = userEvent.setup();
  await render(<TelaConsultaRegiao navigation={navigation} route={route} />);

  await user.press(await screen.findByRole('button', { name: 'Ver pontos de coleta de Campinas' }));
  expect(controladorBusca.listarCidades).toHaveBeenCalledWith('SP');
  expect(navigation.navigate).toHaveBeenCalledWith('ListaPontos', { uf: 'SP', cidade: 'Campinas' });
});

test('mostra o carregando enquanto busca', async () => {
  controladorBusca.listarCidades.mockReturnValue(new Promise(() => {}));
  await render(<TelaConsultaRegiao navigation={navigation} route={route} />);
  expect(screen.getByText('Carregando as cidades...')).toBeTruthy();
});

test('sem cidades, avisa e oferece voltar', async () => {
  controladorBusca.listarCidades.mockResolvedValue([]);
  const user = userEvent.setup();
  await render(<TelaConsultaRegiao navigation={navigation} route={route} />);

  expect(await screen.findByText('Nenhuma cidade com ponto de coleta em São Paulo.')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Escolher outro Estado' }));
  expect(navigation.goBack).toHaveBeenCalled();
});

test('com erro, oferece tentar de novo', async () => {
  controladorBusca.listarCidades
    .mockRejectedValueOnce(new Error('sem rede'))
    .mockResolvedValueOnce(['Santos']);
  const user = userEvent.setup();
  await render(<TelaConsultaRegiao navigation={navigation} route={route} />);

  await user.press(await screen.findByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByRole('button', { name: 'Ver pontos de coleta de Santos' })).toBeTruthy();
});
