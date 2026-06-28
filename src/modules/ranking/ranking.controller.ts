import type { NextFunction, Request, Response } from "express";

import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

import type { RankingService } from "./ranking.service";

// Controller HTTP do ranking: traduz requisicoes Express em chamadas ao service e
// padroniza respostas e erros, sem conter regra de negocio.

// So precisamos do usuario ja resolvido e dos headers para repassar adiante.
type RequisicaoAutenticada = Pick<Request, "usuario" | "headers">;

// Teto de seguranca para o parametro "limite": impede pedir um ranking gigante.
const LIMITE_MAXIMO_GERAL = 200;

/**
 * Controller HTTP do ranking.
 *
 * Cada handler extrai e valida os dados da requisicao, delega a regra ao
 * RankingService e padroniza o tratamento de erro encaminhando para o middleware
 * central via next. Nenhuma regra de negocio vive aqui.
 */
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  /**
   * GET do ranking geral. Aceita o parametro "limite" opcional na query string.
   *
   * @param request Requisicao Express (com usuario e headers de autenticacao).
   * @param response Resposta Express.
   * @param next Encaminha erros ao middleware central.
   */
  geral = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // Extrai e valida os dados da requisicao antes de chamar o service.
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);
      const limite = this.obterLimite(request);

      const resultado = await this.rankingService.rankingGeral(usuario, authorization, limite);

      return response.status(200).json(resultado);
    } catch (error) {
      // Qualquer erro (validacao ou servico) segue para o middleware central.
      return next(error);
    }
  };

  /**
   * GET do ranking apenas entre os amigos do usuario logado.
   *
   * @param request Requisicao Express (com usuario e headers de autenticacao).
   * @param response Resposta Express.
   * @param next Encaminha erros ao middleware central.
   */
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

  /**
   * GET do ranking dos alunos de uma turma. O turmaId vem nos parametros da rota.
   *
   * @param request Requisicao Express tipada com o parametro turmaId.
   * @param response Resposta Express.
   * @param next Encaminha erros ao middleware central.
   */
  turma = async (
    request: Request<{ turmaId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);

      // O turmaId vem direto da rota e e repassado ao service.
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

  /**
   * GET do ranking de uma lista especifica dentro de uma turma.
   *
   * @param request Requisicao Express tipada com os parametros turmaId e listaId.
   * @param response Resposta Express.
   * @param next Encaminha erros ao middleware central.
   */
  lista = async (
    request: Request<{ turmaId: string; listaId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const usuario = this.obterUsuario(request);
      const authorization = this.obterAuthorization(request);

      // turmaId e listaId vem da rota e identificam a lista a ranquear.
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

  /**
   * Le e sanitiza o parametro "limite" da query string.
   *
   * Ignora valores nao numericos ou menores/iguais a zero e nunca deixa passar do
   * teto maximo. Retornar undefined faz o service aplicar o limite padrao.
   *
   * @param request Requisicao Express de onde o limite e lido.
   * @returns Limite saneado, ou undefined para usar o padrao do service.
   */
  private obterLimite(request: Request): number | undefined {
    const bruto = request.query.limite;

    // Query string ausente ou repetida (array): ignora e usa o padrao do service.
    if (typeof bruto !== "string") {
      return undefined;
    }

    const numero = Number.parseInt(bruto, 10);

    // Valor nao numerico ou nao positivo tambem cai no padrao.
    if (!Number.isFinite(numero) || numero <= 0) {
      return undefined;
    }

    // Limita ao teto maximo para evitar respostas excessivamente grandes.
    return Math.min(numero, LIMITE_MAXIMO_GERAL);
  }

  /**
   * Garante que o middleware de autenticacao ja preencheu o usuario na requisicao.
   *
   * @param request Requisicao que deveria conter o usuario autenticado.
   * @returns O usuario autenticado.
   * @throws ErroAplicacao 401 quando nao ha usuario na requisicao.
   */
  private obterUsuario(request: RequisicaoAutenticada) {
    // Defesa em profundidade: se o middleware nao rodou, barra como 401.
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
   * Recupera o header Authorization que sera repassado aos servicos internos.
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
