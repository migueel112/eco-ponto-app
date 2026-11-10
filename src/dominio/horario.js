// Regras do HorarioFuncionamento (diaDaSemana, horaAbertura, horaFechamento).
//
// Formato adotado:
// - diaDaSemana: número de 0 (domingo) a 6 (sábado), igual ao Date.getDay();
// - horaAbertura e horaFechamento: texto "HH:MM" (24 horas). A hora de
//   fechamento também aceita "24:00", que significa meia-noite do fim do dia.
// - Se o fechamento for antes da abertura (por exemplo 22:00 às 02:00), o
//   horário passa da meia-noite e termina no dia seguinte.

const MINUTOS_POR_DIA = 24 * 60;
const FORMATO_HORA = /^(\d{2}):(\d{2})$/;

// Converte "HH:MM" em minutos desde a meia-noite. Devolve null se o texto
// não estiver no formato. "24:00" só é aceito quando permitirFimDoDia = true.
export function horaEmMinutos(hora, permitirFimDoDia = false) {
  const partes = typeof hora === 'string' ? FORMATO_HORA.exec(hora) : null;
  if (!partes) {
    return null;
  }
  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);
  if (permitirFimDoDia && horas === 24 && minutos === 0) {
    return MINUTOS_POR_DIA;
  }
  if (horas > 23 || minutos > 59) {
    return null;
  }
  return horas * 60 + minutos;
}

// Confere se um HorarioFuncionamento está completo e coerente (RN02).
export function horarioValido(horario) {
  if (!horario) {
    return false;
  }
  const { diaDaSemana, horaAbertura, horaFechamento } = horario;
  const abertura = horaEmMinutos(horaAbertura);
  const fechamento = horaEmMinutos(horaFechamento, true);
  return (
    Number.isInteger(diaDaSemana) &&
    diaDaSemana >= 0 &&
    diaDaSemana <= 6 &&
    abertura !== null &&
    fechamento !== null &&
    abertura !== fechamento
  );
}

// Diz se o horário cobre o instante informado (um Date, no horário local
// do aparelho). O intervalo inclui a abertura e exclui o fechamento.
export function horarioCobre(horario, dataHora) {
  if (!horarioValido(horario)) {
    return false;
  }
  const abertura = horaEmMinutos(horario.horaAbertura);
  const fechamento = horaEmMinutos(horario.horaFechamento, true);
  const dia = dataHora.getDay();
  const agora = dataHora.getHours() * 60 + dataHora.getMinutes();

  if (abertura < fechamento) {
    return dia === horario.diaDaSemana && agora >= abertura && agora < fechamento;
  }

  // Passa da meia-noite: vale do horário de abertura até o fim do dia e,
  // no dia seguinte, da meia-noite até o fechamento.
  const diaSeguinte = (horario.diaDaSemana + 1) % 7;
  return (
    (dia === horario.diaDaSemana && agora >= abertura) ||
    (dia === diaSeguinte && agora < fechamento)
  );
}
