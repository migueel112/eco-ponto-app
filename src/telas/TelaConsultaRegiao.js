import { StyleSheet, View } from 'react-native';
import Botao from '../componentes/Botao';
import EstadoCarregamento from '../componentes/EstadoCarregamento';
import TelaBase from '../componentes/TelaBase';
import useConsulta from '../ganchos/useConsulta';
import { controladorBusca } from '../montagem';
import { espacamento } from '../tema';

// Cidades do Estado escolhido na tela inicial (RF01). Só aparecem cidades com
// ponto ativo, em ordem alfabética. O toque na cidade abre a lista de pontos.
export default function TelaConsultaRegiao({ navigation, route }) {
  const { uf, nomeEstado } = route.params;
  const { dados: cidades, carregando, erro, recarregar } = useConsulta(
    () => controladorBusca.listarCidades(uf),
    [uf]
  );

  return (
    <TelaBase descricao={`Escolha a cidade em ${nomeEstado}. Só aparecem cidades com pontos de coleta ativos.`}>
      <EstadoCarregamento
        carregando={carregando}
        textoCarregando="Carregando as cidades..."
        erro={erro}
        aoTentarDeNovo={recarregar}
        vazio={cidades?.length === 0 ? `Nenhuma cidade com ponto de coleta em ${nomeEstado}.` : null}
        acaoVazio={{ titulo: 'Escolher outro Estado', aoPressionar: () => navigation.goBack() }}
      >
        <View style={styles.lista}>
          {(cidades ?? []).map((cidade) => (
            <Botao
              key={cidade}
              titulo={cidade}
              variante="secundario"
              rotuloAcessivel={`Ver pontos de coleta de ${cidade}`}
              aoPressionar={() => navigation.navigate('ListaPontos', { uf, cidade })}
            />
          ))}
        </View>
      </EstadoCarregamento>
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: espacamento.sm,
  },
});
