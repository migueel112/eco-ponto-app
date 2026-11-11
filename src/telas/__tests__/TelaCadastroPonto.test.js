// TelaCadastroPonto: cadastro válido e inválido, horários e edição (CT10, CT11, CT14).
import { Alert } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import TelaCadastroPonto from '../TelaCadastroPonto';
import { controladorCadastro } from '../../montagem';

jest.mock('../../montagem', () => ({
  controladorCadastro: { cadastrarPonto: jest.fn(), editarPonto: jest.fn() },
}));

const criarNavigation = () => ({ goBack: jest.fn(), setOptions: jest.fn() });

const PONTO = {
  id: 'p1',
  nome: 'Ecoponto Teste Paulista',
  telefone: '1133334444',
  situacao: 'ativo',
  uf: 'SP',
  cidade: 'São Paulo',
  endereco: { logradouro: 'Avenida Paulista', numero: '1578', bairro: 'Bela Vista', cep: '01310200' },
  latitude: -23.5614,
  longitude: -46.6559,
  materiais: ['papel'],
  horarios: [{ diaDaSemana: 1, horaAbertura: '08:00', horaFechamento: '17:00' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

async function preencherCadastro(user) {
  await user.type(screen.getByLabelText('Nome do ponto'), 'Ecoponto Teste Novo');
  await user.type(screen.getByLabelText('Telefone com DDD'), '11 3333-4444');
  await user.type(screen.getByLabelText('Estado (sigla, ex.: SP)'), 'sp');
  await user.type(screen.getByLabelText('Cidade'), 'Santos');
  await user.type(screen.getByLabelText('Logradouro (rua, avenida...)'), 'Rua A');
  await user.type(screen.getByLabelText('Número'), '10');
  await user.type(screen.getByLabelText('Bairro'), 'Centro');
  await user.type(screen.getByLabelText('CEP'), '11010-000');
  await user.press(screen.getByRole('checkbox', { name: 'Aceita vidro' }));
  await user.press(screen.getByRole('checkbox', { name: 'Terça-feira' }));
  await user.press(screen.getByRole('button', { name: 'Adicionar horário' }));
}

test('cadastro válido envia os dados, avisa e volta (CT11)', async () => {
  controladorCadastro.cadastrarPonto.mockResolvedValue({ sucesso: true, mensagem: 'Ponto de coleta cadastrado' });
  const navigation = criarNavigation();
  const user = userEvent.setup();
  await render(<TelaCadastroPonto navigation={navigation} route={{}} />);
  expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Cadastrar ponto' });

  await preencherCadastro(user);
  expect(screen.getByText('Terça-feira: 08:00 às 17:00')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Cadastrar ponto' }));

  expect(controladorCadastro.cadastrarPonto).toHaveBeenCalledWith({
    nome: 'Ecoponto Teste Novo',
    telefone: '11 3333-4444',
    uf: 'SP',
    cidade: 'Santos',
    endereco: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cep: '11010-000' },
    materiais: ['vidro'],
    horarios: [{ diaDaSemana: 2, horaAbertura: '08:00', horaFechamento: '17:00' }],
  });
  expect(Alert.alert).toHaveBeenCalledWith('Pronto', 'Ponto de coleta cadastrado');
  expect(navigation.goBack).toHaveBeenCalled();
});

test('cadastro inválido mostra os erros em cada campo (CT10)', async () => {
  controladorCadastro.cadastrarPonto.mockResolvedValue({
    sucesso: false,
    mensagem: 'Confira os campos destacados',
    erros: {
      nome: 'Campo obrigatório',
      'endereco.cep': 'O CEP deve ter 8 dígitos',
      materiais: 'Escolha pelo menos um tipo de material',
      horarios: 'Informe pelo menos um horário de funcionamento',
      endereco: 'Já existe um ponto ativo cadastrado neste endereço',
    },
  });
  const navigation = criarNavigation();
  const user = userEvent.setup();
  await render(<TelaCadastroPonto navigation={navigation} route={{}} />);
  await user.press(screen.getByRole('button', { name: 'Cadastrar ponto' }));

  const alertas = (await screen.findAllByRole('alert')).map((a) => a.props.children);
  expect(alertas).toEqual(
    expect.arrayContaining([
      'Campo obrigatório',
      'O CEP deve ter 8 dígitos',
      'Escolha pelo menos um tipo de material',
      'Informe pelo menos um horário de funcionamento',
      'Já existe um ponto ativo cadastrado neste endereço',
      'Confira os campos destacados',
    ])
  );
  expect(navigation.goBack).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Cadastrar ponto' })).not.toBeDisabled();
});

test('sem internet ou com outra falha, avisa sem sair da tela', async () => {
  controladorCadastro.cadastrarPonto
    .mockRejectedValueOnce(Object.assign(new Error('offline'), { codigo: 'sem-conexao' }))
    .mockRejectedValueOnce(new Error('falhou'));
  const user = userEvent.setup();
  await render(<TelaCadastroPonto navigation={criarNavigation()} route={{}} />);

  await user.press(screen.getByRole('button', { name: 'Cadastrar ponto' }));
  expect(await screen.findByText('Sem conexão com a internet. Não foi possível salvar o ponto.')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Cadastrar ponto' }));
  expect(await screen.findByText('Não foi possível salvar o ponto. Tente novamente.')).toBeTruthy();
});

test('horário inválido ou repetido não é adicionado; remover tira da lista', async () => {
  const user = userEvent.setup();
  await render(<TelaCadastroPonto navigation={criarNavigation()} route={{}} />);

  await user.press(screen.getByRole('button', { name: 'Adicionar horário' }));
  await user.press(screen.getByRole('button', { name: 'Adicionar horário' }));
  expect(screen.getByText('Este horário já foi adicionado')).toBeTruthy();

  await user.clear(screen.getByLabelText('Fecha às'));
  await user.type(screen.getByLabelText('Fecha às'), '8h');
  await user.press(screen.getByRole('button', { name: 'Adicionar horário' }));
  expect(screen.getByText('Use o formato HH:MM, com abertura diferente do fechamento')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: 'Remover Segunda-feira: 08:00 às 17:00' }));
  expect(screen.queryByText('Segunda-feira: 08:00 às 17:00')).toBeNull();
});

test('desmarcar um material tira ele da lista', async () => {
  controladorCadastro.cadastrarPonto.mockResolvedValue({ sucesso: false, mensagem: 'x', erros: {} });
  const user = userEvent.setup();
  await render(<TelaCadastroPonto navigation={criarNavigation()} route={{}} />);
  await user.press(screen.getByRole('checkbox', { name: 'Aceita papel' }));
  await user.press(screen.getByRole('checkbox', { name: 'Aceita papel' }));
  await user.press(screen.getByRole('button', { name: 'Cadastrar ponto' }));
  expect(controladorCadastro.cadastrarPonto.mock.calls[0][0].materiais).toEqual([]);
});

describe('edição (CT14)', () => {
  test('abre preenchida e, sem mudar o endereço, mantém as coordenadas', async () => {
    controladorCadastro.editarPonto.mockResolvedValue({ sucesso: true, mensagem: 'Ponto de coleta atualizado' });
    const navigation = criarNavigation();
    const user = userEvent.setup();
    await render(<TelaCadastroPonto navigation={navigation} route={{ params: { ponto: PONTO } }} />);

    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Editar ponto' });
    expect(screen.getByLabelText('Nome do ponto').props.value).toBe('Ecoponto Teste Paulista');
    expect(screen.getByRole('checkbox', { name: 'Aceita papel' })).toBeChecked();

    await user.clear(screen.getByLabelText('Nome do ponto'));
    await user.type(screen.getByLabelText('Nome do ponto'), 'Novo nome');
    await user.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    const [id, enviado] = controladorCadastro.editarPonto.mock.calls[0];
    expect(id).toBe('p1');
    expect(enviado).toMatchObject({ nome: 'Novo nome', latitude: -23.5614, longitude: -46.6559 });
    expect(navigation.goBack).toHaveBeenCalled();
  });

  test('mudando o endereço, envia sem coordenadas para geocodificar de novo', async () => {
    controladorCadastro.editarPonto.mockResolvedValue({ sucesso: true, mensagem: 'ok' });
    const user = userEvent.setup();
    await render(<TelaCadastroPonto navigation={criarNavigation()} route={{ params: { ponto: PONTO } }} />);

    await user.clear(screen.getByLabelText('Número'));
    await user.type(screen.getByLabelText('Número'), '900');
    await user.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    const enviado = controladorCadastro.editarPonto.mock.calls[0][1];
    expect(enviado.endereco.numero).toBe('900');
    expect(enviado).not.toHaveProperty('latitude');
  });

  test('ponto sem endereço salvo abre com os campos vazios', async () => {
    const semEndereco = { ...PONTO, endereco: undefined };
    await render(<TelaCadastroPonto navigation={criarNavigation()} route={{ params: { ponto: semEndereco } }} />);
    expect(screen.getByLabelText('CEP').props.value).toBe('');
  });
});
