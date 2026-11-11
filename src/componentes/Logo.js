import { Image } from 'react-native';

// Logo do Eco Ponto (gerado por scripts/gerar-imagens.mjs).
export const IMAGEM_LOGO = require('../../assets/imagens/logo.png');

export default function Logo({ tamanho = 96 }) {
  return (
    <Image
      source={IMAGEM_LOGO}
      style={{ width: tamanho, height: tamanho }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Logo do Eco Ponto"
    />
  );
}
