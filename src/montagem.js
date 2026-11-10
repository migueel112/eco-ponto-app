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

import { criarGeocodificador } from './servicos/geocodificador';

// TEMPORÁRIO: as rotas (OSRM) chegam na etapa 5. Até lá, quem chamar recebe
// um erro claro.
const servicoRotas = {
  calcularRota: async () => {
    throw new Error('O cálculo de rota ainda não está disponível nesta versão do app');
  },
};

export const geocodificador = criarGeocodificador();

export const repositorioPontos = criarRepositorioPontos(db);
export const autenticacao = criarAutenticacao(auth);

export const controladorBusca = criarControladorBusca({ repositorioPontos, geocodificador });
export const controladorPontoDeColeta = criarControladorPontoDeColeta({ repositorioPontos, servicoRotas });
export const controladorCadastro = criarControladorCadastro({
  autenticacao,
  geocodificador,
  repositorioPontos,
});
