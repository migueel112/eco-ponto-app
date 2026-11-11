import { Image } from 'react-native';
import { normalizarMaterial } from '../dominio/materiais';

// Imagens dos tipos de material (geradas por scripts/gerar-imagens.mjs).
// O require precisa ser escrito por extenso para o empacotador incluir o arquivo.
export const IMAGENS_MATERIAIS = {
  papel: require('../../assets/imagens/materiais/papel.png'),
  plastico: require('../../assets/imagens/materiais/plastico.png'),
  vidro: require('../../assets/imagens/materiais/vidro.png'),
  metal: require('../../assets/imagens/materiais/metal.png'),
  eletronico: require('../../assets/imagens/materiais/eletronico.png'),
};

export function imagemDoMaterial(nome) {
  return IMAGENS_MATERIAIS[normalizarMaterial(nome)] ?? null;
}

// Ícone redondo de um material. Quando o nome do material já aparece escrito
// ao lado, o ícone é decorativo e o leitor de tela o ignora (RNF07).
export default function IconeMaterial({ nome, tamanho = 32, decorativo = true }) {
  const imagem = imagemDoMaterial(nome);
  if (!imagem) {
    return null;
  }
  return (
    <Image
      source={imagem}
      style={{ width: tamanho, height: tamanho }}
      accessible={!decorativo}
      accessibilityRole={decorativo ? undefined : 'image'}
      accessibilityLabel={decorativo ? undefined : `Material: ${nome}`}
      importantForAccessibility={decorativo ? 'no' : 'yes'}
    />
  );
}
