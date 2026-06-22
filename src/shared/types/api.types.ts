export type RespostaApiSucesso<T> = {
  mensagem: string;
  dados: T;
};

export type MetadadosPaginacao = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RespostaApiErro = {
  erro: {
    codigo: string;
    mensagem: string;
    detalhes?: unknown;
  };
};
