import { Router } from "express";
import { quizClient } from "@/shared/clients/quiz.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

const router = Router();

router.use(middlewareAutenticacao);

router.all(/.*/, criarProxyHandler(quizClient));

export { router as inventarioRouter };