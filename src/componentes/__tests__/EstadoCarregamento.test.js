// Feedback de carregando, erro e vazio.
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import EstadoCarregamento from '../EstadoCarregamento';

test('carregando mostra o indicador e o texto', async () => {
  await render(<EstadoCarregamento carregando textoCarregando="Buscando cidades..." />);
  expect(screen.getByLabelText('Buscando cidades...')).toBeTruthy();
  expect(screen.getByText('Buscando cidades...')).toBeTruthy();
});

test('erro mostra a mensagem e o botão "Tentar de novo"', async () => {
  const tentar = jest.fn();
  const user = userEvent.setup();
  await render(<EstadoCarregamento erro="Sem conexão" aoTentarDeNovo={tentar} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão');
  await user.press(screen.getByRole('button', { name: 'Tentar de novo' }));
  expect(tentar).toHaveBeenCalledTimes(1);
});

test('erro sem ação não mostra botão', async () => {
  await render(<EstadoCarregamento erro="Falhou" />);
  expect(screen.queryByRole('button')).toBeNull();
});

test('vazio mostra a mensagem e a ação opcional', async () => {
  const limpar = jest.fn();
  const user = userEvent.setup();
  await render(
    <EstadoCarregamento vazio="Nenhum ponto" acaoVazio={{ titulo: 'Limpar filtro', aoPressionar: limpar }} />
  );
  expect(screen.getByText('Nenhum ponto')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Limpar filtro' }));
  expect(limpar).toHaveBeenCalled();
});

test('vazio sem ação não mostra botão', async () => {
  await render(<EstadoCarregamento vazio="Nada aqui" />);
  expect(screen.queryByRole('button')).toBeNull();
});

test('sem carregando, erro ou vazio mostra o conteúdo', async () => {
  await render(
    <EstadoCarregamento>
      <Text>Conteúdo</Text>
    </EstadoCarregamento>
  );
  expect(screen.getByText('Conteúdo')).toBeTruthy();
});

test('sem conteúdo não quebra', async () => {
  await render(<EstadoCarregamento />);
  expect(screen.toJSON()).toBeNull();
});
