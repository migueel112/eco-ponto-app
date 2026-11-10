// Regras do HorarioFuncionamento (RN02) e PontoDeColeta.estaAberto (RF05, CT08).
import { horaEmMinutos, horarioValido, horarioCobre } from '../horario';
import { estaAberto } from '../pontoDeColeta';

// Datas no horário local. 10/11/2026 é uma terça-feira (dia 2).
const terca = (hora, minuto = 0) => new Date(2026, 10, 10, hora, minuto);
const quarta = (hora, minuto = 0) => new Date(2026, 10, 11, hora, minuto);
const sabado = (hora, minuto = 0) => new Date(2026, 10, 14, hora, minuto);
const domingo = (hora, minuto = 0) => new Date(2026, 10, 15, hora, minuto);

const TERCA_COMERCIAL = { diaDaSemana: 2, horaAbertura: '08:00', horaFechamento: '17:00' };

test('as datas de apoio caem nos dias esperados', () => {
  expect(terca(0).getDay()).toBe(2);
  expect(quarta(0).getDay()).toBe(3);
  expect(sabado(0).getDay()).toBe(6);
  expect(domingo(0).getDay()).toBe(0);
});

describe('horaEmMinutos', () => {
  test('converte "HH:MM" em minutos', () => {
    expect(horaEmMinutos('00:00')).toBe(0);
    expect(horaEmMinutos('08:30')).toBe(510);
    expect(horaEmMinutos('23:59')).toBe(1439);
  });

  test('aceita "24:00" só como fim do dia', () => {
    expect(horaEmMinutos('24:00')).toBeNull();
    expect(horaEmMinutos('24:00', true)).toBe(1440);
    expect(horaEmMinutos('24:30', true)).toBeNull();
  });

  test('recusa textos fora do formato', () => {
    expect(horaEmMinutos('8:00')).toBeNull();
    expect(horaEmMinutos('25:00')).toBeNull();
    expect(horaEmMinutos('12:60')).toBeNull();
    expect(horaEmMinutos(800)).toBeNull();
    expect(horaEmMinutos(undefined)).toBeNull();
  });
});

describe('horarioValido', () => {
  test('aceita um horário completo', () => {
    expect(horarioValido(TERCA_COMERCIAL)).toBe(true);
    expect(horarioValido({ diaDaSemana: 0, horaAbertura: '22:00', horaFechamento: '02:00' })).toBe(true);
    expect(horarioValido({ diaDaSemana: 6, horaAbertura: '00:00', horaFechamento: '24:00' })).toBe(true);
  });

  test('recusa dia, horas ausentes ou abertura igual ao fechamento', () => {
    expect(horarioValido(null)).toBe(false);
    expect(horarioValido({ ...TERCA_COMERCIAL, diaDaSemana: 7 })).toBe(false);
    expect(horarioValido({ ...TERCA_COMERCIAL, diaDaSemana: -1 })).toBe(false);
    expect(horarioValido({ ...TERCA_COMERCIAL, diaDaSemana: 1.5 })).toBe(false);
    expect(horarioValido({ ...TERCA_COMERCIAL, horaAbertura: '' })).toBe(false);
    expect(horarioValido({ ...TERCA_COMERCIAL, horaFechamento: '17h' })).toBe(false);
    expect(horarioValido({ ...TERCA_COMERCIAL, horaFechamento: '08:00' })).toBe(false);
  });
});

describe('horarioCobre', () => {
  test('inclui a abertura e exclui o fechamento', () => {
    expect(horarioCobre(TERCA_COMERCIAL, terca(7, 59))).toBe(false);
    expect(horarioCobre(TERCA_COMERCIAL, terca(8, 0))).toBe(true);
    expect(horarioCobre(TERCA_COMERCIAL, terca(16, 59))).toBe(true);
    expect(horarioCobre(TERCA_COMERCIAL, terca(17, 0))).toBe(false);
  });

  test('não cobre outro dia da semana', () => {
    expect(horarioCobre(TERCA_COMERCIAL, quarta(10))).toBe(false);
  });

  test('horário que passa da meia-noite continua no dia seguinte', () => {
    const noturno = { diaDaSemana: 2, horaAbertura: '22:00', horaFechamento: '02:00' };
    expect(horarioCobre(noturno, terca(21, 59))).toBe(false);
    expect(horarioCobre(noturno, terca(23, 0))).toBe(true);
    expect(horarioCobre(noturno, quarta(1, 59))).toBe(true);
    expect(horarioCobre(noturno, quarta(2, 0))).toBe(false);
    expect(horarioCobre(noturno, terca(1, 0))).toBe(false);
  });

  test('o dia seguinte ao sábado é o domingo', () => {
    const sabadoNoite = { diaDaSemana: 6, horaAbertura: '20:00', horaFechamento: '01:00' };
    expect(horarioCobre(sabadoNoite, domingo(0, 30))).toBe(true);
  });

  test('fechamento às 24:00 cobre até 23:59', () => {
    const diaInteiro = { diaDaSemana: 2, horaAbertura: '00:00', horaFechamento: '24:00' };
    expect(horarioCobre(diaInteiro, terca(0, 0))).toBe(true);
    expect(horarioCobre(diaInteiro, terca(23, 59))).toBe(true);
    expect(horarioCobre(diaInteiro, quarta(0, 0))).toBe(false);
  });

  test('horário inválido nunca cobre', () => {
    expect(horarioCobre({ diaDaSemana: 2, horaAbertura: 'x', horaFechamento: '17:00' }, terca(10))).toBe(false);
  });
});

describe('estaAberto', () => {
  const ponto = {
    nome: 'Ecoponto Centro',
    horarios: [
      TERCA_COMERCIAL,
      { diaDaSemana: 6, horaAbertura: '09:00', horaFechamento: '13:00' },
    ],
  };

  test('aberto quando algum horário cobre o momento', () => {
    expect(estaAberto(ponto, terca(10))).toBe(true);
    expect(estaAberto(ponto, sabado(12, 59))).toBe(true);
  });

  test('fechado fora de todos os horários', () => {
    expect(estaAberto(ponto, terca(18))).toBe(false);
    expect(estaAberto(ponto, domingo(10))).toBe(false);
  });

  test('fechado quando o ponto não tem horários', () => {
    expect(estaAberto({ nome: 'Sem horário' }, terca(10))).toBe(false);
    expect(estaAberto(null, terca(10))).toBe(false);
  });

  test('usa a data e hora atuais quando nenhuma é informada', () => {
    jest.useFakeTimers().setSystemTime(terca(10));
    expect(estaAberto(ponto)).toBe(true);
    jest.useRealTimers();
  });
});
