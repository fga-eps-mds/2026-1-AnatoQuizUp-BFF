import type { NextFunction, Request, Response } from "express";

import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

import type { PerfilSocialService } from "./perfil-social.service";

// Parametro de rota: id do usuario cujo perfil social sera consultado.
type PerfilSocialParams = {
  usuarioId: string;
};

// Filtros e paginacao aceitos na listagem de amigos.
type ListarAmigosQuery = {
  page?: number;
  limit?: number;
  nome?: string;
  nickname?: string;
};

type RequisicaoAutenticada = Pick<Request, "usuario" | "headers">;

/**
 * Controller HTTP do perfil social.
 *
 * Valida os dados da requisicao, delega ao PerfilSocialService e devolve a resposta
 * em JSON, encaminhando erros ao middleware central via next.
 */
export class PerfilSocialController {
  constructor(private readonly perfilSocialService: PerfilSocialService) {}

  /**
   * GET da lista de amigos do usuario logado.
   *
   * Aceita paginacao e filtros por nome/nickname na query string.
   *
   * @param request Requisicao Express com os filtros de listagem.
   * @param response Resposta Express.
   * @param next Encaminha erros ao middleware central.
   */
  listarAmigos = async (
    request: Request<unknown, unknown, unknown, ListarAmigosQuery>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      // Resolve usuario e token e repassa os filtros (request.query) ao service.
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);
      const resultado = await this.perfilSocialService.listarAmigosSociais(
        usuario,
        authorization,
        request.query,
      );

      return response.status(200).json(resultado);
    } catch (error) {
      // Erros (inclusive 401 de validacao) vao para o middleware central.
      return next(error);
    }
  };

  /**
   * GET do perfil social de um amigo especifico. O usuarioId vem na rota.
   *
   * @param request Requisicao Express tipada com o parametro usuarioId.
   * @param response Resposta Express.
   * @param next Encaminha erros ao middleware central.
   */
  buscarPerfil = async (
    request: Request<PerfilSocialParams>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      // O usuarioId da rota ja foi validado pela camada de rota antes de chegar aqui.
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);
      const perfil = await this.perfilSocialService.buscarPerfilSocial(
        usuario,
        authorization,
        request.params.usuarioId,
      );

      // Envolve o perfil no envelope padrao (mensagem + dados) da API.
      return response.status(200).json({
        mensagem: "Perfil social encontrado.",
        dados: perfil,
      });
    } catch (error) {
      // O 404 de "nao e amigo" tambem cai aqui e e formatado pelo middleware central.
      return next(error);
    }
  };

  /**
   * Exige que o usuario ja tenha sido autenticado pelo middleware.
   *
   * @param request Requisicao que deveria conter o usuario autenticado.
   * @returns O usuario autenticado.
   * @throws ErroAplicacao 401 quando nao ha usuario na requisicao.
   */
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

  /**
   * Recupera o header Authorization a ser repassado aos servicos internos.
   *
   * @param request Requisicao de onde o header e lido.
   * @returns O valor do header Authorization.
   * @throws ErroAplicacao 401 quando o header esta ausente.
   */
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
