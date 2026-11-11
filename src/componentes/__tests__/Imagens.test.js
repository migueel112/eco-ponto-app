// Componentes de imagem: ícones dos materiais e logo (RNF07).
import { render, screen } from '@testing-library/react-native';
import IconeMaterial, { IMAGENS_MATERIAIS, imagemDoMaterial } from '../IconeMaterial';
import Logo from '../Logo';
import { TIPOS_DE_MATERIAL } from '../../dominio/materiais';

test('todo tipo de material tem imagem', () => {
  TIPOS_DE_MATERIAL.forEach((tipo) => expect(imagemDoMaterial(tipo.nome)).toBeTruthy());
  expect(Object.keys(IMAGENS_MATERIAIS)).toHaveLength(5);
  expect(imagemDoMaterial('Plástico')).toBe(IMAGENS_MATERIAIS.plastico);
  expect(imagemDoMaterial('madeira')).toBeNull();
});

test('ícone decorativo fica fora do leitor de tela', async () => {
  await render(<IconeMaterial nome="vidro" />);
  expect(screen.queryByRole('image')).toBeNull();
});

test('ícone informativo tem descrição e o tamanho pedido', async () => {
  await render(<IconeMaterial nome="metal" decorativo={false} tamanho={48} />);
  const imagem = screen.getByRole('image', { name: 'Material: metal' });
  expect(imagem.props.style).toEqual({ width: 48, height: 48 });
});

test('material desconhecido não mostra nada', async () => {
  await render(<IconeMaterial nome="madeira" />);
  expect(screen.toJSON()).toBeNull();
});

test('logo tem descrição para o leitor de tela', async () => {
  await render(<Logo tamanho={64} />);
  expect(screen.getByRole('image', { name: 'Logo do Eco Ponto' }).props.style).toEqual({ width: 64, height: 64 });
});
