import type { ValorCodigoDeErro } from "@/shared/errors/codigos-de-erro";

type ParametrosErroAplicacao = {
  mensagem: string;
  codigo: ValorCodigoDeErro;
  codigoStatus: number;
  detalhes?: unknown;
};

/**
 * Erro de dominio do BFF.
 *
 * Estende Error acrescentando o status HTTP, um codigo de erro estavel (parte do
 * contrato com o cliente) e detalhes opcionais. O middleware central de erros usa
 * esses campos para montar a resposta sem precisar inferir nada.
 */
export class ErroAplicacao extends Error {
  public readonly codigo: ValorCodigoDeErro;
  public readonly codigoStatus: number;
  public readonly detalhes?: unknown;

  /**
   * @param params Dados do erro: mensagem, codigo, status HTTP e detalhes opcionais.
   */
  constructor({ mensagem, codigo, codigoStatus, detalhes }: ParametrosErroAplicacao) {
    super(mensagem);
    // Nome fixo para facilitar identificar este tipo de erro nos logs.
    this.name = "ErroAplicacao";
    this.codigo = codigo;
    this.codigoStatus = codigoStatus;
    this.detalhes = detalhes;
  }
}
