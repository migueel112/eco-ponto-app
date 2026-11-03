import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Abas from './src/navegacao/Abas';

export default function App() {
  return (
    <NavigationContainer>
      <Abas />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}