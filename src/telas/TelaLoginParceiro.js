import Botao from '../componentes/Botao';
import TelaBase from '../componentes/TelaBase';

// Entrada do parceiro ambiental; só parceiros autenticados alteram pontos (RN04).
export default function TelaLoginParceiro({ navigation }) {
  return (
    <TelaBase descricao="Área para órgãos e parceiros ambientais. Aqui vai o login com e-mail e senha.">
      <Botao titulo="Entrar (exemplo)" aoPressionar={() => navigation.navigate('MeusPontos')} />
    </TelaBase>
  );
}
