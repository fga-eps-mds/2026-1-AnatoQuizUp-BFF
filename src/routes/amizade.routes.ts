import { Router } from "express";

import { backendClient } from "@/shared/clients/backend.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";
import { perfilSocialController } from "@/modules/perfil-social/perfil-social.routes";

const router = Router();

router.use(middlewareAutenticacao);
router.get("/amigos/perfis", perfilSocialController.listarAmigos);
router.all(/.*/, criarProxyHandler(backendClient));

export { router as amizadeRouter };
