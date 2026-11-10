import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Botao from '../componentes/Botao';
import EstadoCarregamento from '../componentes/EstadoCarregamento';
import useSessao from '../ganchos/useSessao';
import { autenticacao } from '../montagem';
import { cores } from '../tema';
import TelaCadastroPonto from '../telas/TelaCadastroPonto';
import TelaLoginParceiro from '../telas/TelaLoginParceiro';
import TelaMeusPontos from '../telas/TelaMeusPontos';

const Pilha = createNativeStackNavigator();

// Fluxo do parceiro ambiental. Sem login, só existe a tela de login; com
// login, "Meus pontos" e o cadastro (RN04). Ao entrar ou sair, o React
// Navigation troca as telas sozinho.
export default function PilhaParceiro() {
  const { sessao, verificando } = useSessao();

  if (verificando) {
    return <EstadoCarregamento carregando textoCarregando="Verificando o login..." />;
  }

  return (
    <Pilha.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: cores.primaria },
        headerTintColor: cores.textoSobrePrimaria,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {sessao ? (
        <>
          <Pilha.Screen
            name="MeusPontos"
            component={TelaMeusPontos}
            options={{
              title: 'Meus pontos',
              headerRight: () => (
                <Botao
                  titulo="Sair"
                  variante="secundario"
                  rotuloAcessivel="Sair da área do parceiro"
                  aoPressionar={() => autenticacao.sair()}
                />
              ),
            }}
          />
          <Pilha.Screen name="CadastroPonto" component={TelaCadastroPonto} options={{ title: 'Cadastrar ponto' }} />
        </>
      ) : (
        <Pilha.Screen name="LoginParceiro" component={TelaLoginParceiro} options={{ title: 'Área do parceiro' }} />
      )}
    </Pilha.Navigator>
  );
}
