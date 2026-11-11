// TelaLoginParceiro: envia e-mail e senha, mostra "Entrando..." e os erros (RN04).
import { render, screen, userEvent } from '@testing-library/react-native';
import TelaLoginParceiro from '../TelaLoginParceiro';
import { autenticacao } from '../../montagem';
import { vibrarErro } from '../../servicos/vibracao';

jest.mock('../../servicos/vibracao', () => ({ vibrarSucesso: jest.fn(), vibrarErro: jest.fn() }));

jest.mock('../../montagem', () => ({
  autenticacao: { entrar: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

async function preencher(user, email, senha) {
  await user.type(screen.getByLabelText('E-mail'), email);
  await user.type(screen.getByLabelText('Senha'), senha);
}

test('envia o e-mail e a senha digitados', async () => {
  autenticacao.entrar.mockResolvedValue({ sucesso: true, sessao: { uid: 'u1' } });
  const user = userEvent.setup();
  await render(<TelaLoginParceiro />);
  await preencher(user, 'parceiro@exemplo.com', 'senha-de-teste');
  await user.press(screen.getByRole('button', { name: 'Entrar' }));
  expect(autenticacao.entrar).toHaveBeenCalledWith('parceiro@exemplo.com', 'senha-de-teste');
});

test('mostra "Entrando..." desabilitado enquanto espera', async () => {
  autenticacao.entrar.mockReturnValue(new Promise(() => {}));
  const user = userEvent.setup();
  await render(<TelaLoginParceiro />);
  await preencher(user, 'a@b.com', '123456');
  await user.press(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();
});

test('erro de login aparece como alerta e libera o botão', async () => {
  autenticacao.entrar.mockResolvedValue({ sucesso: false, mensagem: 'E-mail ou senha incorretos' });
  const user = userEvent.setup();
  await render(<TelaLoginParceiro />);
  await preencher(user, 'a@b.com', 'errada');
  await user.press(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos');
  expect(screen.getByRole('button', { name: 'Entrar' })).not.toBeDisabled();
  expect(vibrarErro).toHaveBeenCalled();
});

test('a senha fica oculta', async () => {
  await render(<TelaLoginParceiro />);
  expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);
});
