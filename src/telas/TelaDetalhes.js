import Botao from '../componentes/Botao';
import TelaBase from '../componentes/TelaBase';

// Detalhes de um ponto de coleta: endereço, horário, materiais e distância (RF05).
export default function TelaDetalhes({ navigation }) {
  return (
    <TelaBase descricao="Aqui vão o endereço completo, o horário, os materiais aceitos, o telefone e a distância até você.">
      <Botao titulo="Ver rota no mapa" aoPressionar={() => navigation.navigate('Rota')} />
    </TelaBase>
  );
}
