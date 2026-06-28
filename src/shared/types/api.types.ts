// Contratos genericos de resposta da API, compartilhados pelo BFF inteiro.

// Envelope de sucesso: mensagem + payload tipado em "dados".
export type RespostaApiSucesso<T> = {
  mensagem: string;
  dados: T;
};

// Metadados de paginacao retornados em listagens.
export type MetadadosPaginacao = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Envelope de erro: formato unico devolvido pelo middleware de tratamento de erros.
export type RespostaApiErro = {
  erro: {
    codigo: string;
    mensagem: string;
    detalhes?: unknown;
  };
};
