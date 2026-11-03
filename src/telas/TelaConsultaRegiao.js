import Botao from '../componentes/Botao';
import TelaBase from '../componentes/TelaBase';

// Seleção de Estado e cidade para listar os pontos cadastrados (RF01).
export default function TelaConsultaRegiao({ navigation }) {
  return (
    <TelaBase descricao="Aqui você vai escolher o Estado e a cidade. Só aparecem cidades com pontos de coleta ativos.">
      <Botao titulo="Ver pontos da cidade" aoPressionar={() => navigation.navigate('ListaPontos')} />
    </TelaBase>
  );
}
