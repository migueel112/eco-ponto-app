import { useEffect, useState } from 'react';
import { autenticacao } from '../montagem';

// Acompanha o login do parceiro: { sessao, verificando }.
// "verificando" fica true até o Firebase dizer se há sessão guardada
// (o parceiro continua logado ao reabrir o app).
export default function useSessao() {
  const [estado, setEstado] = useState({ sessao: null, verificando: true });

  useEffect(
    () => autenticacao.observarSessao((sessao) => setEstado({ sessao, verificando: false })),
    []
  );

  return estado;
}
