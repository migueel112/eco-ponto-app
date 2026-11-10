// Montagem do app: cria os controladores ligados aos serviços reais
// (Firebase). As telas importam os controladores daqui.
//
// Nos testes, os controladores são criados com serviços fictícios, por isso
// esta montagem fica separada deles.

import { auth, db } from './servicos/firebase';
import { criarRepositorioPontos } from './servicos/repositorioPontos';
import { criarAutenticacao } from './servicos/autenticacao';
import { criarControladorBusca } from './controladores/ControladorBusca';
import { criarControladorPontoDeColeta } from './controladores/ControladorPontoDeColeta';
import { criarControladorCadastro } from './controladores/ControladorCadastro';

// TEMPORÁRIO: a busca de endereços (Nominatim) e as rotas (OSRM) chegam nas
// etapas 4 e 5. Até lá, quem chamar recebe um erro claro.
const servicoAindaIndisponivel = (nome) => async () => {
  throw new Error(`${nome} ainda não está disponível nesta versão do app`);
};
const geocodificador = { geocodificar: servicoAindaIndisponivel('A busca por endereço') };
const servicoRotas = { calcularRota: servicoAindaIndisponivel('O cálculo de rota') };

export const repositorioPontos = criarRepositorioPontos(db);
export const autenticacao = criarAutenticacao(auth);

export const controladorBusca = criarControladorBusca({ repositorioPontos, geocodificador });
export const controladorPontoDeColeta = criarControladorPontoDeColeta({ repositorioPontos, servicoRotas });
export const controladorCadastro = criarControladorCadastro({
  autenticacao,
  geocodificador,
  repositorioPontos,
});
