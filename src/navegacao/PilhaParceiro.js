import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { cores } from '../tema';
import TelaCadastroPonto from '../telas/TelaCadastroPonto';
import TelaLoginParceiro from '../telas/TelaLoginParceiro';
import TelaMeusPontos from '../telas/TelaMeusPontos';

const Pilha = createNativeStackNavigator();

// Fluxo do parceiro ambiental: login, meus pontos e cadastro.
export default function PilhaParceiro() {
  return (
    <Pilha.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: cores.primaria },
        headerTintColor: cores.textoSobrePrimaria,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Pilha.Screen name="LoginParceiro" component={TelaLoginParceiro} options={{ title: 'Área do parceiro' }} />
      <Pilha.Screen name="MeusPontos" component={TelaMeusPontos} options={{ title: 'Meus pontos' }} />
      <Pilha.Screen name="CadastroPonto" component={TelaCadastroPonto} options={{ title: 'Cadastrar ponto' }} />
    </Pilha.Navigator>
  );
}
