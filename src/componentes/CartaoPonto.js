import { Pressable, StyleSheet, Text, View } from 'react-native';
import { descreverDistancia, descreverEndereco, descreverMateriais } from '../dominio/formatacao';
import { cores, espacamento, raio, tipografia } from '../tema';
import IconeMaterial from './IconeMaterial';

// Resumo de um ponto de coleta numa lista: nome, endereço, materiais e, se
// houver, a distância. O cartão inteiro é tocável (abre os detalhes).
export default function CartaoPonto({ ponto, aoPressionar }) {
  const endereco = descreverEndereco(ponto);
  const materiais = descreverMateriais(ponto.materiais);
  const distancia = descreverDistancia(ponto.distanciaKm);

  const rotulo = [ponto.nome, endereco, `Aceita ${materiais}`, distancia && `a ${distancia}`]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint="Abre os detalhes do ponto de coleta"
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
    >
      <View style={styles.cabecalho}>
        <Text style={[tipografia.subtitulo, styles.nome]}>{ponto.nome}</Text>
        {distancia ? <Text style={tipografia.legenda}>{distancia}</Text> : null}
      </View>
      <Text style={tipografia.corpo}>{endereco}</Text>
      <Text style={tipografia.legenda}>Aceita: {materiais}</Text>
      <View style={styles.icones}>
        {(ponto.materiais ?? []).map((material) => (
          <IconeMaterial key={material} nome={material} tamanho={28} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espacamento.md,
    gap: espacamento.xs,
  },
  pressionado: {
    backgroundColor: cores.primariaClara,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: espacamento.sm,
  },
  nome: {
    flexShrink: 1,
  },
  icones: {
    flexDirection: 'row',
    gap: espacamento.xs,
    marginTop: espacamento.xs,
  },
});
