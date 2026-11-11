// Serviço de localização com o expo-location simulado (CT02, CT17).
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  obterPosicaoAtual,
  ERRO_PERMISSAO_NEGADA,
  ERRO_GPS_DESLIGADO,
  ERRO_TEMPO_ESGOTADO,
  TEMPO_LIMITE_MS,
} from '../localizacao';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: jest.fn() }));

const posicao = (latitude, longitude) => ({ coords: { latitude, longitude, accuracy: 20 }, timestamp: 1 });

beforeEach(() => {
  jest.clearAllMocks();
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
  Location.hasServicesEnabledAsync.mockResolvedValue(true);
  Location.getLastKnownPositionAsync.mockResolvedValue(null);
});

test('usa a última posição conhecida quando é recente', async () => {
  Location.getLastKnownPositionAsync.mockResolvedValue(posicao(-23.55, -46.63));
  expect(await obterPosicaoAtual()).toEqual({ latitude: -23.55, longitude: -46.63 });
  expect(Location.getLastKnownPositionAsync).toHaveBeenCalledWith({ maxAge: 60000, requiredAccuracy: 200 });
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});

test('sem posição recente, faz uma leitura nova com precisão equilibrada', async () => {
  Location.getCurrentPositionAsync.mockResolvedValue(posicao(-22.9, -43.17));
  expect(await obterPosicaoAtual()).toEqual({ latitude: -22.9, longitude: -43.17 });
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: 3 });
});

test('permissão negada lança erro e informa se dá para pedir de novo (CT02)', async () => {
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false });
  await expect(obterPosicaoAtual()).rejects.toMatchObject({
    codigo: ERRO_PERMISSAO_NEGADA,
    podePerguntarDeNovo: false,
  });
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});

test('localização do celular desligada lança erro', async () => {
  Location.hasServicesEnabledAsync.mockResolvedValue(false);
  await expect(obterPosicaoAtual()).rejects.toMatchObject({ codigo: ERRO_GPS_DESLIGADO });
});

test('GPS que não responde a tempo lança tempo esgotado', async () => {
  jest.useFakeTimers();
  Location.getCurrentPositionAsync.mockReturnValue(new Promise(() => {}));
  const pedido = obterPosicaoAtual();
  const verificacao = expect(pedido).rejects.toMatchObject({ codigo: ERRO_TEMPO_ESGOTADO });
  await jest.advanceTimersByTimeAsync(TEMPO_LIMITE_MS);
  await verificacao;
  jest.useRealTimers();
});

test('a posição não é gravada no aparelho (RNF04, CT17)', async () => {
  Location.getLastKnownPositionAsync.mockResolvedValue(posicao(-23.55, -46.63));
  await obterPosicaoAtual();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
