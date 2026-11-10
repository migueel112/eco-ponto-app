// Componente CartaoPonto: dados do ponto, distância opcional e rótulo acessível.
import { render, screen, userEvent } from '@testing-library/react-native';
import CartaoPonto from '../CartaoPonto';

const PONTO = {
  id: 'p1',
  nome: 'Ecoponto Teste Paulista',
  endereco: { logradouro: 'Avenida Paulista', numero: '1578', bairro: 'Bela Vista' },
  materiais: ['papel', 'vidro'],
};

test('mostra nome, endereço e materiais, sem distância', async () => {
  await render(<CartaoPonto ponto={PONTO} aoPressionar={() => {}} />);
  expect(screen.getByText('Ecoponto Teste Paulista')).toBeTruthy();
  expect(screen.getByText('Avenida Paulista, 1578 - Bela Vista')).toBeTruthy();
  expect(screen.getByText('Aceita: papel e vidro')).toBeTruthy();
  expect(screen.queryByText(/km$/)).toBeNull();
});

test('com distância, mostra e inclui no rótulo do leitor de tela', async () => {
  await render(<CartaoPonto ponto={{ ...PONTO, distanciaKm: 2.6 }} aoPressionar={() => {}} />);
  expect(screen.getByText('2,6 km')).toBeTruthy();
  expect(
    screen.getByRole('button', {
      name: 'Ecoponto Teste Paulista. Avenida Paulista, 1578 - Bela Vista. Aceita papel e vidro. a 2,6 km',
    })
  ).toBeTruthy();
});

test('o toque chama aoPressionar', async () => {
  const abrir = jest.fn();
  const user = userEvent.setup();
  await render(<CartaoPonto ponto={PONTO} aoPressionar={abrir} />);
  await user.press(screen.getByRole('button'));
  expect(abrir).toHaveBeenCalledTimes(1);
});
