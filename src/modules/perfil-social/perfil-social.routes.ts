import { Router } from "express";
import { z } from "zod";

import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";

import { PerfilSocialController } from "./perfil-social.controller";
import { PerfilSocialService } from "./perfil-social.service";

const perfilSocialService = new PerfilSocialService();
const perfilSocialController = new PerfilSocialController(perfilSocialService);

const perfilSocialRouter = Router();

perfilSocialRouter.use(middlewareAutenticacao);

perfilSocialRouter.get("/:usuarioId/social", (request, response, next) => {
  const resultado = z.string().trim().min(1).safeParse(request.params.usuarioId);

  if (!resultado.success) {
    return response.status(400).json({
      erro: {
        codigo: "REQUISICAO_INVALIDA",
        mensagem: "Identificador do usuario invalido.",
      },
    });
  }

  return perfilSocialController.buscarPerfil(request, response, next);
});

export { perfilSocialController, perfilSocialRouter };
