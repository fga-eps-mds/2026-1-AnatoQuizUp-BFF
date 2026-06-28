import { Router } from "express";
import { quizClient } from "@/shared/clients/quiz.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

const router = Router();

// Rotas de turmas: autenticadas e repassadas ao Quiz-Service (dono do dominio de turmas).
router.use(middlewareAutenticacao);

router.all(/.*/, criarProxyHandler(quizClient));

export { router as turmasRouter };