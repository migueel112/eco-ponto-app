import { useCallback, useEffect, useRef, useState } from 'react';

export const MENSAGEM_ERRO_CONSULTA =
  'Não foi possível carregar os dados. Verifique sua conexão e tente de novo.';

// Executa uma consulta assíncrona (por exemplo, um método de controlador)
// e guarda o estado para a tela: { dados, carregando, erro, recarregar }.
// Repete a consulta quando algum valor de "dependencias" muda.
export default function useConsulta(consulta, dependencias = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null });
  const montado = useRef(true);
  // Guarda a consulta mais recente sem refazer o efeito a cada renderização.
  const consultaAtual = useRef(consulta);
  consultaAtual.current = consulta;

  const recarregar = useCallback(async () => {
    setEstado((anterior) => ({ ...anterior, carregando: true, erro: null }));
    try {
      const dados = await consultaAtual.current();
      if (montado.current) {
        setEstado({ dados, carregando: false, erro: null });
      }
    } catch {
      if (montado.current) {
        setEstado({ dados: null, carregando: false, erro: MENSAGEM_ERRO_CONSULTA });
      }
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    recarregar();
    return () => {
      montado.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  return { ...estado, recarregar };
}
