// Regras da entidade PontoDeColeta.
// Os pontos são objetos simples (como vêm do Firestore), por isso as regras
// ficam em funções que recebem o ponto, em vez de métodos de uma classe.

import { horarioCobre } from './horario';

export const SITUACAO_ATIVO = 'ativo';
export const SITUACAO_INATIVO = 'inativo';

// RN01: só pontos com situação "ativo" aparecem em listagens, buscas e rotas.
export function estaAtivo(ponto) {
  return ponto?.situacao === SITUACAO_ATIVO;
}

// Devolve só os pontos ativos, sem alterar a lista original (RN01).
export function somenteAtivos(pontos) {
  return Array.isArray(pontos) ? pontos.filter(estaAtivo) : [];
}

// PontoDeColeta.estaAberto(dataHoraAtual): o ponto está aberto se algum dos
// seus horários de funcionamento cobre o instante informado (RF05).
export function estaAberto(ponto, dataHoraAtual = new Date()) {
  const horarios = Array.isArray(ponto?.horarios) ? ponto.horarios : [];
  return horarios.some((horario) => horarioCobre(horario, dataHoraAtual));
}
