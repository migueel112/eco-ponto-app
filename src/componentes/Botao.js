import { Pressable, StyleSheet, Text } from 'react-native';
import { alturaToque, cores, espacamento, raio } from '../tema';

// Botão do app. variante: 'primario' (preenchido) ou 'secundario' (só contorno).
export default function Botao({ titulo, aoPressionar, variante = 'primario', desabilitado = false, estilo }) {
  const primario = variante === 'primario';

  return (
    <Pressable
      onPress={aoPressionar}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      style={({ pressed }) => [
        styles.base,
        primario ? styles.primario : styles.secundario,
        pressed && (primario ? styles.primarioPressionado : styles.secundarioPressionado),
        desabilitado && styles.desabilitado,
        estilo,
      ]}
    >
      <Text style={[styles.texto, primario ? styles.textoPrimario : styles.textoSecundario]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: alturaToque,
    paddingHorizontal: espacamento.md,
    borderRadius: raio.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
  },
  primarioPressionado: {
    backgroundColor: cores.primariaEscura,
    borderColor: cores.primariaEscura,
  },
  secundario: {
    backgroundColor: cores.superficie,
    borderColor: cores.primaria,
  },
  secundarioPressionado: {
    backgroundColor: cores.primariaClara,
  },
  desabilitado: {
    opacity: 0.5,
  },
  texto: {
    fontSize: 16,
    fontWeight: '600',
  },
  textoPrimario: {
    color: cores.textoSobrePrimaria,
  },
  textoSecundario: {
    color: cores.primaria,
  },
});
