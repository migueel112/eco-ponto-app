// Repositório de pontos de coleta no Cloud Firestore (coleção "pontos").
// Implementa as funções que os controladores esperam receber.
//
// Documento: pontos/{id} = { nome, telefone, situacao, parceiroId, uf,
// cidade, endereco{logradouro, numero, bairro, cep}, latitude, longitude,
// materiais[], horarios[] }. O id fica no nome do documento, não nos dados.

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

export const COLECAO_PONTOS = 'pontos';

// Converte um documento do Firestore em ponto com o campo id.
function paraPonto(documento) {
  return { id: documento.id, ...documento.data() };
}

// Tira o id dos dados antes de gravar (as regras só aceitam os campos do ponto).
function semId(dados) {
  const { id, ...resto } = dados;
  return resto;
}

export function criarRepositorioPontos(db) {
  const colecao = collection(db, COLECAO_PONTOS);

  return {
    // Pontos ativos, opcionalmente de um Estado e de uma cidade (RN01).
    async listarPontosAtivos({ uf, cidade } = {}) {
      const filtros = [where('situacao', '==', 'ativo')];
      if (uf) {
        filtros.push(where('uf', '==', uf));
      }
      if (cidade) {
        filtros.push(where('cidade', '==', cidade));
      }
      const resultado = await getDocs(query(colecao, ...filtros));
      return resultado.docs.map(paraPonto);
    },

    // Todos os pontos de um parceiro, ativos e inativos.
    async listarPontosDoParceiro(parceiroId) {
      const resultado = await getDocs(query(colecao, where('parceiroId', '==', parceiroId)));
      return resultado.docs.map(paraPonto);
    },

    // Um ponto pelo id, ou null se não existir. Ponto inativo de outro
    // parceiro é bloqueado pelas regras e também volta como null.
    async obterPonto(idPonto) {
      try {
        const documento = await getDoc(doc(db, COLECAO_PONTOS, idPonto));
        return documento.exists() ? paraPonto(documento) : null;
      } catch (erro) {
        if (erro?.code === 'permission-denied') {
          return null;
        }
        throw erro;
      }
    },

    async criarPonto(dados) {
      const referencia = await addDoc(colecao, semId(dados));
      return referencia.id;
    },

    async atualizarPonto(idPonto, dados) {
      await setDoc(doc(db, COLECAO_PONTOS, idPonto), semId(dados));
    },

    async excluirPonto(idPonto) {
      await deleteDoc(doc(db, COLECAO_PONTOS, idPonto));
    },
  };
}
