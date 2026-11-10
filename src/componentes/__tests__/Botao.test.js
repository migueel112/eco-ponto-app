// Componente Botao: toque, desabilitado e rótulo de acessibilidade (RNF07).
import { render, screen, userEvent } from '@testing-library/react-native';
import Botao from '../Botao';

test('mostra o título e chama a ação ao tocar', async () => {
  const acao = jest.fn();
  const user = userEvent.setup();
  await render(<Botao titulo="Buscar" aoPressionar={acao} />);
  await user.press(screen.getByRole('button', { name: 'Buscar' }));
  expect(acao).toHaveBeenCalledTimes(1);
});

test('desabilitado não chama a ação e avisa o leitor de tela', async () => {
  const acao = jest.fn();
  const user = userEvent.setup();
  await render(<Botao titulo="Em breve" aoPressionar={acao} desabilitado variante="secundario" />);
  const botao = screen.getByRole('button', { name: 'Em breve' });
  expect(botao).toBeDisabled();
  await user.press(botao);
  expect(acao).not.toHaveBeenCalled();
});

test('usa o rótulo acessível quando informado', async () => {
  await render(<Botao titulo="São Paulo" rotuloAcessivel="Ver cidades de São Paulo" />);
  expect(screen.getByRole('button', { name: 'Ver cidades de São Paulo' })).toHaveTextContent('São Paulo');
});
