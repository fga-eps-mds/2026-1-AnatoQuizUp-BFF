// Middleware de autenticacao por JWT: valida o access token e disponibiliza a
// identidade do usuario para os handlers seguintes do BFF.
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

// Formato esperado do payload do access token. Campos opcionais porque o token
// pode vir de versoes diferentes do Usuario-Service (ora "sub", ora "id").
type PayloadJwt = {
  sub?: string;
  id?: string;
  papel?: string;
  status?: string;
  iat?: number;
  exp?: number;
};

/**
 * Middleware de autenticacao: porta de entrada protegida do BFF.
 *
 * Valida o access token (esquema Bearer) e, em caso de sucesso, anexa o usuario
 * resolvido em request.usuario, que o proxy depois propaga aos servicos internos.
 * Token ausente, malformado, expirado ou com assinatura invalida resulta em 401.
 *
 * @param request Requisicao Express, de onde o header Authorization e lido.
 * @param _response Resposta Express (nao utilizada diretamente aqui).
 * @param next Continua a cadeia em caso de sucesso, ou encaminha o erro 401.
 */
export function middlewareAutenticacao(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  // Le o header Authorization, onde o cliente envia o access token.
  const header = request.headers.authorization;

  // Exige o esquema "Bearer <token>"; ausencia ou formato errado ja barra como 401.
  if (!header?.startsWith("Bearer ")) {
    return next(
      new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.tokenAcessoAusente,
      }),
    );
  }

  // Remove o prefixo "Bearer " e fica apenas com o token em si.
  const token = header.slice("Bearer ".length).trim();

  try {
    // verify confere assinatura e expiracao; lanca se o token for invalido/expirado.
    const payload = jwt.verify(token, env.JWT_SECRET_KEY) as PayloadJwt;
    // Normaliza o id aceitando tanto "sub" quanto "id" para nao depender do formato.
    request.usuario = {
      id: payload.sub ?? payload.id ?? "",
      papel: payload.papel ?? "",
      status: payload.status ?? "",
    };
    next();
  } catch {
    // Qualquer falha do verify (assinatura, expiracao, formato) vira 401 generico.
    next(
      new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.tokenAcessoInvalido,
      }),
    );
  }
}
