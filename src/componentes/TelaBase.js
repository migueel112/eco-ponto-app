import { ScrollView, StyleSheet, Text } from 'react-native';
import { cores, espacamento, tipografia } from '../tema';

// Estrutura comum das telas: fundo, margens e um texto de apresentação.
// Os botões e cartões da tela entram como filhos.
export default function TelaBase({ descricao, children }) {
  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      {descricao ? <Text style={tipografia.corpo}>{descricao}</Text> : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    padding: espacamento.md,
    gap: espacamento.md,
  },
});
