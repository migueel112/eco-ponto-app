// Componente CampoTexto: rótulo, digitação e mensagem de erro.
import { render, screen, userEvent } from '@testing-library/react-native';
import CampoTexto from '../CampoTexto';

test('mostra o rótulo e avisa cada letra digitada', async () => {
  const aoMudar = jest.fn();
  const user = userEvent.setup();
  await render(<CampoTexto rotulo="E-mail" valor="" aoMudar={aoMudar} />);
  expect(screen.getByText('E-mail')).toBeTruthy();
  await user.type(screen.getByLabelText('E-mail'), 'ab');
  expect(aoMudar).toHaveBeenLastCalledWith('b');
  expect(aoMudar).toHaveBeenCalledTimes(2);
});

test('mostra o erro como alerta', async () => {
  await render(<CampoTexto rotulo="Nome" valor="" aoMudar={() => {}} erro="Campo obrigatório" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Campo obrigatório');
});

test('sem erro, não mostra alerta, e repassa outras propriedades', async () => {
  await render(<CampoTexto rotulo="Senha" valor="x" aoMudar={() => {}} secureTextEntry />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);
});
