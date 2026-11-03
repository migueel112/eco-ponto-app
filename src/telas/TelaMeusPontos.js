import Botao from '../componentes/Botao';
import TelaBase from '../componentes/TelaBase';

// Pontos cadastrados pelo parceiro, com opções de editar e excluir (RF09 e RF10).
export default function TelaMeusPontos({ navigation }) {
  return (
    <TelaBase descricao="Aqui vai a lista dos pontos cadastrados por você, com as opções de editar e excluir.">
      <Botao titulo="Cadastrar novo ponto" aoPressionar={() => navigation.navigate('CadastroPonto')} />
    </TelaBase>
  );
}
