import { Router } from "express";

import { backendClient } from "@/shared/clients/backend.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

const router = Router();

// Rotas de administracao: exigem autenticacao e fazem proxy direto ao Usuario-Service.
// A autorizacao por papel (ADMIN) e checada la, nao aqui.
router.use(middlewareAutenticacao);
router.all(/.*/, criarProxyHandler(backendClient));

export { router as adminRouter };
