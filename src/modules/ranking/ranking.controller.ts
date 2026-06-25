import type { NextFunction, Request, Response } from "express";

import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

import type { RankingService } from "./ranking.service";

type RequisicaoAutenticada = Pick<Request, "usuario" | "headers">;

const LIMITE_MAXIMO_GERAL = 200;

export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  geral = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);
      const limite = this.obterLimite(request);

      const resultado = await this.rankingService.rankingGeral(usuario, authorization, limite);

      return response.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  amigos = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);

      const resultado = await this.rankingService.rankingAmigos(usuario, authorization);

      return response.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  turma = async (
    request: Request<{ turmaId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);

      const resultado = await this.rankingService.rankingTurma(
        usuario,
        authorization,
        request.params.turmaId,
      );

      return response.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  lista = async (
    request: Request<{ turmaId: string; listaId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);

      const resultado = await this.rankingService.rankingLista(
        usuario,
        authorization,
        request.params.turmaId,
        request.params.listaId,
      );

      return response.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  private obterLimite(request: Request): number | undefined {
    const bruto = request.query.limite;

    if (typeof bruto !== "string") {
      return undefined;
    }

    const numero = Number.parseInt(bruto, 10);

    if (!Number.isFinite(numero) || numero <= 0) {
      return undefined;
    }

    return Math.min(numero, LIMITE_MAXIMO_GERAL);
  }

  private obterUsuario(request: RequisicaoAutenticada) {
    if (!request.usuario?.id) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: "Usuario nao autenticado.",
      });
    }

    return request.usuario;
  }

  private obterAuthorization(request: RequisicaoAutenticada): string {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: "Token de acesso ausente.",
      });
    }

    return authorization;
  }
}
