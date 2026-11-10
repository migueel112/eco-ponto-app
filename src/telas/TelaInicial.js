import { StyleSheet, Text, View } from 'react-native';
import Botao from '../componentes/Botao';
import Cartao from '../componentes/Cartao';
import EstadoCarregamento from '../componentes/EstadoCarregamento';
import TelaBase from '../componentes/TelaBase';
import useConsulta from '../ganchos/useConsulta';
import { controladorBusca } from '../montagem';
import { espacamento, tipografia } from '../tema';

// Ponto de partida da busca (RF01 a RF03). Os Estados aparecem já aqui para
// cumprir o RNF01: Estado (1º toque) -> cidade (2º) -> ponto (3º).
export default function TelaInicial({ navigation }) {
  const { dados: estados, carregando, erro, recarregar } = useConsulta(() =>
    controladorBusca.listarEstados()
  );

  return (
    <TelaBase descricao="Encontre o ponto de coleta de reciclagem mais próximo de você.">
      <Botao titulo="Usar minha localização (em breve)" variante="secundario" desabilitado />
      <Botao titulo="Pesquisar um endereço (em breve)" variante="secundario" desabilitado />

      <Cartao estilo={styles.secao}>
        <Text style={tipografia.subtitulo} accessibilityRole="header">
          Buscar por Estado
        </Text>
        <Text style={tipografia.legenda}>Só aparecem Estados com pontos de coleta ativos.</Text>

        <EstadoCarregamento
          carregando={carregando}
          textoCarregando="Carregando os Estados..."
          erro={erro}
          aoTentarDeNovo={recarregar}
          vazio={estados?.length === 0 ? 'Ainda não há pontos de coleta cadastrados.' : null}
        >
          <View style={styles.grade}>
            {(estados ?? []).map((estado) => (
              <Botao
                key={estado.sigla}
                titulo={estado.nome}
                variante="secundario"
                estilo={styles.estado}
                rotuloAcessivel={`Ver cidades de ${estado.nome}`}
                aoPressionar={() =>
                  navigation.navigate('ConsultaRegiao', { uf: estado.sigla, nomeEstado: estado.nome })
                }
              />
            ))}
          </View>
        </EstadoCarregamento>
      </Cartao>
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: espacamento.sm,
  },
  grade: {
    gap: espacamento.sm,
  },
  estado: {
    alignSelf: 'stretch',
  },
});
