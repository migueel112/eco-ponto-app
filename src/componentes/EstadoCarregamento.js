import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { cores, espacamento, tipografia } from '../tema';
import Botao from './Botao';

// Feedback padrão enquanto a tela busca dados:
// - carregando: indicador girando e um texto;
// - erro: mensagem em vermelho e o botão "Tentar de novo";
// - vazio: mensagem e, se houver, um botão de ação (ex.: "Limpar filtro");
// - senão, mostra o conteúdo (children).
export default function EstadoCarregamento({
  carregando = false,
  textoCarregando = 'Carregando...',
  erro = null,
  aoTentarDeNovo,
  vazio = null,
  acaoVazio,
  children,
}) {
  if (carregando) {
    return (
      <View style={styles.centro} accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={cores.primaria} accessibilityLabel={textoCarregando} />
        <Text style={tipografia.legenda}>{textoCarregando}</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro} accessibilityLiveRegion="assertive">
        <Text style={[tipografia.corpo, styles.erro]} accessibilityRole="alert">
          {erro}
        </Text>
        {aoTentarDeNovo ? <Botao titulo="Tentar de novo" aoPressionar={aoTentarDeNovo} /> : null}
      </View>
    );
  }

  if (vazio) {
    return (
      <View style={styles.centro}>
        <Text style={[tipografia.corpo, styles.textoCentral]}>{vazio}</Text>
        {acaoVazio ? (
          <Botao titulo={acaoVazio.titulo} variante="secundario" aoPressionar={acaoVazio.aoPressionar} />
        ) : null}
      </View>
    );
  }

  return children ?? null;
}

const styles = StyleSheet.create({
  centro: {
    alignItems: 'center',
    gap: espacamento.md,
    paddingVertical: espacamento.lg,
  },
  erro: {
    color: cores.erro,
    textAlign: 'center',
  },
  textoCentral: {
    textAlign: 'center',
  },
});
