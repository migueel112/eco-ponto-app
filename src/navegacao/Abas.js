import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { cores } from '../tema';
import PilhaBusca from './PilhaBusca';
import PilhaParceiro from './PilhaParceiro';

const Aba = createBottomTabNavigator();

// Navegação principal: aba do usuário (Buscar) e aba do parceiro.
export default function Abas() {
  return (
    <Aba.Navigator
      screenOptions={{
        headerShown: false, // o cabeçalho é de cada pilha
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontSize: 14 },
      }}
    >
      <Aba.Screen name="Buscar" component={PilhaBusca} />
      <Aba.Screen name="Parceiro" component={PilhaParceiro} />
    </Aba.Navigator>
  );
}
