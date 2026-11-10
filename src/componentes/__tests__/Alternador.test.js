// Componente Alternador: estado marcado para o leitor de tela e toque.
import { render, screen, userEvent } from '@testing-library/react-native';
import Alternador from '../Alternador';

test('desligado: sem marca e anunciado como não marcado', async () => {
  await render(<Alternador titulo="Vidro" ligado={false} aoAlternar={() => {}} />);
  const caixa = screen.getByRole('checkbox', { name: 'Vidro' });
  expect(caixa).not.toBeChecked();
  expect(caixa).toHaveTextContent('Vidro');
});

test('ligado: mostra o ✓ e é anunciado como marcado', async () => {
  await render(<Alternador titulo="Vidro" ligado aoAlternar={() => {}} rotuloAcessivel="Filtrar por vidro" />);
  const caixa = screen.getByRole('checkbox', { name: 'Filtrar por vidro' });
  expect(caixa).toBeChecked();
  expect(caixa).toHaveTextContent('✓ Vidro');
});

test('o toque chama aoAlternar', async () => {
  const alternar = jest.fn();
  const user = userEvent.setup();
  await render(<Alternador titulo="Papel" ligado={false} aoAlternar={alternar} />);
  await user.press(screen.getByRole('checkbox', { name: 'Papel' }));
  expect(alternar).toHaveBeenCalledTimes(1);
});
