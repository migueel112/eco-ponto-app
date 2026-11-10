// Textos prontos para as telas mostrarem os dados do ponto de coleta.

// "Avenida Paulista, 1578 - Bela Vista". Partes vazias são omitidas.
export function descreverEndereco(ponto) {
  const endereco = ponto?.endereco ?? {};
  const rua = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  return [rua, endereco.bairro].filter(Boolean).join(' - ');
}

// "papel, plástico e vidro".
export function descreverMateriais(materiais) {
  const lista = Array.isArray(materiais) ? materiais.filter(Boolean) : [];
  if (lista.length <= 1) {
    return lista.join('');
  }
  return `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}`;
}

// "2,6 km" ou "850 m" (abaixo de 1 km). Vazio sem distância.
export function descreverDistancia(distanciaKm) {
  if (!Number.isFinite(distanciaKm)) {
    return '';
  }
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`;
  }
  return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
}

// Deixa a primeira letra maiúscula: "plástico" -> "Plástico".
export function comInicialMaiuscula(texto) {
  return typeof texto === 'string' && texto.length > 0
    ? texto[0].toUpperCase() + texto.slice(1)
    : '';
}
