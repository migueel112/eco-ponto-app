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

// Nomes dos dias na mesma numeração do HorarioFuncionamento (0 = domingo).
export const NOMES_DOS_DIAS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

// Posição do dia na semana brasileira, que começa na segunda-feira.
function ordemNaSemana(diaDaSemana) {
  return (diaDaSemana + 6) % 7;
}

// "Segunda-feira: 08:00 às 17:00".
export function descreverHorario(horario) {
  return `${NOMES_DOS_DIAS[horario.diaDaSemana]}: ${horario.horaAbertura} às ${horario.horaFechamento}`;
}

// Horários em ordem de segunda a domingo e, no mesmo dia, pela abertura.
export function ordenarHorarios(horarios) {
  return [...(Array.isArray(horarios) ? horarios : [])].sort(
    (a, b) =>
      ordemNaSemana(a.diaDaSemana) - ordemNaSemana(b.diaDaSemana) ||
      a.horaAbertura.localeCompare(b.horaAbertura)
  );
}

// "(11) 3333-4444" ou "(11) 98888-7777". Outros formatos ficam como vieram.
export function descreverTelefone(telefone) {
  const digitos = typeof telefone === 'string' ? telefone.replace(/\D/g, '') : '';
  const partes = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digitos);
  return partes ? `(${partes[1]}) ${partes[2]}-${partes[3]}` : telefone ?? '';
}

// "01310-200". Outros formatos ficam como vieram.
export function descreverCep(cep) {
  const digitos = typeof cep === 'string' ? cep.replace(/\D/g, '') : '';
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : cep ?? '';
}

// Deixa a primeira letra maiúscula: "plástico" -> "Plástico".
export function comInicialMaiuscula(texto) {
  return typeof texto === 'string' && texto.length > 0
    ? texto[0].toUpperCase() + texto.slice(1)
    : '';
}
