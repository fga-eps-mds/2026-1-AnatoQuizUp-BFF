import type { NextFunction, Request, Response } from "express";

import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

import type { PerfilSocialService } from "./perfil-social.service";

type PerfilSocialParams = {
  usuarioId: string;
};

type ListarAmigosQuery = {
  page?: number;
  limit?: number;
  nome?: string;
  nickname?: string;
};

type RequisicaoAutenticada = Pick<Request, "usuario" | "headers">;

export class PerfilSocialController {
  constructor(private readonly perfilSocialService: PerfilSocialService) {}

  listarAmigos = async (
    request: Request<unknown, unknown, unknown, ListarAmigosQuery>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);
      const resultado = await this.perfilSocialService.listarAmigosSociais(
        usuario,
        authorization,
        request.query,
      );

      return response.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  buscarPerfil = async (
    request: Request<PerfilSocialParams>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);
      const perfil = await this.perfilSocialService.buscarPerfilSocial(
        usuario,
        authorization,
        request.params.usuarioId,
      );

      return response.status(200).json({
        mensagem: "Perfil social encontrado.",
        dados: perfil,
      });
    } catch (error) {
      return next(error);
    }
  };

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
