import Botao from '../componentes/Botao';
import TelaBase from '../componentes/TelaBase';

// Lista dos pontos de coleta da cidade, com filtro por material (RF04 e RF08).
export default function TelaListaPontos({ navigation }) {
  return (
    <TelaBase descricao="Aqui vai a lista de pontos de coleta da cidade, com nome, endereço e materiais aceitos.">
      <Botao titulo="Ver detalhes de um ponto" aoPressionar={() => navigation.navigate('Detalhes')} />
    </TelaBase>
  );
}
