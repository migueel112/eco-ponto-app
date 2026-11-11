import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Botao from '../componentes/Botao';
import Cartao from '../componentes/Cartao';
import EstadoCarregamento from '../componentes/EstadoCarregamento';
import TelaBase from '../componentes/TelaBase';
import { descreverEndereco, descreverMateriais } from '../dominio/formatacao';
import { SITUACAO_ATIVO } from '../dominio/pontoDeColeta';
import useConsulta from '../ganchos/useConsulta';
import { controladorCadastro } from '../montagem';
import { vibrarErro, vibrarSucesso } from '../servicos/vibracao';
import { cores, espacamento, raio, tipografia } from '../tema';

// Pontos do parceiro logado, ativos e inativos, com editar (RF09) e excluir
// com confirmação (RF10). A lista é recarregada sempre que a tela volta a
// aparecer (por exemplo, depois de cadastrar ou editar um ponto).
export default function TelaMeusPontos({ navigation }) {
  const [aviso, setAviso] = useState(null);
  const { dados, carregando, erro, recarregar } = useConsulta(() => controladorCadastro.listarMeusPontos());

  useEffect(() => navigation.addListener('focus', recarregar), [navigation, recarregar]);

  async function excluir(ponto) {
    setAviso(null);
    try {
      const resposta = await controladorCadastro.excluirPonto(ponto.id);
      setAviso({ texto: resposta.mensagem, sucesso: resposta.sucesso });
      if (resposta.sucesso) {
        vibrarSucesso();
        recarregar();
      } else {
        vibrarErro();
      }
    } catch {
      vibrarErro();
      setAviso({ texto: 'Não foi possível excluir o ponto. Tente novamente.', sucesso: false });
    }
  }

  function confirmarExclusao(ponto) {
    Alert.alert(
      'Excluir ponto de coleta',
      `Tem certeza que deseja excluir "${ponto.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => excluir(ponto) },
      ]
    );
  }

  const pontos = dados?.pontos ?? [];
  // listarMeusPontos responde sem sucesso quando a sessão terminou.
  const erroDaLista = erro ?? (dados && !dados.sucesso ? dados.mensagem : null);

  return (
    <TelaBase>
      <Botao titulo="Cadastrar novo ponto" aoPressionar={() => navigation.navigate('CadastroPonto')} />

      {aviso ? (
        <Text
          style={[tipografia.corpo, aviso.sucesso ? styles.sucesso : styles.falha]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {aviso.texto}
        </Text>
      ) : null}

      <EstadoCarregamento
        carregando={carregando}
        textoCarregando="Carregando os seus pontos..."
        erro={erroDaLista}
        aoTentarDeNovo={recarregar}
        vazio={dados?.sucesso && pontos.length === 0 ? 'Você ainda não cadastrou nenhum ponto de coleta.' : null}
      >
        {pontos.map((ponto) => (
          <Cartao key={ponto.id} estilo={styles.cartao}>
            <View style={styles.cabecalho}>
              <Text style={[tipografia.subtitulo, styles.nome]}>{ponto.nome}</Text>
              {ponto.situacao !== SITUACAO_ATIVO ? <Text style={styles.inativo}>Inativo</Text> : null}
            </View>
            <Text style={tipografia.corpo}>{descreverEndereco(ponto)}</Text>
            <Text style={tipografia.legenda}>
              {ponto.cidade} - {ponto.uf} · Aceita: {descreverMateriais(ponto.materiais)}
            </Text>
            <View style={styles.acoes}>
              <Botao
                titulo="Editar"
                variante="secundario"
                estilo={styles.acao}
                rotuloAcessivel={`Editar ${ponto.nome}`}
                aoPressionar={() => navigation.navigate('CadastroPonto', { ponto })}
              />
              <Botao
                titulo="Excluir"
                variante="secundario"
                estilo={styles.acao}
                rotuloAcessivel={`Excluir ${ponto.nome}`}
                aoPressionar={() => confirmarExclusao(ponto)}
              />
            </View>
          </Cartao>
        ))}
      </EstadoCarregamento>
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  cartao: {
    gap: espacamento.xs,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.sm,
  },
  nome: {
    flexShrink: 1,
  },
  inativo: {
    ...tipografia.legenda,
    color: cores.texto,
    backgroundColor: cores.borda,
    paddingHorizontal: espacamento.sm,
    borderRadius: raio.sm,
    overflow: 'hidden',
  },
  acoes: {
    flexDirection: 'row',
    gap: espacamento.sm,
    marginTop: espacamento.sm,
  },
  acao: {
    flex: 1,
  },
  sucesso: {
    color: cores.primariaEscura,
  },
  falha: {
    color: cores.erro,
  },
});
