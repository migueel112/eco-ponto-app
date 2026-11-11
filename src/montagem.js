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
import { criarServicoRotas } from './servicos/rotas';

export const geocodificador = criarGeocodificador();
const servicoRotas = criarServicoRotas();

export const repositorioPontos = criarRepositorioPontos(db);
export const autenticacao = criarAutenticacao(auth);

export const controladorBusca = criarControladorBusca({ repositorioPontos, geocodificador });
export const controladorPontoDeColeta = criarControladorPontoDeColeta({ repositorioPontos, servicoRotas });
export const controladorCadastro = criarControladorCadastro({
  autenticacao,
  geocodificador,
  repositorioPontos,
});
