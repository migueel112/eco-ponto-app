import { StyleSheet, Text, TextInput, View } from 'react-native';
import { alturaToque, cores, espacamento, raio, tipografia } from '../tema';

// Campo de formulário com rótulo visível e mensagem de erro logo abaixo.
// O leitor de tela lê o rótulo e anuncia o erro quando ele aparece (RNF07).
// Outras propriedades (secureTextEntry, keyboardType...) vão direto para o TextInput.
export default function CampoTexto({ rotulo, valor, aoMudar, erro, dica, ...propriedades }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        value={valor}
        onChangeText={aoMudar}
        accessibilityLabel={rotulo}
        accessibilityHint={dica}
        placeholderTextColor={cores.textoSecundario}
        style={[styles.entrada, erro && styles.entradaComErro]}
        {...propriedades}
      />
      {erro ? (
        <Text style={styles.erro} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: espacamento.xs,
  },
  rotulo: {
    ...tipografia.corpo,
    fontWeight: '600',
  },
  entrada: {
    minHeight: alturaToque,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    paddingHorizontal: espacamento.md,
    backgroundColor: cores.superficie,
    color: cores.texto,
    fontSize: 16,
  },
  entradaComErro: {
    borderColor: cores.erro,
    borderWidth: 2,
  },
  erro: {
    ...tipografia.legenda,
    color: cores.erro,
  },
});
