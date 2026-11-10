// Validações do cadastro e da edição de ponto de coleta (RF06, RF09).
//
// Cada validação devolve { valido, erros }, em que erros é um objeto
// { campo: mensagem } pronto para a tela mostrar ao lado de cada campo.
// Regras cobertas: campos obrigatórios, RN02 (material e horário), RN03
// (coordenadas válidas) e RN05 (endereço sem outro ponto ativo).

import { localizacaoValida } from './distancia';
import { estadoValido } from './estados';
import { horarioValido } from './horario';
import { TIPOS_DE_MATERIAL, materialConhecido, normalizarMaterial } from './materiais';
import { SITUACAO_ATIVO, somenteAtivos } from './pontoDeColeta';
import { normalizarTexto, somenteDigitos } from './texto';

export const MENSAGENS = {
  obrigatorio: 'Campo obrigatório',
  uf: 'Escolha um Estado válido',
  telefone: 'Informe o telefone com DDD (10 ou 11 dígitos)',
  cep: 'O CEP deve ter 8 dígitos',
  semMaterial: 'Escolha pelo menos um tipo de material',
  materialDesconhecido: 'Há um tipo de material inválido',
  semHorario: 'Informe pelo menos um horário de funcionamento',
  horarioInvalido: 'Há um horário de funcionamento inválido',
  coordenadas: 'Não foi possível localizar este endereço no mapa',
  enderecoDuplicado: 'Já existe um ponto ativo cadastrado neste endereço',
};

function textoPreenchido(valor) {
  return normalizarTexto(valor) !== '';
}

function resultado(erros) {
  return { valido: Object.keys(erros).length === 0, erros };
}

// Campos obrigatórios e formato de UF, telefone e CEP.
export function validarCamposObrigatorios(dados) {
  const erros = {};
  const endereco = dados?.endereco ?? {};

  if (!textoPreenchido(dados?.nome)) {
    erros.nome = MENSAGENS.obrigatorio;
  }

  const telefone = somenteDigitos(dados?.telefone);
  if (telefone === '') {
    erros.telefone = MENSAGENS.obrigatorio;
  } else if (telefone.length < 10 || telefone.length > 11) {
    erros.telefone = MENSAGENS.telefone;
  }

  if (!textoPreenchido(dados?.uf)) {
    erros.uf = MENSAGENS.obrigatorio;
  } else if (!estadoValido(dados.uf)) {
    erros.uf = MENSAGENS.uf;
  }

  if (!textoPreenchido(dados?.cidade)) {
    erros.cidade = MENSAGENS.obrigatorio;
  }

  ['logradouro', 'numero', 'bairro'].forEach((campo) => {
    if (!textoPreenchido(endereco[campo])) {
      erros[`endereco.${campo}`] = MENSAGENS.obrigatorio;
    }
  });

  const cep = somenteDigitos(endereco.cep);
  if (cep === '') {
    erros['endereco.cep'] = MENSAGENS.obrigatorio;
  } else if (cep.length !== 8) {
    erros['endereco.cep'] = MENSAGENS.cep;
  }

  return resultado(erros);
}

// RN02: pelo menos um tipo de material e um horário, todos válidos.
// Mesmo nome usado no ControladorCadastro do documento de ES.
export function validarMateriaisEHorarios(dados) {
  const erros = {};
  const materiais = Array.isArray(dados?.materiais) ? dados.materiais : [];
  const horarios = Array.isArray(dados?.horarios) ? dados.horarios : [];

  if (materiais.length === 0) {
    erros.materiais = MENSAGENS.semMaterial;
  } else if (!materiais.every(materialConhecido)) {
    erros.materiais = MENSAGENS.materialDesconhecido;
  }

  if (horarios.length === 0) {
    erros.horarios = MENSAGENS.semHorario;
  } else if (!horarios.every(horarioValido)) {
    erros.horarios = MENSAGENS.horarioInvalido;
  }

  return resultado(erros);
}

// RN03: o endereço precisa ter virado coordenadas válidas (a geocodificação
// é feita antes, pelo serviço de mapas).
export function validarCoordenadas(dados) {
  const valido = localizacaoValida({ latitude: dados?.latitude, longitude: dados?.longitude });
  return resultado(valido ? {} : { endereco: MENSAGENS.coordenadas });
}

// Chave usada para comparar endereços: logradouro, número, cidade e UF,
// sem diferenciar maiúsculas, acentos e espaços extras.
export function chaveDoEndereco(ponto) {
  const endereco = ponto?.endereco ?? {};
  return [endereco.logradouro, endereco.numero, ponto?.cidade, ponto?.uf]
    .map(normalizarTexto)
    .join('|');
}

// RN05: não pode haver outro ponto ATIVO no mesmo endereço. Na edição, o
// próprio ponto (mesmo id) não conta como duplicado.
export function validarEnderecoUnico(dados, pontosExistentes = [], idPontoEditado = null) {
  const chave = chaveDoEndereco(dados);
  const duplicado = somenteAtivos(pontosExistentes).some(
    (ponto) =>
      (idPontoEditado === null || ponto.id !== idPontoEditado) &&
      chaveDoEndereco(ponto) === chave
  );
  return resultado(duplicado ? { endereco: MENSAGENS.enderecoDuplicado } : {});
}

// Junta todas as validações do cadastro e da edição. A RN03 e a RN05 só
// são conferidas quando os campos obrigatórios do endereço estão completos.
export function validarPonto(dados, pontosExistentes = [], idPontoEditado = null) {
  const campos = validarCamposObrigatorios(dados);
  const erros = { ...campos.erros, ...validarMateriaisEHorarios(dados).erros };

  const enderecoCompleto = !Object.keys(campos.erros).some(
    (campo) => campo.startsWith('endereco.') || campo === 'cidade' || campo === 'uf'
  );
  if (enderecoCompleto) {
    Object.assign(
      erros,
      validarCoordenadas(dados).erros,
      validarEnderecoUnico(dados, pontosExistentes, idPontoEditado).erros
    );
  }

  return resultado(erros);
}

// Troca o nome digitado ("Plastico") pelo nome oficial do tipo ("plástico").
function nomeOficialDoMaterial(nome) {
  const procurado = normalizarMaterial(nome);
  return TIPOS_DE_MATERIAL.find((tipo) => normalizarMaterial(tipo.nome) === procurado).nome;
}

// Prepara dados JÁ VALIDADOS para gravar: tira espaços extras, deixa
// telefone e CEP só com dígitos, usa os nomes oficiais dos materiais (sem
// repetir) e, se nada for dito, o ponto nasce "ativo" (RF06).
export function normalizarDadosDoPonto(dados) {
  const endereco = dados.endereco ?? {};
  const limpar = (valor) => (typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '');
  return {
    nome: limpar(dados.nome),
    telefone: somenteDigitos(dados.telefone),
    situacao: dados.situacao ?? SITUACAO_ATIVO,
    uf: dados.uf,
    cidade: limpar(dados.cidade),
    endereco: {
      logradouro: limpar(endereco.logradouro),
      numero: limpar(endereco.numero),
      bairro: limpar(endereco.bairro),
      cep: somenteDigitos(endereco.cep),
    },
    latitude: dados.latitude,
    longitude: dados.longitude,
    materiais: [...new Set(dados.materiais.map(nomeOficialDoMaterial))],
    horarios: dados.horarios.map(({ diaDaSemana, horaAbertura, horaFechamento }) => ({
      diaDaSemana,
      horaAbertura,
      horaFechamento,
    })),
  };
}
