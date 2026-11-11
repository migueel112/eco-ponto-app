import { useCallback, useState } from 'react';
import { ERRO_SEM_CONEXAO } from '../dominio/erros';
import { controladorBusca } from '../montagem';
import {
  obterPosicaoAtual,
  ERRO_GPS_DESLIGADO,
  ERRO_PERMISSAO_NEGADA,
  ERRO_TEMPO_ESGOTADO,
} from '../servicos/localizacao';
import { vibrarErro, vibrarSucesso } from '../servicos/vibracao';

export const MENSAGENS_PROXIMO = {
  obtendoLocalizacao: 'Obtendo a sua localização...',
  pesquisandoEndereco: 'Pesquisando o endereço...',
  permissaoNegada:
    'Sem permissão de localização. Você ainda pode buscar por Estado e cidade ou pesquisar um endereço.',
  permissaoNosAjustes: 'Para usar o GPS, permita a localização do Eco Ponto nos Ajustes do celular.',
  gpsDesligado: 'A localização do celular está desligada. Ligue e tente de novo.',
  tempoEsgotado: 'O GPS demorou para responder. Tente de novo em um lugar aberto.',
  semConexao: 'Sem conexão com a internet. Tente de novo quando estiver conectado.',
  erroGenerico: 'Não foi possível fazer a busca. Tente novamente.',
};

const INICIAL = { fase: 'ocioso' };

// Também usada pela TelaRota para os erros do GPS.
export function mensagemDoErro(erro) {
  switch (erro?.codigo) {
    case ERRO_PERMISSAO_NEGADA:
      return erro.podePerguntarDeNovo === false
        ? `${MENSAGENS_PROXIMO.permissaoNegada} ${MENSAGENS_PROXIMO.permissaoNosAjustes}`
        : MENSAGENS_PROXIMO.permissaoNegada;
    case ERRO_GPS_DESLIGADO:
      return MENSAGENS_PROXIMO.gpsDesligado;
    case ERRO_TEMPO_ESGOTADO:
      return MENSAGENS_PROXIMO.tempoEsgotado;
    case ERRO_SEM_CONEXAO:
      return MENSAGENS_PROXIMO.semConexao;
    default:
      return MENSAGENS_PROXIMO.erroGenerico;
  }
}

// Busca do ponto mais próximo pelo GPS (RF02) ou por um endereço (RF03).
// A origem fica só no estado do componente, em memória (RNF04).
// estado.fase: 'ocioso' | 'buscando' | 'pronto' | 'sugestoes' | 'aviso'.
export default function useBuscaProximo() {
  const [estado, setEstado] = useState(INICIAL);

  // Mostra o resultado de buscarMaisProximo/buscarPorSugestao.
  function mostrar(resposta, origem, endereco = null) {
    if (!resposta.resultado) {
      vibrarErro();
      setEstado({ fase: 'aviso', mensagem: resposta.mensagem });
      return;
    }
    vibrarSucesso();
    setEstado({ fase: 'pronto', resultado: resposta.resultado, origem, endereco });
  }

  async function executar(textoBuscando, tarefa) {
    setEstado({ fase: 'buscando', textoBuscando });
    try {
      await tarefa();
    } catch (erro) {
      vibrarErro();
      setEstado({
        fase: 'aviso',
        mensagem: mensagemDoErro(erro),
        abrirAjustes: erro?.codigo === ERRO_PERMISSAO_NEGADA && erro.podePerguntarDeNovo === false,
      });
    }
  }

  const usarGps = useCallback(
    () =>
      executar(MENSAGENS_PROXIMO.obtendoLocalizacao, async () => {
        const origem = await obterPosicaoAtual();
        mostrar(await controladorBusca.buscarMaisProximo(origem), origem);
      }),
    []
  );

  const pesquisarEndereco = useCallback(
    (texto) =>
      executar(MENSAGENS_PROXIMO.pesquisandoEndereco, async () => {
        const resposta = await controladorBusca.buscarPorEndereco(texto);
        if (resposta.situacao === 'encontrado') {
          mostrar(resposta, resposta.origem, resposta.endereco);
        } else if (resposta.situacao === 'sugestoes') {
          setEstado({ fase: 'sugestoes', sugestoes: resposta.sugestoes, mensagem: resposta.mensagem });
        } else {
          vibrarErro();
          setEstado({ fase: 'aviso', mensagem: resposta.mensagem });
        }
      }),
    []
  );

  const escolherSugestao = useCallback(
    (sugestao) =>
      executar(MENSAGENS_PROXIMO.pesquisandoEndereco, async () => {
        const resposta = await controladorBusca.buscarPorSugestao(sugestao);
        mostrar(resposta, resposta.origem, resposta.endereco);
      }),
    []
  );

  const limpar = useCallback(() => setEstado(INICIAL), []);

  return { estado, usarGps, pesquisarEndereco, escolherSugestao, limpar };
}
