// PilhaParceiro: sem login só a tela de login; com login, Meus pontos e Sair (RN04, CT09).
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, userEvent, act } from '@testing-library/react-native';
import PilhaParceiro from '../PilhaParceiro';
import { autenticacao } from '../../montagem';

jest.mock('../../montagem', () => ({
  autenticacao: { observarSessao: jest.fn(), sair: jest.fn(), entrar: jest.fn() },
}));

// As telas internas não importam aqui; versões simples evitam dependências.
jest.mock('../../telas/TelaMeusPontos', () => {
  const { Text } = require('react-native');
  return () => <Text>tela meus pontos</Text>;
});
jest.mock('../../telas/TelaCadastroPonto', () => () => null);

let avisar;
beforeEach(() => {
  jest.clearAllMocks();
  autenticacao.observarSessao.mockImplementation((callback) => {
    avisar = callback;
    return () => {};
  });
});

async function renderizar() {
  await render(
    <NavigationContainer>
      <PilhaParceiro />
    </NavigationContainer>
  );
}

test('enquanto verifica a sessão, mostra o carregando', async () => {
  await renderizar();
  expect(screen.getByText('Verificando o login...')).toBeTruthy();
});

test('sem login, só a tela de login (CT09)', async () => {
  await renderizar();
  await act(async () => avisar(null));
  expect(screen.getByLabelText('E-mail')).toBeTruthy();
  expect(screen.queryByText('tela meus pontos')).toBeNull();
});

test('com login, mostra Meus pontos; Sair encerra a sessão e volta ao login', async () => {
  const user = userEvent.setup();
  await renderizar();
  await act(async () => avisar({ uid: 'u1' }));
  expect(await screen.findByText('tela meus pontos')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: 'Sair da área do parceiro' }));
  expect(autenticacao.sair).toHaveBeenCalled();

  await act(async () => avisar(null));
  expect(await screen.findByLabelText('E-mail')).toBeTruthy();
});
