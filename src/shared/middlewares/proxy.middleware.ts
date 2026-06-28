// Middleware de proxy: coracao do BFF como gateway. Encaminha requisicoes aos
// servicos internos injetando a autenticacao de servico e devolvendo a resposta.
import type { AxiosInstance, AxiosResponse } from "axios";
import type { NextFunction, Request, Response } from "express";

import { env } from "@/config/env";
import { filtrarHeadersDeRepasse } from "@/shared/utils/headers";

// Apenas estes headers da resposta do servico interno sao repassados ao cliente.
// O restante (ex.: headers internos de infra) fica retido no BFF.
const HEADERS_DE_RESPOSTA_PERMITIDOS = ["content-type", "cache-control", "etag", "location"];

type OpcoesProxy = {
  // Permite reescrever a URL de destino quando a rota do BFF nao bate 1:1 com a do servico.
  montarUrl?: (request: Request) => string;
};

/**
 * Fabrica um handler de proxy para um servico interno.
 *
 * O handler encaminha a requisicao recebida para o servico (client) e devolve a
 * resposta dele ao cliente final. E aqui que o BFF se autentica perante os servicos
 * privados (token interno) e propaga a identidade do usuario ja validada.
 *
 * @param client Instancia Axios apontando para o servico de destino.
 * @param opcoes Opcoes do proxy (ex.: reescrita da URL de destino).
 * @returns Handler Express pronto para ser registrado em uma rota.
 */
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
        // Token interno que prova ao servico privado que a chamada veio do BFF.
        // Sem ele os servicos respondem 403 (so confiam em quem tem o token).
        "x-internal-token": env.INTERNAL_TOKEN,
      };

      // O JWT ja foi validado no middleware de autenticacao; aqui so repassamos a
      // identidade resolvida para o servico nao precisar revalidar o token.
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
        // Nunca lanca por status HTTP: 4xx/5xx do servico sao repassados como vieram,
        // sem o BFF transformar em erro proprio.
        validateStatus: () => true,
      });

      // Copia so os headers da lista branca para o cliente, preservando o status original.
      for (const nomeHeader of HEADERS_DE_RESPOSTA_PERMITIDOS) {
        const valor = respostaDownstream.headers[nomeHeader];
        if (typeof valor === "string") {
          response.setHeader(nomeHeader, valor);
        }
      }

      response.status(respostaDownstream.status).send(respostaDownstream.data);
    } catch (erro) {
      // Falha de rede/conexao com o servico interno cai aqui e vira erro tratado.
      next(erro);
    }
  };
}
