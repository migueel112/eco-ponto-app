// CT10 – cadastro inválido (RN02, RN03, RN05) e base do CT11 (cadastro válido).
import {
  MENSAGENS,
  validarCamposObrigatorios,
  validarMateriaisEHorarios,
  validarCoordenadas,
  chaveDoEndereco,
  validarEnderecoUnico,
  validarPonto,
  normalizarDadosDoPonto,
} from '../validacao';

// Dados fictícios de um ponto válido.
const dadosValidos = () => ({
  nome: 'Ecoponto Paulista',
  telefone: '(11) 3333-4444',
  uf: 'SP',
  cidade: 'São Paulo',
  endereco: {
    logradouro: 'Avenida Paulista',
    numero: '1578',
    bairro: 'Bela Vista',
    cep: '01310-200',
  },
  latitude: -23.5614,
  longitude: -46.6559,
  materiais: ['papel', 'vidro'],
  horarios: [{ diaDaSemana: 1, horaAbertura: '08:00', horaFechamento: '17:00' }],
});

const existente = (id, extra = {}) => ({
  ...dadosValidos(),
  id,
  situacao: 'ativo',
  ...extra,
});

describe('validarCamposObrigatorios', () => {
  test('dados completos passam', () => {
    expect(validarCamposObrigatorios(dadosValidos())).toEqual({ valido: true, erros: {} });
  });

  test('aponta cada campo vazio ou só com espaços', () => {
    const { valido, erros } = validarCamposObrigatorios({
      nome: '   ',
      endereco: { logradouro: '' },
    });
    expect(valido).toBe(false);
    expect(erros).toEqual({
      nome: MENSAGENS.obrigatorio,
      telefone: MENSAGENS.obrigatorio,
      uf: MENSAGENS.obrigatorio,
      cidade: MENSAGENS.obrigatorio,
      'endereco.logradouro': MENSAGENS.obrigatorio,
      'endereco.numero': MENSAGENS.obrigatorio,
      'endereco.bairro': MENSAGENS.obrigatorio,
      'endereco.cep': MENSAGENS.obrigatorio,
    });
  });

  test('sem dados nenhum, todos os campos ficam com erro', () => {
    expect(Object.keys(validarCamposObrigatorios(undefined).erros)).toHaveLength(8);
  });

  test('confere UF, telefone e CEP', () => {
    const dados = dadosValidos();
    dados.uf = 'XX';
    dados.telefone = '3333-4444';
    dados.endereco.cep = '0131';
    expect(validarCamposObrigatorios(dados).erros).toEqual({
      uf: MENSAGENS.uf,
      telefone: MENSAGENS.telefone,
      'endereco.cep': MENSAGENS.cep,
    });
  });

  test('telefone com 12 dígitos é recusado; celular com 11 é aceito', () => {
    expect(validarCamposObrigatorios({ ...dadosValidos(), telefone: '551133334444' }).erros)
      .toEqual({ telefone: MENSAGENS.telefone });
    expect(validarCamposObrigatorios({ ...dadosValidos(), telefone: '11 98888-7777' }).valido)
      .toBe(true);
  });
});

describe('validarMateriaisEHorarios (RN02)', () => {
  test('dados completos passam', () => {
    expect(validarMateriaisEHorarios(dadosValidos()).valido).toBe(true);
  });

  test('sem material e sem horário', () => {
    expect(validarMateriaisEHorarios({ materiais: [], horarios: [] }).erros).toEqual({
      materiais: MENSAGENS.semMaterial,
      horarios: MENSAGENS.semHorario,
    });
    expect(validarMateriaisEHorarios(null).valido).toBe(false);
  });

  test('material desconhecido e horário inválido', () => {
    const dados = {
      materiais: ['papel', 'madeira'],
      horarios: [{ diaDaSemana: 1, horaAbertura: '18:00', horaFechamento: '18:00' }],
    };
    expect(validarMateriaisEHorarios(dados).erros).toEqual({
      materiais: MENSAGENS.materialDesconhecido,
      horarios: MENSAGENS.horarioInvalido,
    });
  });
});

describe('validarCoordenadas (RN03)', () => {
  test('aceita coordenadas válidas', () => {
    expect(validarCoordenadas(dadosValidos()).valido).toBe(true);
  });

  test('recusa endereço que não virou coordenadas', () => {
    expect(validarCoordenadas({ ...dadosValidos(), latitude: undefined }).erros).toEqual({
      endereco: MENSAGENS.coordenadas,
    });
    expect(validarCoordenadas(null).valido).toBe(false);
  });
});

describe('validarEnderecoUnico (RN05)', () => {
  test('a chave ignora maiúsculas, acentos e espaços extras', () => {
    const outraEscrita = existente('x', {
      cidade: 'SAO  PAULO ',
      endereco: { logradouro: 'avenida paulista', numero: ' 1578' },
    });
    expect(chaveDoEndereco(outraEscrita)).toBe(chaveDoEndereco(dadosValidos()));
    expect(chaveDoEndereco(null)).toBe('|||');
  });

  test('recusa outro ponto ativo no mesmo endereço', () => {
    expect(validarEnderecoUnico(dadosValidos(), [existente('a')]).erros).toEqual({
      endereco: MENSAGENS.enderecoDuplicado,
    });
  });

  test('ponto inativo no mesmo endereço não bloqueia', () => {
    expect(validarEnderecoUnico(dadosValidos(), [existente('a', { situacao: 'inativo' })]).valido)
      .toBe(true);
  });

  test('outro número ou outra cidade não é duplicado', () => {
    const outroNumero = existente('a', { endereco: { logradouro: 'Avenida Paulista', numero: '900' } });
    const outraCidade = existente('b', { cidade: 'Campinas' });
    expect(validarEnderecoUnico(dadosValidos(), [outroNumero, outraCidade]).valido).toBe(true);
  });

  test('na edição o próprio ponto não conta como duplicado', () => {
    expect(validarEnderecoUnico(dadosValidos(), [existente('a')], 'a').valido).toBe(true);
    expect(validarEnderecoUnico(dadosValidos(), [existente('a'), existente('b')], 'a').valido)
      .toBe(false);
  });

  test('sem pontos existentes, passa', () => {
    expect(validarEnderecoUnico(dadosValidos()).valido).toBe(true);
  });
});

describe('validarPonto', () => {
  test('cadastro válido (CT11)', () => {
    expect(validarPonto(dadosValidos(), [])).toEqual({ valido: true, erros: {} });
  });

  test('junta os erros de todas as regras', () => {
    const dados = { ...dadosValidos(), nome: '', materiais: [], latitude: null };
    expect(validarPonto(dados, [existente('a')]).erros).toEqual({
      nome: MENSAGENS.obrigatorio,
      materiais: MENSAGENS.semMaterial,
      endereco: MENSAGENS.enderecoDuplicado,
    });
  });

  test('coordenadas inválidas sem duplicado mostram o erro de localização', () => {
    expect(validarPonto({ ...dadosValidos(), longitude: 300 }).erros).toEqual({
      endereco: MENSAGENS.coordenadas,
    });
  });

  test('endereço incompleto não confere coordenadas nem duplicidade', () => {
    const dados = dadosValidos();
    dados.endereco.numero = '';
    dados.latitude = null;
    expect(validarPonto(dados, [existente('a')]).erros).toEqual({
      'endereco.numero': MENSAGENS.obrigatorio,
    });
    expect(validarPonto({ ...dadosValidos(), uf: '' }).erros).toEqual({ uf: MENSAGENS.obrigatorio });
  });

  test('edição do próprio ponto passa', () => {
    expect(validarPonto(dadosValidos(), [existente('a')], 'a').valido).toBe(true);
  });
});

describe('normalizarDadosDoPonto', () => {
  test('limpa os textos, usa os nomes oficiais e nasce ativo', () => {
    const dados = {
      ...dadosValidos(),
      nome: '  Ecoponto   Paulista ',
      cidade: ' São Paulo',
      materiais: ['Papel', 'plastico', 'papel'],
      horarios: [{ diaDaSemana: 1, horaAbertura: '08:00', horaFechamento: '17:00', extra: 1 }],
    };
    expect(normalizarDadosDoPonto(dados)).toEqual({
      nome: 'Ecoponto Paulista',
      telefone: '1133334444',
      situacao: 'ativo',
      uf: 'SP',
      cidade: 'São Paulo',
      endereco: {
        logradouro: 'Avenida Paulista',
        numero: '1578',
        bairro: 'Bela Vista',
        cep: '01310200',
      },
      latitude: -23.5614,
      longitude: -46.6559,
      materiais: ['papel', 'plástico'],
      horarios: [{ diaDaSemana: 1, horaAbertura: '08:00', horaFechamento: '17:00' }],
    });
  });

  test('mantém a situação informada (edição)', () => {
    expect(normalizarDadosDoPonto({ ...dadosValidos(), situacao: 'inativo' }).situacao).toBe('inativo');
  });

  test('sem endereço, os campos do endereço ficam vazios', () => {
    const { endereco, ...semEndereco } = dadosValidos();
    expect(normalizarDadosDoPonto(semEndereco).endereco).toEqual({
      logradouro: '',
      numero: '',
      bairro: '',
      cep: '',
    });
  });
});
