// TipoDeMaterial (nome, descricao) e o filtro por material (RF08).
// No ponto, o campo materiais[] guarda os nomes dos tipos aceitos.

import { normalizarTexto } from './texto';

export const TIPOS_DE_MATERIAL = [
  { nome: 'papel', descricao: 'Papel, papelão, jornais e revistas' },
  { nome: 'plástico', descricao: 'Garrafas, embalagens e sacolas plásticas' },
  { nome: 'vidro', descricao: 'Garrafas, potes e frascos de vidro' },
  { nome: 'metal', descricao: 'Latas de alumínio e de aço e outros metais' },
  { nome: 'eletrônico', descricao: 'Aparelhos eletrônicos, pilhas e baterias' },
];

// Deixa o nome comparável: sem espaços nas pontas, em minúsculas e sem
// acentos ("Plástico " e "plastico" viram o mesmo material).
export function normalizarMaterial(nome) {
  return normalizarTexto(nome);
}

// Diz se o nome corresponde a um dos TIPOS_DE_MATERIAL.
export function materialConhecido(nome) {
  const procurado = normalizarMaterial(nome);
  return TIPOS_DE_MATERIAL.some((tipo) => normalizarMaterial(tipo.nome) === procurado);
}

// Diz se o ponto aceita TODOS os materiais pedidos. Sem materiais pedidos,
// qualquer ponto atende.
export function aceitaMateriais(ponto, tipos = []) {
  const aceitos = new Set(
    (Array.isArray(ponto?.materiais) ? ponto.materiais : []).map(normalizarMaterial)
  );
  return tipos.every((tipo) => aceitos.has(normalizarMaterial(tipo)));
}

// RF08: devolve os pontos que aceitam todos os materiais pedidos. Lista vazia
// de resultado indica que a tela deve avisar e oferecer limpar o filtro.
export function filtrarPorMateriais(pontos, tipos = []) {
  if (!Array.isArray(pontos)) {
    return [];
  }
  return pontos.filter((ponto) => aceitaMateriais(ponto, tipos));
}
