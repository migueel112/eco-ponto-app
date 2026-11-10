// Gancho useConsulta: carregando, sucesso, erro, tentar de novo e troca de dependência.
import { Text } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import useConsulta, { MENSAGEM_ERRO_CONSULTA } from '../useConsulta';

// Componente mínimo que mostra o estado do gancho.
let ultimo;
function Sonda({ consulta, dependencias }) {
  ultimo = useConsulta(consulta, dependencias);
  const { dados, carregando, erro } = ultimo;
  return <Text>{carregando ? 'carregando' : erro ?? `dados:${dados}`}</Text>;
}

test('começa carregando e depois mostra os dados', async () => {
  let resolver;
  const consulta = jest.fn(() => new Promise((r) => (resolver = r)));
  await render(<Sonda consulta={consulta} />);
  expect(screen.getByText('carregando')).toBeTruthy();
  await act(async () => resolver('ok'));
  expect(screen.getByText('dados:ok')).toBeTruthy();
});

test('erro mostra a mensagem padrão e recarregar tenta de novo', async () => {
  const consulta = jest.fn().mockRejectedValueOnce(new Error('falhou')).mockResolvedValueOnce('certo');
  await render(<Sonda consulta={consulta} />);
  expect(await screen.findByText(MENSAGEM_ERRO_CONSULTA)).toBeTruthy();
  await act(async () => ultimo.recarregar());
  expect(screen.getByText('dados:certo')).toBeTruthy();
  expect(consulta).toHaveBeenCalledTimes(2);
});

test('refaz a consulta quando a dependência muda', async () => {
  const consulta = jest.fn(async () => 'x');
  const { rerender } = await render(<Sonda consulta={consulta} dependencias={['SP']} />);
  await screen.findByText('dados:x');
  await rerender(<Sonda consulta={consulta} dependencias={['RJ']} />);
  await screen.findByText('dados:x');
  expect(consulta).toHaveBeenCalledTimes(2);
});

test('não atualiza o estado depois que a tela sai', async () => {
  let resolver;
  let rejeitar;
  const consulta = jest
    .fn()
    .mockImplementationOnce(() => new Promise((r) => (resolver = r)))
    .mockImplementationOnce(() => new Promise((_, j) => (rejeitar = j)));
  const { unmount } = await render(<Sonda consulta={consulta} />);
  const recarregar = ultimo.recarregar;
  await unmount();
  await act(async () => resolver('tarde'));
  await act(async () => {
    const pedido = recarregar();
    rejeitar(new Error('tarde'));
    await pedido;
  });
  expect(consulta).toHaveBeenCalledTimes(2);
});
