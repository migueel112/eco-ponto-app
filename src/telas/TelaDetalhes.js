import { Linking, StyleSheet, Text, View } from 'react-native';
import Botao from '../componentes/Botao';
import Cartao from '../componentes/Cartao';
import EstadoCarregamento from '../componentes/EstadoCarregamento';
import IconeMaterial from '../componentes/IconeMaterial';
import TelaBase from '../componentes/TelaBase';
import {
  descreverCep,
  descreverDistancia,
  descreverEndereco,
  descreverHorario,
  descreverMateriais,
  descreverTelefone,
  ordenarHorarios,
} from '../dominio/formatacao';
import useConsulta from '../ganchos/useConsulta';
import { controladorPontoDeColeta } from '../montagem';
import { cores, espacamento, raio, tipografia } from '../tema';

// Detalhes do ponto de coleta (RF05): endereço, horários, materiais,
// telefone, "aberto agora" ou "fechado" e a distância, que só aparece quando
// há posição de referência (GPS ou endereço pesquisado). Oferece a rota.
// A origem vem pelos parâmetros da navigation, só em memória (RNF04).
export default function TelaDetalhes({ navigation, route }) {
  const { idPonto, origem = null } = route.params;
  const { dados, carregando, erro, recarregar } = useConsulta(
    () => controladorPontoDeColeta.obterDetalhes(idPonto, origem),
    [idPonto]
  );

  const ponto = dados?.ponto;

  return (
    <TelaBase>
      <EstadoCarregamento
        carregando={carregando}
        textoCarregando="Carregando o ponto de coleta..."
        erro={erro}
        aoTentarDeNovo={recarregar}
        vazio={dados && !ponto ? dados.mensagem : null}
        acaoVazio={{ titulo: 'Voltar', aoPressionar: () => navigation.goBack() }}
      >
        {ponto ? (
          <Conteudo
            ponto={ponto}
            aberto={dados.aberto}
            distanciaKm={dados.distanciaKm}
            aoVerRota={() => navigation.navigate('Rota', { idPonto, origem })}
          />
        ) : null}
      </EstadoCarregamento>
    </TelaBase>
  );
}

function Conteudo({ ponto, aberto, distanciaKm, aoVerRota }) {
  const distancia = descreverDistancia(distanciaKm);
  const telefone = descreverTelefone(ponto.telefone);

  return (
    <>
      <View style={styles.cabecalho}>
        <Text style={tipografia.titulo} accessibilityRole="header">
          {ponto.nome}
        </Text>
        {/* O texto diz a situação; a cor só reforça (não depende só da cor). */}
        <Text
          style={[styles.situacao, aberto ? styles.aberto : styles.fechado]}
          accessibilityLabel={aberto ? 'Situação: aberto agora' : 'Situação: fechado agora'}
        >
          {aberto ? 'Aberto agora' : 'Fechado'}
        </Text>
        {distancia ? <Text style={tipografia.corpo}>A {distancia} em linha reta</Text> : null}
      </View>

      <Cartao estilo={styles.secao}>
        <Text style={tipografia.subtitulo}>Endereço</Text>
        <Text style={tipografia.corpo}>{descreverEndereco(ponto)}</Text>
        <Text style={tipografia.corpo}>
          {ponto.cidade} - {ponto.uf}, CEP {descreverCep(ponto.endereco?.cep)}
        </Text>
      </Cartao>

      <Cartao estilo={styles.secao}>
        <Text style={tipografia.subtitulo}>Materiais aceitos</Text>
        <Text style={tipografia.corpo}>{descreverMateriais(ponto.materiais)}</Text>
        <View style={styles.icones}>
          {(ponto.materiais ?? []).map((material) => (
            <IconeMaterial key={material} nome={material} tamanho={40} />
          ))}
        </View>
      </Cartao>

      <Cartao estilo={styles.secao}>
        <Text style={tipografia.subtitulo}>Horário de funcionamento</Text>
        {ordenarHorarios(ponto.horarios).map((horario) => (
          <Text key={`${horario.diaDaSemana}-${horario.horaAbertura}`} style={tipografia.corpo}>
            {descreverHorario(horario)}
          </Text>
        ))}
      </Cartao>

      <Cartao estilo={styles.secao}>
        <Text style={tipografia.subtitulo}>Telefone</Text>
        <Text style={tipografia.corpo}>{telefone}</Text>
        <Botao
          titulo="Ligar"
          variante="secundario"
          rotuloAcessivel={`Ligar para ${telefone}`}
          aoPressionar={() => Linking.openURL(`tel:${ponto.telefone}`)}
        />
      </Cartao>

      <Botao titulo="Ver rota até o ponto" aoPressionar={aoVerRota} />
    </>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    gap: espacamento.sm,
  },
  situacao: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: espacamento.sm,
    paddingVertical: espacamento.xs,
    borderRadius: raio.sm,
    overflow: 'hidden',
  },
  aberto: {
    backgroundColor: cores.primaria,
    color: cores.textoSobrePrimaria,
  },
  fechado: {
    backgroundColor: cores.erro,
    color: cores.textoSobrePrimaria,
  },
  secao: {
    gap: espacamento.xs,
  },
  icones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
});
