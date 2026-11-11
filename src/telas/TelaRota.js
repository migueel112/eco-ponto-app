import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Botao from '../componentes/Botao';
import Cartao from '../componentes/Cartao';
import EstadoCarregamento from '../componentes/EstadoCarregamento';
import TelaBase from '../componentes/TelaBase';
import { descreverDistancia } from '../dominio/formatacao';
import { descreverTempo, regiaoDoTrajeto, urlNavegacao } from '../dominio/rota';
import { mensagemDoErro } from '../ganchos/useBuscaProximo';
import useConsulta from '../ganchos/useConsulta';
import { controladorPontoDeColeta } from '../montagem';
import { ATRIBUICAO_ROTA } from '../servicos/rotas';
import { obterPosicaoAtual } from '../servicos/localizacao';
import { cores, espacamento, raio, tipografia } from '../tema';

// Rota até o ponto de coleta (RF07): trajeto no mapa, distância e tempo, e o
// botão para abrir o app de navegação do celular. Sem internet, informa que
// não é possível calcular a rota. Se a tela abrir sem posição de referência
// (busca por Estado e cidade), oferece usar o GPS.
// A origem fica só no estado da tela, em memória (RNF04).
export default function TelaRota({ route }) {
  const { idPonto } = route.params;
  const [origem, setOrigem] = useState(route.params.origem ?? null);
  const [localizando, setLocalizando] = useState(false);
  const [erroGps, setErroGps] = useState(null);

  const { dados, carregando, erro, recarregar } = useConsulta(
    () => controladorPontoDeColeta.calcularRota(origem, idPonto),
    [idPonto, origem?.latitude, origem?.longitude]
  );

  async function usarGps() {
    setLocalizando(true);
    setErroGps(null);
    try {
      setOrigem(await obterPosicaoAtual());
    } catch (falha) {
      setErroGps(mensagemDoErro(falha));
    }
    setLocalizando(false);
  }

  const abrirNavegacao = () => Linking.openURL(urlNavegacao(dados.destino, Platform.OS));

  return (
    <TelaBase>
      <EstadoCarregamento
        carregando={carregando || localizando}
        textoCarregando={localizando ? 'Obtendo a sua localização...' : 'Calculando a rota...'}
        erro={erro}
        aoTentarDeNovo={recarregar}
      >
        {dados?.rota ? (
          <Trajeto origem={origem} destino={dados.destino} rota={dados.rota} />
        ) : (
          <Cartao estilo={styles.secao}>
            <Text style={tipografia.corpo} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {dados?.mensagem}
            </Text>
            {!origem ? (
              <>
                <Botao titulo="Usar minha localização" aoPressionar={usarGps} />
                {erroGps ? (
                  <Text style={styles.erro} accessibilityRole="alert">
                    {erroGps}
                  </Text>
                ) : null}
              </>
            ) : (
              <Botao titulo="Tentar de novo" variante="secundario" aoPressionar={recarregar} />
            )}
          </Cartao>
        )}

        {dados?.destino ? (
          <Botao titulo="Abrir no app de navegação" aoPressionar={abrirNavegacao} />
        ) : null}
      </EstadoCarregamento>
    </TelaBase>
  );
}

function Trajeto({ origem, destino, rota }) {
  const distancia = descreverDistancia(rota.distanciaKm);
  const tempo = descreverTempo(rota.tempoEstimadoMin);
  const coordenadas = rota.trajeto.length > 0 ? rota.trajeto : [origem, destino];

  return (
    <>
      <Cartao estilo={styles.resumo}>
        <Text style={tipografia.subtitulo} accessibilityRole="header">
          {destino.nome}
        </Text>
        <Text style={tipografia.corpo}>
          {distancia} de carro · cerca de {tempo}
        </Text>
      </Cartao>

      <View style={styles.moldura}>
        <MapView
          style={styles.mapa}
          initialRegion={regiaoDoTrajeto(coordenadas)}
          accessibilityLabel={`Mapa com o trajeto até ${destino.nome}: ${distancia}, cerca de ${tempo}`}
        >
          <Polyline coordinates={coordenadas} strokeColor={cores.primaria} strokeWidth={5} />
          <Marker coordinate={origem} title="Ponto de partida" pinColor="blue" />
          <Marker
            coordinate={{ latitude: destino.latitude, longitude: destino.longitude }}
            title={destino.nome}
            pinColor="green"
          />
        </MapView>
      </View>
      <Text style={tipografia.legenda}>{ATRIBUICAO_ROTA}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: espacamento.sm,
  },
  resumo: {
    gap: espacamento.xs,
  },
  moldura: {
    height: 320,
    borderRadius: raio.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.borda,
  },
  mapa: {
    flex: 1,
  },
  erro: {
    ...tipografia.corpo,
    color: cores.erro,
  },
});
