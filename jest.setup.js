// Configuração comum dos testes.
import { configure } from '@testing-library/react-native';

// Na primeira execução (cache frio, com cobertura) a renderização das telas
// pode passar de 1 segundo. Esperar até 5 segundos evita falhas por tempo.
configure({ asyncUtilTimeout: 5000 });
