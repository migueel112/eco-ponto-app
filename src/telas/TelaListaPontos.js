import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Alternador from '../componentes/Alternador';
import CartaoPonto from '../componentes/CartaoPonto';
import EstadoCarregamento from '../componentes/EstadoCarregamento';
import TelaBase from '../componentes/TelaBase';
import { TIPOS_DE_MATERIAL } from '../dominio/materiais';
import { comInicialMaiuscula } from '../dominio/formatacao';
import useConsulta from '../ganchos/useConsulta';
import { controladorBusca } from '../montagem';
import { espacamento, tipografia } from '../tema';

// Pontos ativos da cidade (RF04) com filtro por material (RF08). Com vários
// materiais marcados, só ficam os pontos que aceitam todos. O toque no
// cartão abre os detalhes (3º toque do RNF01).
export default function TelaListaPontos({ navigation, route }) {
  const { uf, cidade } = route.params;
  const [tipos, setTipos] = useState([]);

  const { dados, carregando, erro, recarregar } = useConsulta(
    () => controladorBusca.listarPontos({ uf, cidade }, tipos),
    [uf, cidade, tipos.join('|')]
  );

  function alternarMaterial(nome) {
    setTipos((atuais) => (atuais.includes(nome) ? atuais.filter((t) => t !== nome) : [...atuais, nome]));
  }

  const pontos = dados?.pontos ?? [];

  return (
    <TelaBase>
      <Text style={tipografia.titulo} accessibilityRole="header">
        {cidade} - {uf}
      </Text>

      <View style={styles.filtro}>
        <Text style={tipografia.subtitulo}>Filtrar por material</Text>
        <View style={styles.opcoes}>
          {TIPOS_DE_MATERIAL.map((tipo) => (
            <Alternador
              key={tipo.nome}
              titulo={comInicialMaiuscula(tipo.nome)}
              rotuloAcessivel={`Filtrar por ${tipo.nome}`}
              ligado={tipos.includes(tipo.nome)}
              aoAlternar={() => alternarMaterial(tipo.nome)}
            />
          ))}
        </View>
      </View>

      <EstadoCarregamento
        carregando={carregando}
        textoCarregando="Carregando os pontos de coleta..."
        erro={erro}
        aoTentarDeNovo={recarregar}
        vazio={dados?.mensagem ?? null}
        acaoVazio={dados?.podeLimparFiltro ? { titulo: 'Limpar filtro', aoPressionar: () => setTipos([]) } : null}
      >
        <Text style={tipografia.legenda} accessibilityLiveRegion="polite">
          {pontos.length === 1 ? '1 ponto encontrado' : `${pontos.length} pontos encontrados`}
        </Text>
        {pontos.map((ponto) => (
          <CartaoPonto
            key={ponto.id}
            ponto={ponto}
            aoPressionar={() => navigation.navigate('Detalhes', { idPonto: ponto.id })}
          />
        ))}
      </EstadoCarregamento>
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  filtro: {
    gap: espacamento.sm,
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
});
