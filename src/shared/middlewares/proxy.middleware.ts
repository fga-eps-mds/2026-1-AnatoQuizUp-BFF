import type { AxiosInstance, AxiosResponse } from "axios";
import type { NextFunction, Request, Response } from "express";

import { env } from "@/config/env";
import { filtrarHeadersDeRepasse } from "@/shared/utils/headers";

const HEADERS_DE_RESPOSTA_PERMITIDOS = ["content-type", "cache-control", "etag", "location"];

type OpcoesProxy = {
  montarUrl?: (request: Request) => string;
};

export function criarProxyHandler(client: AxiosInstance, opcoes: OpcoesProxy = {}) {
  return async function handler(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const headersBase = filtrarHeadersDeRepasse(request.headers);
      const headers: Record<string, string> = {
        ...headersBase,
        "x-internal-token": env.INTERNAL_TOKEN,
      };

      if (request.usuario) {
        headers["x-user-id"] = request.usuario.id;
        headers["x-user-papel"] = request.usuario.papel;
        headers["x-user-status"] = request.usuario.status;
      }

      const respostaDownstream: AxiosResponse = await client.request({
        method: request.method,
        url: opcoes.montarUrl?.(request) ?? request.originalUrl,
        data: request.body,
        headers,
        validateStatus: () => true,
      });

      for (const nomeHeader of HEADERS_DE_RESPOSTA_PERMITIDOS) {
        const valor = respostaDownstream.headers[nomeHeader];
        if (typeof valor === "string") {
          response.setHeader(nomeHeader, valor);
        }
      }

      response.status(respostaDownstream.status).send(respostaDownstream.data);
    } catch (erro) {
      next(erro);
    }
  };
}
