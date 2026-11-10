// Códigos de erro compartilhados.
import { ERRO_SEM_CONEXAO, criarErro } from '../erros';

test('criarErro junta a mensagem e o código', () => {
  const erro = criarErro('offline', ERRO_SEM_CONEXAO);
  expect(erro).toBeInstanceOf(Error);
  expect(erro.message).toBe('offline');
  expect(erro.codigo).toBe('sem-conexao');
});
