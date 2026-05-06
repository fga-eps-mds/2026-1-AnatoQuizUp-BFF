import { AxiosError } from "axios";
import type { NextFunction, Request, Response } from "express";

import { logger } from "@/config/logger";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import type { RespostaApiErro } from "@/shared/types/api.types";

export function middlewareTratamentoErros(
  erro: unknown,
  _request: Request,
  response: Response<RespostaApiErro>,
  next: NextFunction,
) {
  void next;

  if (erro instanceof ErroAplicacao) {
    return response.status(erro.codigoStatus).json({
      erro: {
        codigo: erro.codigo,
        mensagem: erro.message,
        detalhes: erro.detalhes,
      },
    });
  }

  if (erro instanceof AxiosError) {
    const codigoStatus =
      erro.code === "ECONNABORTED" || erro.code === "ETIMEDOUT" ? 504 : 502;
    const codigo =
      codigoStatus === 504 ? CodigoDeErro.TIMEOUT_DOWNSTREAM : CodigoDeErro.ERRO_DOWNSTREAM;
    logger.error({ erro: erro.message, code: erro.code }, "Erro Axios na chamada downstream.");
    return response.status(codigoStatus).json({
      erro: {
        codigo,
        mensagem: MENSAGENS.falhaServicoDownstream,
      },
    });
  }

  logger.error({ erro }, "Erro nao tratado no BFF.");

  return response.status(500).json({
    erro: {
      codigo: CodigoDeErro.ERRO_INTERNO,
      mensagem: MENSAGENS.erroInterno,
    },
  });
}
