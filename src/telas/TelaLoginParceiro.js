import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Botao from '../componentes/Botao';
import CampoTexto from '../componentes/CampoTexto';
import TelaBase from '../componentes/TelaBase';
import { autenticacao } from '../montagem';
import { cores, tipografia } from '../tema';

// Login do parceiro ambiental com e-mail e senha (RN04). Depois do login, a
// pilha do parceiro troca sozinha para "Meus pontos" (ver PilhaParceiro).
// A senha não é guardada pelo app: vai direto para o Firebase.
export default function TelaLoginParceiro() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState(null);

  async function entrar() {
    setEntrando(true);
    setErro(null);
    const resposta = await autenticacao.entrar(email, senha);
    if (!resposta.sucesso) {
      setErro(resposta.mensagem);
      setEntrando(false);
    }
    // Com sucesso, esta tela sai de cena; não é preciso mudar o estado.
  }

  return (
    <TelaBase descricao="Área para órgãos e parceiros ambientais cadastrarem e manterem os seus pontos de coleta.">
      <CampoTexto
        rotulo="E-mail"
        valor={email}
        aoMudar={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="username"
      />
      <CampoTexto
        rotulo="Senha"
        valor={senha}
        aoMudar={setSenha}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={entrar}
      />

      {erro ? (
        <Text style={styles.erro} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          {erro}
        </Text>
      ) : null}

      <Botao titulo={entrando ? 'Entrando...' : 'Entrar'} aoPressionar={entrar} desabilitado={entrando} />
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  erro: {
    ...tipografia.corpo,
    color: cores.erro,
  },
});
