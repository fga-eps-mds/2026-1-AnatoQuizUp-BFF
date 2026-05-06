import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "@/config/env";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

type PayloadJwt = {
  sub?: string;
  id?: string;
  perfil?: string;
  status?: string;
  iat?: number;
  exp?: number;
};

export function middlewareAutenticacao(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(
      new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.tokenAcessoAusente,
      }),
    );
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET_KEY) as PayloadJwt;
    request.usuario = {
      id: payload.sub ?? payload.id ?? "",
      perfil: payload.perfil ?? "",
      status: payload.status ?? "",
    };
    next();
  } catch {
    next(
      new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.tokenAcessoInvalido,
      }),
    );
  }
}
