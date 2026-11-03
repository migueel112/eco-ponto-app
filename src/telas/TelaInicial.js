import Botao from '../componentes/Botao';
import TelaBase from '../componentes/TelaBase';

// Ponto de partida da busca: por Estado e cidade, GPS ou endereço (RF01 a RF03).
export default function TelaInicial({ navigation }) {
  return (
    <TelaBase descricao="Encontre o ponto de coleta de reciclagem mais próximo de você.">
      <Botao titulo="Escolher Estado e cidade" aoPressionar={() => navigation.navigate('ConsultaRegiao')} />
      <Botao titulo="Usar minha localização (em breve)" variante="secundario" desabilitado />
      <Botao titulo="Pesquisar um endereço (em breve)" variante="secundario" desabilitado />
    </TelaBase>
  );
}
