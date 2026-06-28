// Tratador central de erros do BFF: unico ponto que transforma excecoes em
// respostas JSON padronizadas, isolando o cliente dos detalhes internos.
import { AxiosError } from "axios";
import type { NextFunction, Request, Response } from "express";

import { logger } from "@/config/logger";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import type { RespostaApiErro } from "@/shared/types/api.types";

/**
 * Middleware central de tratamento de erros do BFF.
 *
 * E o ultimo da cadeia e converte qualquer excecao em uma resposta JSON
 * padronizada. Trata tres casos em ordem de especificidade: erros de aplicacao
 * (ErroAplicacao), falhas de chamada a servicos internos (AxiosError) e, por fim,
 * qualquer erro inesperado como 500 generico.
 *
 * @param erro Excecao capturada na cadeia de middlewares/handlers.
 * @param _request Requisicao Express (nao utilizada na montagem da resposta).
 * @param response Resposta Express tipada com o envelope de erro padrao.
 * @param next Exigido na assinatura para o Express tratar como handler de erro.
 */
export function middlewareTratamentoErros(
  erro: unknown,
  _request: Request,
  response: Response<RespostaApiErro>,
  next: NextFunction,
) {
  // next nao e usado, mas precisa existir na assinatura para o Express reconhecer
  // esta funcao como handler de erro (4 argumentos).
  void next;

  // Erros previstos da aplicacao ja trazem status, codigo e mensagem prontos.
  if (erro instanceof ErroAplicacao) {
    return response.status(erro.codigoStatus).json({
      erro: {
        codigo: erro.codigo,
        mensagem: erro.message,
        detalhes: erro.detalhes,
      },
    });
  }

  // Falha ao chamar um servico interno: timeout vira 504, demais falhas viram 502.
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

  // Qualquer outra excecao e inesperada: loga o erro completo e responde 500 generico
  // sem vazar detalhes internos ao cliente.
  logger.error({ erro }, "Erro nao tratado no BFF.");

  return response.status(500).json({
    erro: {
      codigo: CodigoDeErro.ERRO_INTERNO,
      mensagem: MENSAGENS.erroInterno,
    },
  });
}
