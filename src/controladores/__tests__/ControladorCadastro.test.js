// ControladorCadastro com serviços fictícios em memória (sem Firebase).
// Casos: CT09 (sem login), CT10 (inválido), CT11 (válido), CT14 (editar), CT15 (excluir).
import {
  criarControladorCadastro,
  textoDoEndereco,
  MENSAGENS_CADASTRO,
  MENSAGENS_VALIDACAO,
} from '../ControladorCadastro';

const PARCEIRO_A = { uid: 'parceiro-a' };
const PARCEIRO_B = { uid: 'parceiro-b' };
const COORDENADAS_PAULISTA = { descricao: 'Avenida Paulista, 1578', latitude: -23.5614, longitude: -46.6559 };

// Dados de formulário fictícios, ainda sem coordenadas.
const formulario = (extra = {}) => ({
  nome: 'Ecoponto Paulista',
  telefone: '(11) 3333-4444',
  uf: 'SP',
  cidade: 'São Paulo',
  endereco: { logradouro: 'Avenida Paulista', numero: '1578', bairro: 'Bela Vista', cep: '01310-200' },
  materiais: ['Papel', 'vidro'],
  horarios: [{ diaDaSemana: 1, horaAbertura: '08:00', horaFechamento: '17:00' }],
  ...extra,
});

// Repositório em memória que imita o Firestore.
function criarRepositorio(iniciais = []) {
  const pontos = new Map(iniciais.map((p) => [p.id, p]));
  let proximoId = 1;
  return {
    pontos,
    listarPontosAtivos: jest.fn(async ({ uf } = {}) =>
      [...pontos.values()].filter((p) => p.situacao === 'ativo' && (uf === undefined || p.uf === uf))
    ),
    listarPontosDoParceiro: jest.fn(async (parceiroId) =>
      [...pontos.values()].filter((p) => p.parceiroId === parceiroId)
    ),
    obterPonto: jest.fn(async (id) => pontos.get(id) ?? null),
    criarPonto: jest.fn(async (dados) => {
      const id = `novo-${proximoId++}`;
      pontos.set(id, { ...dados, id });
      return id;
    }),
    atualizarPonto: jest.fn(async (id, dados) => {
      pontos.set(id, { ...dados, id });
    }),
    excluirPonto: jest.fn(async (id) => {
      pontos.delete(id);
    }),
  };
}

function criarControlador({ sessao = PARCEIRO_A, iniciais = [], candidatos = [COORDENADAS_PAULISTA] } = {}) {
  const autenticacao = { usuarioAtual: jest.fn(() => sessao) };
  const geocodificador = { geocodificar: jest.fn(async () => candidatos) };
  const repositorioPontos = criarRepositorio(iniciais);
  return {
    controlador: criarControladorCadastro({ autenticacao, geocodificador, repositorioPontos }),
    autenticacao,
    geocodificador,
    repositorioPontos,
  };
}

// Ponto já gravado de um parceiro.
const pontoGravado = (id, parceiroId, extra = {}) => ({
  ...formulario(),
  id,
  parceiroId,
  situacao: 'ativo',
  latitude: -23.5614,
  longitude: -46.6559,
  materiais: ['papel'],
  ...extra,
});

describe('textoDoEndereco', () => {
  test('monta o endereço completo para geocodificar', () => {
    expect(textoDoEndereco(formulario())).toBe(
      'Avenida Paulista, 1578, Bela Vista, São Paulo, SP, 01310-200'
    );
  });

  test('ignora partes vazias', () => {
    expect(textoDoEndereco({ cidade: ' Santos ', endereco: { logradouro: 'Rua A', bairro: '' } })).toBe(
      'Rua A, Santos'
    );
    expect(textoDoEndereco(null)).toBe('');
  });
});

describe('verificarAutenticacao (RN04)', () => {
  test('verdadeiro só com sessão de parceiro', () => {
    const { controlador } = criarControlador();
    expect(controlador.verificarAutenticacao()).toBe(true);
    expect(controlador.verificarAutenticacao(null)).toBe(false);
    expect(controlador.verificarAutenticacao({})).toBe(false);
  });
});

describe('validarMateriaisEHorarios', () => {
  test('usa a regra RN02 do domínio', () => {
    const { controlador } = criarControlador();
    expect(controlador.validarMateriaisEHorarios(formulario()).valido).toBe(true);
    expect(controlador.validarMateriaisEHorarios({ materiais: [], horarios: [] }).erros).toEqual({
      materiais: MENSAGENS_VALIDACAO.semMaterial,
      horarios: MENSAGENS_VALIDACAO.semHorario,
    });
  });
});

describe('cadastrarPonto', () => {
  test('sem login não grava nada (CT09)', async () => {
    const { controlador, repositorioPontos } = criarControlador({ sessao: null });
    expect(await controlador.cadastrarPonto(formulario())).toEqual({
      sucesso: false,
      mensagem: MENSAGENS_CADASTRO.semLogin,
      erros: {},
    });
    expect(repositorioPontos.criarPonto).not.toHaveBeenCalled();
  });

  test('cadastro válido: geocodifica, nasce ativo e fica com o parceiro (CT11)', async () => {
    const { controlador, repositorioPontos, geocodificador } = criarControlador();
    const resposta = await controlador.cadastrarPonto(formulario({ situacao: 'inativo', parceiroId: 'outro' }));

    expect(resposta).toEqual({ sucesso: true, mensagem: MENSAGENS_CADASTRO.cadastrado, erros: {}, id: 'novo-1' });
    expect(geocodificador.geocodificar).toHaveBeenCalledWith(
      'Avenida Paulista, 1578, Bela Vista, São Paulo, SP, 01310-200'
    );
    const gravado = repositorioPontos.pontos.get('novo-1');
    expect(gravado).toMatchObject({
      situacao: 'ativo',
      parceiroId: 'parceiro-a',
      latitude: -23.5614,
      longitude: -46.6559,
      telefone: '1133334444',
      materiais: ['papel', 'vidro'],
    });
  });

  test('o ponto cadastrado aparece nas buscas na hora', async () => {
    const { controlador, repositorioPontos } = criarControlador();
    await controlador.cadastrarPonto(formulario());
    expect(await repositorioPontos.listarPontosAtivos({ uf: 'SP' })).toHaveLength(1);
  });

  test('com coordenadas já escolhidas na tela, não geocodifica', async () => {
    const { controlador, geocodificador } = criarControlador();
    const resposta = await controlador.cadastrarPonto(formulario({ latitude: -23.56, longitude: -46.65 }));
    expect(resposta.sucesso).toBe(true);
    expect(geocodificador.geocodificar).not.toHaveBeenCalled();
  });

  test('endereço que não vira coordenadas é recusado (RN03, CT10)', async () => {
    const { controlador, repositorioPontos } = criarControlador({ candidatos: [] });
    const resposta = await controlador.cadastrarPonto(formulario());
    expect(resposta.sucesso).toBe(false);
    expect(resposta.mensagem).toBe(MENSAGENS_CADASTRO.camposInvalidos);
    expect(resposta.erros).toEqual({ endereco: MENSAGENS_VALIDACAO.coordenadas });
    expect(repositorioPontos.criarPonto).not.toHaveBeenCalled();
  });

  test('sem material e sem horário é recusado (RN02, CT10)', async () => {
    const { controlador } = criarControlador();
    const resposta = await controlador.cadastrarPonto(formulario({ materiais: [], horarios: [] }));
    expect(resposta.erros).toEqual({
      materiais: MENSAGENS_VALIDACAO.semMaterial,
      horarios: MENSAGENS_VALIDACAO.semHorario,
    });
  });

  test('outro ponto ativo no mesmo endereço é recusado (RN05, CT10)', async () => {
    const { controlador } = criarControlador({ iniciais: [pontoGravado('x', 'parceiro-b')] });
    const resposta = await controlador.cadastrarPonto(formulario());
    expect(resposta.erros).toEqual({ endereco: MENSAGENS_VALIDACAO.enderecoDuplicado });
  });

  test('formulário vazio: aponta os campos e não chama o geocodificador', async () => {
    const { controlador, geocodificador } = criarControlador();
    const resposta = await controlador.cadastrarPonto({});
    expect(resposta.sucesso).toBe(false);
    expect(resposta.erros.nome).toBe(MENSAGENS_VALIDACAO.obrigatorio);
    expect(geocodificador.geocodificar).not.toHaveBeenCalled();
  });
});

describe('listarMeusPontos', () => {
  test('só os pontos do parceiro logado, ativos e inativos, por nome', async () => {
    const { controlador } = criarControlador({
      iniciais: [
        pontoGravado('1', 'parceiro-a', { nome: 'Zeta' }),
        pontoGravado('2', 'parceiro-b', { nome: 'Alfa' }),
        pontoGravado('3', 'parceiro-a', { nome: 'Beta', situacao: 'inativo' }),
      ],
    });
    const { sucesso, pontos } = await controlador.listarMeusPontos();
    expect(sucesso).toBe(true);
    expect(pontos.map((p) => p.id)).toEqual(['3', '1']);
  });

  test('sem login avisa', async () => {
    const { controlador } = criarControlador({ sessao: null });
    expect(await controlador.listarMeusPontos()).toEqual({
      sucesso: false,
      mensagem: MENSAGENS_CADASTRO.semLogin,
      pontos: [],
    });
  });
});

describe('editarPonto (CT14)', () => {
  test('o dono edita com as mesmas validações; situação e dono não mudam', async () => {
    const { controlador, repositorioPontos } = criarControlador({
      iniciais: [pontoGravado('1', 'parceiro-a', { situacao: 'inativo' })],
    });
    const resposta = await controlador.editarPonto(
      '1',
      formulario({ nome: 'Ecoponto Novo Nome', situacao: 'ativo', parceiroId: 'parceiro-b' })
    );
    expect(resposta).toEqual({ sucesso: true, mensagem: MENSAGENS_CADASTRO.atualizado, erros: {}, id: '1' });
    expect(repositorioPontos.pontos.get('1')).toMatchObject({
      nome: 'Ecoponto Novo Nome',
      situacao: 'inativo',
      parceiroId: 'parceiro-a',
    });
  });

  test('manter o mesmo endereço não conta como duplicado', async () => {
    const { controlador } = criarControlador({ iniciais: [pontoGravado('1', 'parceiro-a')] });
    expect((await controlador.editarPonto('1', formulario())).sucesso).toBe(true);
  });

  test('não edita ponto de outro parceiro', async () => {
    const { controlador, repositorioPontos } = criarControlador({
      sessao: PARCEIRO_B,
      iniciais: [pontoGravado('1', 'parceiro-a')],
    });
    expect(await controlador.editarPonto('1', formulario())).toEqual({
      sucesso: false,
      mensagem: MENSAGENS_CADASTRO.naoEDono,
      erros: {},
    });
    expect(repositorioPontos.atualizarPonto).not.toHaveBeenCalled();
  });

  test('dados inválidos não são gravados', async () => {
    const { controlador, repositorioPontos } = criarControlador({ iniciais: [pontoGravado('1', 'parceiro-a')] });
    const resposta = await controlador.editarPonto('1', formulario({ nome: '' }));
    expect(resposta.erros).toEqual({ nome: MENSAGENS_VALIDACAO.obrigatorio });
    expect(repositorioPontos.atualizarPonto).not.toHaveBeenCalled();
  });

  test('ponto inexistente e sem login', async () => {
    const { controlador } = criarControlador();
    expect((await controlador.editarPonto('nao-existe', formulario())).mensagem).toBe(
      MENSAGENS_CADASTRO.naoEncontrado
    );
    const { controlador: semLogin } = criarControlador({ sessao: null });
    expect((await semLogin.editarPonto('1', formulario())).mensagem).toBe(MENSAGENS_CADASTRO.semLogin);
  });
});

describe('excluirPonto (CT15)', () => {
  test('o dono exclui o ponto', async () => {
    const { controlador, repositorioPontos } = criarControlador({ iniciais: [pontoGravado('1', 'parceiro-a')] });
    expect(await controlador.excluirPonto('1')).toEqual({
      sucesso: true,
      mensagem: MENSAGENS_CADASTRO.excluido,
      erros: {},
    });
    expect(repositorioPontos.pontos.has('1')).toBe(false);
  });

  test('não exclui ponto de outro parceiro', async () => {
    const { controlador, repositorioPontos } = criarControlador({
      sessao: PARCEIRO_B,
      iniciais: [pontoGravado('1', 'parceiro-a')],
    });
    expect((await controlador.excluirPonto('1')).mensagem).toBe(MENSAGENS_CADASTRO.naoEDono);
    expect(repositorioPontos.excluirPonto).not.toHaveBeenCalled();
  });

  test('sem login e ponto inexistente', async () => {
    const { controlador: semLogin, repositorioPontos } = criarControlador({ sessao: null });
    expect((await semLogin.excluirPonto('1')).mensagem).toBe(MENSAGENS_CADASTRO.semLogin);
    expect(repositorioPontos.excluirPonto).not.toHaveBeenCalled();
    const { controlador } = criarControlador();
    expect((await controlador.excluirPonto('nao-existe')).mensagem).toBe(MENSAGENS_CADASTRO.naoEncontrado);
  });
});
