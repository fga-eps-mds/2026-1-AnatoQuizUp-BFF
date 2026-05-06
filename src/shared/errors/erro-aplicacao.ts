import type { ValorCodigoDeErro } from "@/shared/errors/codigos-de-erro";

type ParametrosErroAplicacao = {
  mensagem: string;
  codigo: ValorCodigoDeErro;
  codigoStatus: number;
  detalhes?: unknown;
};

export class ErroAplicacao extends Error {
  public readonly codigo: ValorCodigoDeErro;
  public readonly codigoStatus: number;
  public readonly detalhes?: unknown;

  constructor({ mensagem, codigo, codigoStatus, detalhes }: ParametrosErroAplicacao) {
    super(mensagem);
    this.name = "ErroAplicacao";
    this.codigo = codigo;
    this.codigoStatus = codigoStatus;
    this.detalhes = detalhes;
  }
}
