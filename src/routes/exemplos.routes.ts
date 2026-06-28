import { Router } from "express";

import { backendClient } from "@/shared/clients/backend.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

const router = Router();

// Rotas de exemplo/referencia: autenticadas e repassadas ao Usuario-Service.
router.use(middlewareAutenticacao);
router.all(/.*/, criarProxyHandler(backendClient));

export { router as exemplosRouter };
