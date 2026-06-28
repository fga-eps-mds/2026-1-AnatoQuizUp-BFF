import { Router } from "express";
import { z } from "zod";

import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";

import { PerfilSocialController } from "./perfil-social.controller";
import { PerfilSocialService } from "./perfil-social.service";

// Liga o modulo de perfil social: instancia service e controller (compartilhados
// tambem por amizade.routes) e registra a rota autenticada de perfil.
const perfilSocialService = new PerfilSocialService();
const perfilSocialController = new PerfilSocialController(perfilSocialService);

const perfilSocialRouter = Router();

// Exige usuario autenticado para acessar qualquer perfil social.
perfilSocialRouter.use(middlewareAutenticacao);

// Valida o usuarioId da rota antes de chamar o controller: se vier vazio/invalido,
// corta com 400 e nem aciona o servico.
perfilSocialRouter.get("/:usuarioId/social", (request, response, next) => {
  // Valida o id da rota com Zod: precisa ser string nao vazia (apos trim).
  const resultado = z.string().trim().min(1).safeParse(request.params.usuarioId);

  // Id invalido para o fluxo aqui mesmo, sem chamar o controller/servicos.
  if (!resultado.success) {
    return response.status(400).json({
      erro: {
        codigo: "REQUISICAO_INVALIDA",
        mensagem: "Identificador do usuario invalido.",
      },
    });
  }

  // Id valido: segue para o controller buscar o perfil social.
  return perfilSocialController.buscarPerfil(request, response, next);
});

export { perfilSocialController, perfilSocialRouter };
