// TelaMeusPontos: lista do parceiro, editar e excluir com confirmação (CT14, CT15).
import { Alert } from 'react-native';
import { render, screen, userEvent, act } from '@testing-library/react-native';
import TelaMeusPontos from '../TelaMeusPontos';
import { controladorCadastro } from '../../montagem';
import { vibrarSucesso, vibrarErro } from '../../servicos/vibracao';

jest.mock('../../servicos/vibracao', () => ({ vibrarSucesso: jest.fn(), vibrarErro: jest.fn() }));

jest.mock('../../montagem', () => ({
  controladorCadastro: { listarMeusPontos: jest.fn(), excluirPonto: jest.fn() },
}));

const ponto = (id, nome, situacao = 'ativo') => ({
  id,
  nome,
  situacao,
  uf: 'SP',
  cidade: 'São Paulo',
  endereco: { logradouro: 'Rua Teste', numero: id, bairro: 'Centro' },
  materiais: ['papel'],
});
const ALFA = ponto('1', 'Ecoponto Teste Alfa');
const BETA = ponto('2', 'Ecoponto Teste Beta', 'inativo');
const lista = (pontos) => ({ sucesso: true, mensagem: null, pontos });

// navigation com o evento "focus" controlável.
function criarNavigation() {
  const ouvintes = {};
  return {
    navigate: jest.fn(),
    addListener: jest.fn((evento, callback) => {
      ouvintes[evento] = callback;
      return () => delete ouvintes[evento];
    }),
    focar: () => ouvintes.focus?.(),
  };
}

// Simula o toque num botão do Alert.
function tocarNoAlerta(texto) {
  const botoes = Alert.alert.mock.calls.at(-1)[2];
  return botoes.find((b) => b.text === texto).onPress?.();
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

test('lista os pontos, marca os inativos e abre o cadastro e a edição', async () => {
  controladorCadastro.listarMeusPontos.mockResolvedValue(lista([ALFA, BETA]));
  const navigation = criarNavigation();
  const user = userEvent.setup();
  await render(<TelaMeusPontos navigation={navigation} />);

  expect(await screen.findByText('Ecoponto Teste Alfa')).toBeTruthy();
  expect(screen.getAllByText('Inativo')).toHaveLength(1);

  await user.press(screen.getByRole('button', { name: 'Editar Ecoponto Teste Beta' }));
  expect(navigation.navigate).toHaveBeenCalledWith('CadastroPonto', { ponto: BETA });

  await user.press(screen.getByRole('button', { name: 'Cadastrar novo ponto' }));
  expect(navigation.navigate).toHaveBeenCalledWith('CadastroPonto');
});

test('excluir pede confirmação; cancelar não exclui', async () => {
  controladorCadastro.listarMeusPontos.mockResolvedValue(lista([ALFA]));
  const user = userEvent.setup();
  await render(<TelaMeusPontos navigation={criarNavigation()} />);

  await user.press(await screen.findByRole('button', { name: 'Excluir Ecoponto Teste Alfa' }));
  expect(Alert.alert).toHaveBeenCalledWith(
    'Excluir ponto de coleta',
    expect.stringContaining('Tem certeza que deseja excluir "Ecoponto Teste Alfa"?'),
    expect.any(Array)
  );
  tocarNoAlerta('Cancelar');
  expect(controladorCadastro.excluirPonto).not.toHaveBeenCalled();
});

test('confirmar exclui, avisa o sucesso e recarrega a lista', async () => {
  controladorCadastro.listarMeusPontos
    .mockResolvedValueOnce(lista([ALFA]))
    .mockResolvedValueOnce(lista([]));
  controladorCadastro.excluirPonto.mockResolvedValue({ sucesso: true, mensagem: 'Ponto de coleta excluído' });
  const user = userEvent.setup();
  await render(<TelaMeusPontos navigation={criarNavigation()} />);

  await user.press(await screen.findByRole('button', { name: 'Excluir Ecoponto Teste Alfa' }));
  await act(async () => tocarNoAlerta('Excluir'));

  expect(controladorCadastro.excluirPonto).toHaveBeenCalledWith('1');
  expect(screen.getByRole('alert')).toHaveTextContent('Ponto de coleta excluído');
  expect(vibrarSucesso).toHaveBeenCalled();
  expect(await screen.findByText('Você ainda não cadastrou nenhum ponto de coleta.')).toBeTruthy();
});

test('exclusão recusada ou com falha mostra o erro', async () => {
  controladorCadastro.listarMeusPontos.mockResolvedValue(lista([ALFA]));
  controladorCadastro.excluirPonto
    .mockResolvedValueOnce({ sucesso: false, mensagem: 'Você só pode alterar os seus próprios pontos' })
    .mockRejectedValueOnce(new Error('sem rede'));
  const user = userEvent.setup();
  await render(<TelaMeusPontos navigation={criarNavigation()} />);

  await user.press(await screen.findByRole('button', { name: 'Excluir Ecoponto Teste Alfa' }));
  await act(async () => tocarNoAlerta('Excluir'));
  expect(screen.getByRole('alert')).toHaveTextContent('Você só pode alterar os seus próprios pontos');
  expect(vibrarErro).toHaveBeenCalledTimes(1);

  await user.press(screen.getByRole('button', { name: 'Excluir Ecoponto Teste Alfa' }));
  await act(async () => tocarNoAlerta('Excluir'));
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível excluir o ponto. Tente novamente.');
  expect(controladorCadastro.listarMeusPontos).toHaveBeenCalledTimes(1);
});

test('recarrega a lista quando a tela volta a aparecer', async () => {
  controladorCadastro.listarMeusPontos
    .mockResolvedValueOnce(lista([]))
    .mockResolvedValueOnce(lista([ALFA]));
  const navigation = criarNavigation();
  await render(<TelaMeusPontos navigation={navigation} />);
  await screen.findByText('Você ainda não cadastrou nenhum ponto de coleta.');

  await act(async () => navigation.focar());
  expect(await screen.findByText('Ecoponto Teste Alfa')).toBeTruthy();
});

test('sessão encerrada ou erro de conexão mostram o erro com tentar de novo', async () => {
  controladorCadastro.listarMeusPontos
    .mockResolvedValueOnce({ sucesso: false, mensagem: 'Faça login como parceiro para continuar', pontos: [] })
    .mockRejectedValueOnce(new Error('sem rede'));
  const user = userEvent.setup();
  await render(<TelaMeusPontos navigation={criarNavigation()} />);

  expect(await screen.findByText('Faça login como parceiro para continuar')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByText(/Não foi possível carregar os dados/)).toBeTruthy();
});
