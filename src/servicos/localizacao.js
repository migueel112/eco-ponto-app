// Leitura do GPS do celular com o expo-location (sensor do app, RF02).
//
// RNF04 (LGPD): a posição é devolvida a quem pediu e NUNCA é gravada aqui
// (nem no Firestore, nem no AsyncStorage, nem em logs).
// RNF02 (3 segundos): primeiro tenta a última posição conhecida, que é
// instantânea; só se ela não existir pede uma leitura nova, com limite de tempo.

import * as Location from 'expo-location';
import { criarErro } from '../dominio/erros';

export const ERRO_PERMISSAO_NEGADA = 'permissao-negada';
export const ERRO_GPS_DESLIGADO = 'gps-desligado';
export const ERRO_TEMPO_ESGOTADO = 'tempo-esgotado';

// Posição conhecida há até 1 minuto, com erro de até 200 m, serve.
const IDADE_MAXIMA_MS = 60 * 1000;
const PRECISAO_MINIMA_M = 200;
export const TEMPO_LIMITE_MS = 2500;

function paraOrigem(posicao) {
  return { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
}

function comLimiteDeTempo(promessa, ms) {
  let temporizador;
  const limite = new Promise((_, rejeitar) => {
    temporizador = setTimeout(
      () => rejeitar(criarErro('O GPS demorou para responder', ERRO_TEMPO_ESGOTADO)),
      ms
    );
  });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(temporizador));
}

// Pede a permissão (só na primeira vez o sistema pergunta) e devolve
// { latitude, longitude }. Lança erro com codigo:
// - permissao-negada: o usuário não permitiu (podePerguntarDeNovo diz se dá
//   para pedir outra vez ou só pelos Ajustes do celular);
// - gps-desligado: a localização do aparelho está desligada;
// - tempo-esgotado: o GPS não respondeu a tempo.
export async function obterPosicaoAtual() {
  const permissao = await Location.requestForegroundPermissionsAsync();
  if (permissao.status !== 'granted') {
    const erro = criarErro('Permissão de localização negada', ERRO_PERMISSAO_NEGADA);
    erro.podePerguntarDeNovo = permissao.canAskAgain;
    throw erro;
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    throw criarErro('A localização do celular está desligada', ERRO_GPS_DESLIGADO);
  }

  const recente = await Location.getLastKnownPositionAsync({
    maxAge: IDADE_MAXIMA_MS,
    requiredAccuracy: PRECISAO_MINIMA_M,
  });
  if (recente) {
    return paraOrigem(recente);
  }

  const nova = await comLimiteDeTempo(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    TEMPO_LIMITE_MS
  );
  return paraOrigem(nova);
}
