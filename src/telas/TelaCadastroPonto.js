import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Alternador from '../componentes/Alternador';
import Botao from '../componentes/Botao';
import CampoTexto from '../componentes/CampoTexto';
import IconeMaterial from '../componentes/IconeMaterial';
import Cartao from '../componentes/Cartao';
import TelaBase from '../componentes/TelaBase';
import { ERRO_SEM_CONEXAO } from '../dominio/erros';
import { comInicialMaiuscula, descreverHorario, NOMES_DOS_DIAS, ordenarHorarios } from '../dominio/formatacao';
import { horarioValido } from '../dominio/horario';
import { TIPOS_DE_MATERIAL } from '../dominio/materiais';
import { ATRIBUICAO_OSM } from '../servicos/geocodificador';
import { controladorCadastro } from '../montagem';
import { vibrarErro, vibrarSucesso } from '../servicos/vibracao';
import { cores, espacamento, tipografia } from '../tema';

const CAMPOS_ENDERECO = ['logradouro', 'numero', 'bairro', 'cep'];

// Formulário para cadastrar (RF06) ou editar (RF09) um ponto de coleta. As
// regras (campos obrigatórios, RN02, RN03 e RN05) ficam no ControladorCadastro;
// a tela só mostra os erros ao lado de cada campo.
export default function TelaCadastroPonto({ navigation, route }) {
  const original = route.params?.ponto ?? null;
  const editando = original !== null;

  const [dados, setDados] = useState(() => ({
    nome: original?.nome ?? '',
    telefone: original?.telefone ?? '',
    uf: original?.uf ?? '',
    cidade: original?.cidade ?? '',
    endereco: {
      logradouro: original?.endereco?.logradouro ?? '',
      numero: original?.endereco?.numero ?? '',
      bairro: original?.endereco?.bairro ?? '',
      cep: original?.endereco?.cep ?? '',
    },
    materiais: original?.materiais ?? [],
    horarios: original?.horarios ?? [],
  }));
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editando ? 'Editar ponto' : 'Cadastrar ponto' });
  }, [navigation, editando]);

  const alterar = (campo) => (valor) => setDados((atual) => ({ ...atual, [campo]: valor }));
  const alterarEndereco = (campo) => (valor) =>
    setDados((atual) => ({ ...atual, endereco: { ...atual.endereco, [campo]: valor } }));

  function alternarMaterial(nome) {
    setDados((atual) => ({
      ...atual,
      materiais: atual.materiais.includes(nome)
        ? atual.materiais.filter((m) => m !== nome)
        : [...atual.materiais, nome],
    }));
  }

  // Na edição, se o endereço não mudou, mantém as coordenadas já gravadas;
  // se mudou, o controlador geocodifica de novo (RN03).
  function dadosParaEnviar() {
    const enderecoIgual =
      editando &&
      dados.uf === original.uf &&
      dados.cidade === original.cidade &&
      CAMPOS_ENDERECO.every((c) => dados.endereco[c] === (original.endereco?.[c] ?? ''));
    return enderecoIgual
      ? { ...dados, latitude: original.latitude, longitude: original.longitude }
      : { ...dados, uf: dados.uf.trim().toUpperCase() };
  }

  async function salvar() {
    setSalvando(true);
    setAviso(null);
    try {
      const resposta = editando
        ? await controladorCadastro.editarPonto(original.id, dadosParaEnviar())
        : await controladorCadastro.cadastrarPonto(dadosParaEnviar());
      if (resposta.sucesso) {
        vibrarSucesso();
        Alert.alert('Pronto', resposta.mensagem);
        navigation.goBack();
        return;
      }
      vibrarErro();
      setErros(resposta.erros ?? {});
      setAviso(resposta.mensagem);
    } catch (erro) {
      vibrarErro();
      setAviso(
        erro?.codigo === ERRO_SEM_CONEXAO
          ? 'Sem conexão com a internet. Não foi possível salvar o ponto.'
          : 'Não foi possível salvar o ponto. Tente novamente.'
      );
    }
    setSalvando(false);
  }

  return (
    <TelaBase>
      <CampoTexto rotulo="Nome do ponto" valor={dados.nome} aoMudar={alterar('nome')} erro={erros.nome} />
      <CampoTexto
        rotulo="Telefone com DDD"
        valor={dados.telefone}
        aoMudar={alterar('telefone')}
        erro={erros.telefone}
        keyboardType="phone-pad"
      />

      <Cartao estilo={styles.secao}>
        <Text style={tipografia.subtitulo} accessibilityRole="header">
          Endereço
        </Text>
        <CampoTexto
          rotulo="Estado (sigla, ex.: SP)"
          valor={dados.uf}
          aoMudar={alterar('uf')}
          erro={erros.uf}
          autoCapitalize="characters"
          maxLength={2}
        />
        <CampoTexto rotulo="Cidade" valor={dados.cidade} aoMudar={alterar('cidade')} erro={erros.cidade} />
        <CampoTexto
          rotulo="Logradouro (rua, avenida...)"
          valor={dados.endereco.logradouro}
          aoMudar={alterarEndereco('logradouro')}
          erro={erros['endereco.logradouro']}
        />
        <CampoTexto
          rotulo="Número"
          valor={dados.endereco.numero}
          aoMudar={alterarEndereco('numero')}
          erro={erros['endereco.numero']}
        />
        <CampoTexto
          rotulo="Bairro"
          valor={dados.endereco.bairro}
          aoMudar={alterarEndereco('bairro')}
          erro={erros['endereco.bairro']}
        />
        <CampoTexto
          rotulo="CEP"
          valor={dados.endereco.cep}
          aoMudar={alterarEndereco('cep')}
          erro={erros['endereco.cep']}
          keyboardType="number-pad"
        />
        {erros.endereco ? (
          <Text style={styles.erro} accessibilityRole="alert">
            {erros.endereco}
          </Text>
        ) : null}
        <Text style={tipografia.legenda}>{ATRIBUICAO_OSM}</Text>
      </Cartao>

      <Cartao estilo={styles.secao}>
        <Text style={tipografia.subtitulo} accessibilityRole="header">
          Materiais aceitos
        </Text>
        <View style={styles.opcoes}>
          {TIPOS_DE_MATERIAL.map((tipo) => (
            <Alternador
              key={tipo.nome}
              titulo={comInicialMaiuscula(tipo.nome)}
              rotuloAcessivel={`Aceita ${tipo.nome}`}
              icone={<IconeMaterial nome={tipo.nome} tamanho={24} />}
              ligado={dados.materiais.includes(tipo.nome)}
              aoAlternar={() => alternarMaterial(tipo.nome)}
            />
          ))}
        </View>
        {erros.materiais ? (
          <Text style={styles.erro} accessibilityRole="alert">
            {erros.materiais}
          </Text>
        ) : null}
      </Cartao>

      <EditorHorarios
        horarios={dados.horarios}
        aoMudar={alterar('horarios')}
        erro={erros.horarios}
      />

      {aviso ? (
        <Text style={styles.erro} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          {aviso}
        </Text>
      ) : null}

      <Botao
        titulo={salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar ponto'}
        aoPressionar={salvar}
        desabilitado={salvando}
      />
    </TelaBase>
  );
}

// Lista de horários com a opção de adicionar e remover (RN02).
function EditorHorarios({ horarios, aoMudar, erro }) {
  const [dia, setDia] = useState(1);
  const [abertura, setAbertura] = useState('08:00');
  const [fechamento, setFechamento] = useState('17:00');
  const [erroNovo, setErroNovo] = useState(null);

  function adicionar() {
    const novo = { diaDaSemana: dia, horaAbertura: abertura.trim(), horaFechamento: fechamento.trim() };
    if (!horarioValido(novo)) {
      setErroNovo('Use o formato HH:MM, com abertura diferente do fechamento');
      return;
    }
    const repetido = horarios.some(
      (h) => h.diaDaSemana === novo.diaDaSemana && h.horaAbertura === novo.horaAbertura
    );
    if (repetido) {
      setErroNovo('Este horário já foi adicionado');
      return;
    }
    setErroNovo(null);
    aoMudar([...horarios, novo]);
  }

  return (
    <Cartao estilo={styles.secao}>
      <Text style={tipografia.subtitulo} accessibilityRole="header">
        Horário de funcionamento
      </Text>

      {ordenarHorarios(horarios).map((horario) => (
        <View key={`${horario.diaDaSemana}-${horario.horaAbertura}`} style={styles.linhaHorario}>
          <Text style={[tipografia.corpo, styles.textoHorario]}>{descreverHorario(horario)}</Text>
          <Botao
            titulo="Remover"
            variante="secundario"
            rotuloAcessivel={`Remover ${descreverHorario(horario)}`}
            aoPressionar={() => aoMudar(horarios.filter((h) => h !== horario))}
          />
        </View>
      ))}

      <Text style={tipografia.corpo}>Dia da semana</Text>
      <View style={styles.opcoes}>
        {NOMES_DOS_DIAS.map((nome, indice) => (
          <Alternador
            key={nome}
            titulo={nome.replace('-feira', '')}
            rotuloAcessivel={nome}
            ligado={dia === indice}
            aoAlternar={() => setDia(indice)}
          />
        ))}
      </View>
      <View style={styles.linhaHoras}>
        <View style={styles.hora}>
          <CampoTexto rotulo="Abre às" valor={abertura} aoMudar={setAbertura} keyboardType="numbers-and-punctuation" />
        </View>
        <View style={styles.hora}>
          <CampoTexto
            rotulo="Fecha às"
            valor={fechamento}
            aoMudar={setFechamento}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>
      {erroNovo || erro ? (
        <Text style={styles.erro} accessibilityRole="alert">
          {erroNovo ?? erro}
        </Text>
      ) : null}
      <Botao titulo="Adicionar horário" variante="secundario" aoPressionar={adicionar} />
    </Cartao>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: espacamento.sm,
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
  erro: {
    ...tipografia.corpo,
    color: cores.erro,
  },
  linhaHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.sm,
  },
  textoHorario: {
    flex: 1,
  },
  linhaHoras: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  hora: {
    flex: 1,
  },
});
