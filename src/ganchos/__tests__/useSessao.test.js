// Gancho useSessao: verificando, logado, deslogado e cancelamento.
import { Text } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import useSessao from '../useSessao';
import { autenticacao } from '../../montagem';

jest.mock('../../montagem', () => ({
  autenticacao: { observarSessao: jest.fn() },
}));

function Sonda() {
  const { sessao, verificando } = useSessao();
  return <Text>{verificando ? 'verificando' : sessao ? `logado:${sessao.uid}` : 'deslogado'}</Text>;
}

test('começa verificando e acompanha entradas e saídas', async () => {
  let avisar;
  const cancelar = jest.fn();
  autenticacao.observarSessao.mockImplementation((callback) => {
    avisar = callback;
    return cancelar;
  });

  const { unmount } = await render(<Sonda />);
  expect(screen.getByText('verificando')).toBeTruthy();

  await act(async () => avisar({ uid: 'u1' }));
  expect(screen.getByText('logado:u1')).toBeTruthy();

  await act(async () => avisar(null));
  expect(screen.getByText('deslogado')).toBeTruthy();

  await unmount();
  expect(cancelar).toHaveBeenCalled();
});
