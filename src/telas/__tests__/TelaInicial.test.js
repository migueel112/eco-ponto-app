// TelaInicial: Estados com pontos, carregando, erro e vazio (CT01, CT16).
import { render, screen, userEvent } from '@testing-library/react-native';
import TelaInicial from '../TelaInicial';
import { controladorBusca } from '../../montagem';

jest.mock('../../montagem', () => ({
  controladorBusca: { listarEstados: jest.fn() },
}));

const navigation = { navigate: jest.fn() };

beforeEach(() => jest.clearAllMocks());

test('mostra os Estados com pontos e leva às cidades no 1º toque', async () => {
  controladorBusca.listarEstados.mockResolvedValue([
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'SP', nome: 'São Paulo' },
  ]);
  const user = userEvent.setup();
  await render(<TelaInicial navigation={navigation} />);

  await user.press(await screen.findByRole('button', { name: 'Ver cidades de São Paulo' }));
  expect(navigation.navigate).toHaveBeenCalledWith('ConsultaRegiao', { uf: 'SP', nomeEstado: 'São Paulo' });
  expect(screen.getByRole('button', { name: 'Ver cidades de Rio de Janeiro' })).toBeTruthy();
});

test('mostra o carregando enquanto busca', async () => {
  controladorBusca.listarEstados.mockReturnValue(new Promise(() => {}));
  await render(<TelaInicial navigation={navigation} />);
  expect(screen.getByText('Carregando os Estados...')).toBeTruthy();
});

test('sem pontos cadastrados, avisa', async () => {
  controladorBusca.listarEstados.mockResolvedValue([]);
  await render(<TelaInicial navigation={navigation} />);
  expect(await screen.findByText('Ainda não há pontos de coleta cadastrados.')).toBeTruthy();
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

test('GPS e endereço aparecem como "em breve" e desabilitados', async () => {
  controladorBusca.listarEstados.mockResolvedValue([]);
  await render(<TelaInicial navigation={navigation} />);
  expect(screen.getByRole('button', { name: 'Usar minha localização (em breve)' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Pesquisar um endereço (em breve)' })).toBeDisabled();
  await screen.findByText('Ainda não há pontos de coleta cadastrados.');
});
