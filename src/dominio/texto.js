// Funções de apoio para comparar textos digitados pelo usuário.

// Deixa o texto comparável: sem espaços nas pontas, espaços internos
// repetidos viram um só, tudo em minúsculas e sem acentos.
// Exemplo: "  Rua  São  Bento " vira "rua sao bento".
export function normalizarTexto(texto) {
  if (typeof texto !== 'string') {
    return '';
  }
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Devolve só os dígitos do texto (para telefone e CEP).
export function somenteDigitos(texto) {
  return typeof texto === 'string' ? texto.replace(/\D/g, '') : '';
}
