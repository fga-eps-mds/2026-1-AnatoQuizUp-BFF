export type RespostaApiSucesso<T> = {
  mensagem: string;
  dados: T;
};

export type RespostaApiErro = {
  erro: {
    codigo: string;
    mensagem: string;
    detalhes?: unknown;
  };
};
