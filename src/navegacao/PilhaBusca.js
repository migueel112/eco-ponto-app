import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { cores } from '../tema';
import TelaConsultaRegiao from '../telas/TelaConsultaRegiao';
import TelaDetalhes from '../telas/TelaDetalhes';
import TelaInicial from '../telas/TelaInicial';
import TelaListaPontos from '../telas/TelaListaPontos';
import TelaRota from '../telas/TelaRota';

const Pilha = createNativeStackNavigator();

// Fluxo do usuário: início, região, lista, detalhes e rota.
export default function PilhaBusca() {
  return (
    <Pilha.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: cores.primaria },
        headerTintColor: cores.textoSobrePrimaria,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Pilha.Screen name="Inicial" component={TelaInicial} options={{ title: 'Eco Ponto' }} />
      <Pilha.Screen name="ConsultaRegiao" component={TelaConsultaRegiao} options={{ title: 'Estado e cidade' }} />
      <Pilha.Screen name="ListaPontos" component={TelaListaPontos} options={{ title: 'Pontos de coleta' }} />
      <Pilha.Screen name="Detalhes" component={TelaDetalhes} options={{ title: 'Detalhes do ponto' }} />
      <Pilha.Screen name="Rota" component={TelaRota} options={{ title: 'Rota' }} />
    </Pilha.Navigator>
  );
}
