// Serviço de vibração: um toque curto no sucesso, dois no erro.
import { Vibration } from 'react-native';
import { vibrarSucesso, vibrarErro, PADRAO_SUCESSO, PADRAO_ERRO } from '../vibracao';

beforeEach(() => jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {}));

test('sucesso vibra uma vez, curto', () => {
  vibrarSucesso();
  expect(Vibration.vibrate).toHaveBeenCalledWith(PADRAO_SUCESSO);
  expect(PADRAO_SUCESSO).toEqual([0, 60]);
});

test('erro vibra duas vezes', () => {
  vibrarErro();
  expect(Vibration.vibrate).toHaveBeenCalledWith(PADRAO_ERRO);
  expect(PADRAO_ERRO).toHaveLength(4);
});
