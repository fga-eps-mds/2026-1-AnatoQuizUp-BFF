import { Router } from "express";

import { backendClient } from "@/shared/clients/backend.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";
import { perfilSocialController } from "@/modules/perfil-social/perfil-social.routes";

const router = Router();

router.use(middlewareAutenticacao);
// "/amigos/perfis" e tratada pelo BFF (combina amizades + dados sociais do Quiz);
// precisa vir antes do proxy curinga para nao ser repassada ao Usuario-Service.
router.get("/amigos/perfis", perfilSocialController.listarAmigos);
// Demais rotas de amizade vao direto ao Usuario-Service.
router.all(/.*/, criarProxyHandler(backendClient));

export { router as amizadeRouter };
