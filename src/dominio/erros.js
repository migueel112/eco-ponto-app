// Códigos de erro compartilhados entre serviços e controladores.

// O aparelho está sem internet (ou o servidor não respondeu).
export const ERRO_SEM_CONEXAO = 'sem-conexao';

// Cria um erro com código, para o controlador decidir a mensagem da tela.
export function criarErro(mensagem, codigo) {
  return Object.assign(new Error(mensagem), { codigo });
}
