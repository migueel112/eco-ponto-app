import { Pressable, StyleSheet, Text } from 'react-native';
import { alturaToque, cores, espacamento, raio } from '../tema';

// Botão que liga e desliga (usado no filtro de materiais). Quando ligado,
// fica preenchido de verde e mostra um "✓". O leitor de tela anuncia se
// está marcado ou não (RNF07). "icone" (opcional) aparece antes do título.
export default function Alternador({ titulo, ligado, aoAlternar, rotuloAcessivel, icone = null }) {
  return (
    <Pressable
      onPress={aoAlternar}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: ligado }}
      accessibilityLabel={rotuloAcessivel ?? titulo}
      style={({ pressed }) => [
        styles.base,
        ligado ? styles.ligado : styles.desligado,
        pressed && styles.pressionado,
      ]}
    >
      {icone}
      <Text style={[styles.texto, ligado ? styles.textoLigado : styles.textoDesligado]}>
        {ligado ? `✓ ${titulo}` : titulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: alturaToque,
    paddingHorizontal: espacamento.md,
    borderRadius: raio.md,
    borderWidth: 2,
    borderColor: cores.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.sm,
  },
  ligado: {
    backgroundColor: cores.primaria,
  },
  desligado: {
    backgroundColor: cores.superficie,
  },
  pressionado: {
    opacity: 0.8,
  },
  texto: {
    fontSize: 16,
    fontWeight: '600',
  },
  textoLigado: {
    color: cores.textoSobrePrimaria,
  },
  textoDesligado: {
    color: cores.primaria,
  },
});
