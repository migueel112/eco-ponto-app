import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Botao from '../componentes/Botao';
import CampoTexto from '../componentes/CampoTexto';
import Cartao from '../componentes/Cartao';
import CartaoPonto from '../componentes/CartaoPonto';
import EstadoCarregamento from '../componentes/EstadoCarregamento';
import Logo from '../componentes/Logo';
import TelaBase from '../componentes/TelaBase';
import useBuscaProximo from '../ganchos/useBuscaProximo';
import useConsulta from '../ganchos/useConsulta';
import { controladorBusca } from '../montagem';
import { ATRIBUICAO_OSM } from '../servicos/geocodificador';
import { espacamento, tipografia } from '../tema';

// Ponto de partida da busca:
// - GPS (RF02): "Usar minha localização" (1º toque) -> ponto (2º toque);
// - endereço (RF03): funciona mesmo sem permissão de localização;
// - Estado e cidade (RF01): Estado (1º) -> cidade (2º) -> ponto (3º), RNF01.
export default function TelaInicial({ navigation }) {
  const [endereco, setEndereco] = useState('');
  const { estado: busca, usarGps, pesquisarEndereco, escolherSugestao, limpar } = useBuscaProximo();
  const { dados: estados, carregando, erro, recarregar } = useConsulta(() =>
    controladorBusca.listarEstados()
  );
  const buscando = busca.fase === 'buscando';

  return (
    <TelaBase>
      <View style={styles.marca}>
        <Logo tamanho={72} />
        <Text style={[tipografia.corpo, styles.textoMarca]}>
          Encontre o ponto de coleta de reciclagem mais próximo de você.
        </Text>
      </View>

      <Botao titulo="Usar minha localização" aoPressionar={usarGps} desabilitado={buscando} />

      <Cartao estilo={styles.secao}>
        <CampoTexto
          rotulo="Ou pesquise um endereço"
          valor={endereco}
          aoMudar={setEndereco}
          placeholder="Ex.: Avenida Paulista, 1000, São Paulo"
          returnKeyType="search"
          onSubmitEditing={() => pesquisarEndereco(endereco)}
        />
        <Botao
          titulo="Pesquisar endereço"
          variante="secundario"
          aoPressionar={() => pesquisarEndereco(endereco)}
          desabilitado={buscando}
        />
      </Cartao>

      <ResultadoBusca
        busca={busca}
        aoAbrirPonto={(resultado, origem) =>
          navigation.navigate('Detalhes', { idPonto: resultado.ponto.id, origem })
        }
        aoEscolherSugestao={escolherSugestao}
        aoFechar={limpar}
      />

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
            {(estados ?? []).map((estadoBr) => (
              <Botao
                key={estadoBr.sigla}
                titulo={estadoBr.nome}
                variante="secundario"
                rotuloAcessivel={`Ver cidades de ${estadoBr.nome}`}
                aoPressionar={() =>
                  navigation.navigate('ConsultaRegiao', { uf: estadoBr.sigla, nomeEstado: estadoBr.nome })
                }
              />
            ))}
          </View>
        </EstadoCarregamento>
      </Cartao>
    </TelaBase>
  );
}

// Mostra o andamento e o resultado da busca por GPS ou endereço.
function ResultadoBusca({ busca, aoAbrirPonto, aoEscolherSugestao, aoFechar }) {
  if (busca.fase === 'ocioso') {
    return null;
  }

  if (busca.fase === 'buscando') {
    return <EstadoCarregamento carregando textoCarregando={busca.textoBuscando} />;
  }

  if (busca.fase === 'aviso') {
    return (
      <Cartao estilo={styles.secao}>
        <Text style={tipografia.corpo} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {busca.mensagem}
        </Text>
        {busca.abrirAjustes ? (
          <Botao titulo="Abrir os Ajustes" variante="secundario" aoPressionar={() => Linking.openSettings()} />
        ) : null}
        <Botao titulo="Fechar" variante="secundario" aoPressionar={aoFechar} />
      </Cartao>
    );
  }

  if (busca.fase === 'sugestoes') {
    return (
      <Cartao estilo={styles.secao}>
        <Text style={tipografia.corpo} accessibilityRole="alert">
          {busca.mensagem}
        </Text>
        {busca.sugestoes.map((sugestao) => (
          <Botao
            key={`${sugestao.latitude},${sugestao.longitude}`}
            titulo={sugestao.descricao}
            variante="secundario"
            aoPressionar={() => aoEscolherSugestao(sugestao)}
          />
        ))}
        <Text style={tipografia.legenda}>{ATRIBUICAO_OSM}</Text>
      </Cartao>
    );
  }

  // fase 'pronto'
  return (
    <Cartao estilo={styles.secao}>
      <Text style={tipografia.subtitulo} accessibilityRole="header" accessibilityLiveRegion="polite">
        Ponto de coleta mais próximo
      </Text>
      {busca.endereco ? <Text style={tipografia.legenda}>A partir de: {busca.endereco}</Text> : null}
      <CartaoPonto
        ponto={{ ...busca.resultado.ponto, distanciaKm: busca.resultado.distanciaKm }}
        aoPressionar={() => aoAbrirPonto(busca.resultado, busca.origem)}
      />
      {busca.endereco ? <Text style={tipografia.legenda}>{ATRIBUICAO_OSM}</Text> : null}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.md,
  },
  textoMarca: {
    flex: 1,
  },
  secao: {
    gap: espacamento.sm,
  },
  grade: {
    gap: espacamento.sm,
  },
});
