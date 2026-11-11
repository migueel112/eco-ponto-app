// TelaRota: trajeto, distância e tempo, app de navegação, sem internet e sem origem (CT12).
import { Linking, Platform } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import TelaRota from '../TelaRota';
import { controladorPontoDeColeta } from '../../montagem';
import { obterPosicaoAtual } from '../../servicos/localizacao';

jest.mock('../../montagem', () => ({
  controladorPontoDeColeta: { calcularRota: jest.fn() },
}));
jest.mock('../../servicos/localizacao', () => ({
  ...jest.requireActual('../../servicos/localizacao'),
  obterPosicaoAtual: jest.fn(),
}));
// O mapa nativo não roda no Jest: versões simples que mostram as propriedades.
jest.mock('react-native-maps', () => {
  const { View, Text } = require('react-native');
  const MapView = ({ children, accessibilityLabel }) => (
    <View accessibilityLabel={accessibilityLabel}>{children}</View>
  );
  const Polyline = ({ coordinates }) => <Text>{`trajeto com ${coordinates.length} pontos`}</Text>;
  const Marker = ({ title }) => <Text>{`marcador ${title}`}</Text>;
  return { __esModule: true, default: MapView, Polyline, Marker };
});

const ORIGEM = { latitude: -23.5505, longitude: -46.6333 };
const DESTINO = { latitude: -23.5614, longitude: -46.6559, nome: 'Ecoponto Teste Paulista' };
const ROTA = { distanciaKm: 3.4, tempoEstimadoMin: 9, trajeto: [ORIGEM, { latitude: -23.556, longitude: -46.64 }, DESTINO] };

const rota = (params) => ({ params: { idPonto: 'p1', ...params } });

beforeEach(() => jest.resetAllMocks());

test('com internet: mapa com trajeto, distância, tempo e marcadores', async () => {
  controladorPontoDeColeta.calcularRota.mockResolvedValue({ rota: ROTA, destino: DESTINO, mensagem: null });
  await render(<TelaRota route={rota({ origem: ORIGEM })} />);

  expect(await screen.findByText('3,4 km de carro · cerca de 9 min')).toBeTruthy();
  expect(controladorPontoDeColeta.calcularRota).toHaveBeenCalledWith(ORIGEM, 'p1');
  expect(screen.getByText('trajeto com 3 pontos')).toBeTruthy();
  expect(screen.getByText('marcador Ponto de partida')).toBeTruthy();
  expect(screen.getByText('marcador Ecoponto Teste Paulista')).toBeTruthy();
  expect(screen.getByLabelText('Mapa com o trajeto até Ecoponto Teste Paulista: 3,4 km, cerca de 9 min')).toBeTruthy();
  expect(screen.getByText(/OSRM/)).toBeTruthy();
});

test('trajeto vazio desenha a linha reta entre origem e destino', async () => {
  controladorPontoDeColeta.calcularRota.mockResolvedValue({ rota: { ...ROTA, trajeto: [] }, destino: DESTINO });
  await render(<TelaRota route={rota({ origem: ORIGEM })} />);
  expect(await screen.findByText('trajeto com 2 pontos')).toBeTruthy();
});

test('abre o app de navegação do celular com o destino', async () => {
  controladorPontoDeColeta.calcularRota.mockResolvedValue({ rota: ROTA, destino: DESTINO, mensagem: null });
  const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const user = userEvent.setup();
  await render(<TelaRota route={rota({ origem: ORIGEM })} />);
  await user.press(await screen.findByRole('button', { name: 'Abrir no app de navegação' }));
  expect(abrir).toHaveBeenCalledWith(expect.stringContaining('-23.5614,-46.6559'));
  // No Jest a plataforma simulada é o iOS (Mapas da Apple); no Android seria geo:.
  expect(abrir.mock.calls[0][0]).toMatch(Platform.OS === 'ios' ? /^http:\/\/maps\.apple\.com/ : /^geo:/);
});

test('sem internet: avisa, oferece tentar de novo e ainda abre o app de navegação (CT12)', async () => {
  controladorPontoDeColeta.calcularRota
    .mockResolvedValueOnce({
      rota: null,
      destino: DESTINO,
      mensagem: 'Sem conexão com a internet: não é possível calcular a rota agora',
    })
    .mockResolvedValueOnce({ rota: ROTA, destino: DESTINO, mensagem: null });
  const user = userEvent.setup();
  await render(<TelaRota route={rota({ origem: ORIGEM })} />);

  expect(await screen.findByRole('alert')).toHaveTextContent(/Sem conexão com a internet/);
  expect(screen.getByRole('button', { name: 'Abrir no app de navegação' })).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByText('3,4 km de carro · cerca de 9 min')).toBeTruthy();
});

test('sem posição de referência: usa o GPS e calcula a rota', async () => {
  controladorPontoDeColeta.calcularRota
    .mockResolvedValueOnce({ rota: null, mensagem: 'Use o GPS ou pesquise um endereço para calcular a rota' })
    .mockResolvedValueOnce({ rota: ROTA, destino: DESTINO, mensagem: null });
  obterPosicaoAtual.mockResolvedValue(ORIGEM);
  const user = userEvent.setup();
  await render(<TelaRota route={rota()} />);

  expect(await screen.findByRole('alert')).toHaveTextContent(/Use o GPS/);
  expect(screen.queryByRole('button', { name: 'Abrir no app de navegação' })).toBeNull();
  await user.press(screen.getByRole('button', { name: 'Usar minha localização' }));

  expect(await screen.findByText('3,4 km de carro · cerca de 9 min')).toBeTruthy();
  expect(controladorPontoDeColeta.calcularRota).toHaveBeenLastCalledWith(ORIGEM, 'p1');
});

test('GPS com permissão negada mostra a mensagem', async () => {
  controladorPontoDeColeta.calcularRota.mockResolvedValue({ rota: null, mensagem: 'Use o GPS' });
  obterPosicaoAtual.mockRejectedValue(Object.assign(new Error('x'), { codigo: 'permissao-negada', podePerguntarDeNovo: true }));
  const user = userEvent.setup();
  await render(<TelaRota route={rota()} />);
  await user.press(await screen.findByRole('button', { name: 'Usar minha localização' }));
  expect(await screen.findByText(/Sem permissão de localização/)).toBeTruthy();
});

test('mostra o carregando enquanto calcula', async () => {
  controladorPontoDeColeta.calcularRota.mockReturnValueOnce(new Promise(() => {}));
  await render(<TelaRota route={rota({ origem: ORIGEM })} />);
  expect(screen.getByText('Calculando a rota...')).toBeTruthy();
});

test('falha ao buscar o ponto mostra o erro com tentar de novo', async () => {
  controladorPontoDeColeta.calcularRota.mockRejectedValue(new Error('sem rede'));
  await render(<TelaRota route={rota({ origem: ORIGEM })} />);
  expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy();
});
