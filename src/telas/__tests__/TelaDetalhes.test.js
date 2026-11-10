// TelaDetalhes: dados do ponto, aberto ou fechado, distância e rota (CT08).
import { Linking } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import TelaDetalhes from '../TelaDetalhes';
import { controladorPontoDeColeta } from '../../montagem';

jest.mock('../../montagem', () => ({
  controladorPontoDeColeta: { obterDetalhes: jest.fn() },
}));

const navigation = { navigate: jest.fn(), goBack: jest.fn() };
const rota = (params) => ({ params: { idPonto: 'p1', ...params } });

const PONTO = {
  id: 'p1',
  nome: 'Ecoponto Teste Paulista',
  telefone: '1133334444',
  uf: 'SP',
  cidade: 'São Paulo',
  endereco: { logradouro: 'Avenida Paulista', numero: '1578', bairro: 'Bela Vista', cep: '01310200' },
  materiais: ['papel', 'vidro'],
  horarios: [
    { diaDaSemana: 6, horaAbertura: '09:00', horaFechamento: '13:00' },
    { diaDaSemana: 1, horaAbertura: '09:00', horaFechamento: '18:00' },
  ],
};

beforeEach(() => jest.clearAllMocks());

test('mostra endereço, materiais, horários e telefone', async () => {
  controladorPontoDeColeta.obterDetalhes.mockResolvedValue({ ponto: PONTO, aberto: true, distanciaKm: null });
  await render(<TelaDetalhes navigation={navigation} route={rota()} />);

  expect(await screen.findByRole('header')).toHaveTextContent('Ecoponto Teste Paulista');
  expect(screen.getByText('Avenida Paulista, 1578 - Bela Vista')).toBeTruthy();
  expect(screen.getByText('São Paulo - SP, CEP 01310-200')).toBeTruthy();
  expect(screen.getByText('papel e vidro')).toBeTruthy();
  expect(screen.getByText('(11) 3333-4444')).toBeTruthy();
  const horarios = screen.getAllByText(/-feira|Sábado|Domingo/).map((t) => t.props.children);
  expect(horarios).toEqual(['Segunda-feira: 09:00 às 18:00', 'Sábado: 09:00 às 13:00']);
});

test('aberto agora, e sem posição de referência não mostra distância', async () => {
  controladorPontoDeColeta.obterDetalhes.mockResolvedValue({ ponto: PONTO, aberto: true, distanciaKm: null });
  await render(<TelaDetalhes navigation={navigation} route={rota()} />);
  expect(await screen.findByLabelText('Situação: aberto agora')).toHaveTextContent('Aberto agora');
  expect(screen.queryByText(/em linha reta/)).toBeNull();
  expect(controladorPontoDeColeta.obterDetalhes).toHaveBeenCalledWith('p1', null);
});

test('fechado, e com posição de referência mostra a distância', async () => {
  const origem = { latitude: -23.55, longitude: -46.63 };
  controladorPontoDeColeta.obterDetalhes.mockResolvedValue({ ponto: PONTO, aberto: false, distanciaKm: 2.6 });
  await render(<TelaDetalhes navigation={navigation} route={rota({ origem })} />);
  expect(await screen.findByLabelText('Situação: fechado agora')).toHaveTextContent('Fechado');
  expect(screen.getByText('A 2,6 km em linha reta')).toBeTruthy();
  expect(controladorPontoDeColeta.obterDetalhes).toHaveBeenCalledWith('p1', origem);
});

test('"Ver rota" abre a tela de rota e "Ligar" abre o telefone', async () => {
  controladorPontoDeColeta.obterDetalhes.mockResolvedValue({ ponto: PONTO, aberto: true, distanciaKm: null });
  const abrirUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const user = userEvent.setup();
  await render(<TelaDetalhes navigation={navigation} route={rota()} />);

  await user.press(await screen.findByRole('button', { name: 'Ver rota até o ponto' }));
  expect(navigation.navigate).toHaveBeenCalledWith('Rota', { idPonto: 'p1', origem: null });

  await user.press(screen.getByRole('button', { name: 'Ligar para (11) 3333-4444' }));
  expect(abrirUrl).toHaveBeenCalledWith('tel:1133334444');
});

test('ponto inexistente ou inativo avisa e oferece voltar', async () => {
  controladorPontoDeColeta.obterDetalhes.mockResolvedValue({ ponto: null, mensagem: 'Ponto de coleta não encontrado' });
  const user = userEvent.setup();
  await render(<TelaDetalhes navigation={navigation} route={rota()} />);
  expect(await screen.findByText('Ponto de coleta não encontrado')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Voltar' }));
  expect(navigation.goBack).toHaveBeenCalled();
});

test('erro oferece tentar de novo; antes mostra o carregando', async () => {
  let rejeitar;
  controladorPontoDeColeta.obterDetalhes
    .mockReturnValueOnce(new Promise((_, j) => (rejeitar = j)))
    .mockResolvedValueOnce({ ponto: PONTO, aberto: true, distanciaKm: null });
  const user = userEvent.setup();
  await render(<TelaDetalhes navigation={navigation} route={rota()} />);
  expect(screen.getByText('Carregando o ponto de coleta...')).toBeTruthy();
  rejeitar(new Error('sem rede'));

  await user.press(await screen.findByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByRole('header')).toHaveTextContent('Ecoponto Teste Paulista');
});
