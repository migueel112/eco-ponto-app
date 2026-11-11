// Retorno tátil (atuador do celular) com a API Vibration do React Native.
// Uma vibração curta confirma um sucesso; duas curtas avisam um erro.
// No iPhone a duração é fixa (o sistema ignora o padrão), mas a vibração
// acontece do mesmo jeito.

import { Vibration } from 'react-native';

export const PADRAO_SUCESSO = [0, 60];
export const PADRAO_ERRO = [0, 80, 100, 80];

export function vibrarSucesso() {
  Vibration.vibrate(PADRAO_SUCESSO);
}

export function vibrarErro() {
  Vibration.vibrate(PADRAO_ERRO);
}
