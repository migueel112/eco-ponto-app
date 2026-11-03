import { StyleSheet, View } from 'react-native';
import { cores, espacamento, raio } from '../tema';

// Cartão: caixa branca com borda, usada para agrupar informações (ex.: um ponto de coleta).
export default function Cartao({ children, estilo }) {
  return <View style={[styles.cartao, estilo]}>{children}</View>;
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espacamento.md,
  },
});
