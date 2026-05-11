import { Router } from "express";

import { backendClient } from "@/shared/clients/backend.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

const ROTAS_PUBLICAS = [
  "/login",
  "/atualizar-token",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/alunos/nickname-disponivel",
  "/alunos/email-disponivel",
  "/alunos/nacionalidades",
  "/alunos/opcoes-academicas",
  "/alunos/localidades",
];

const router = Router();
const proxy = criarProxyHandler(backendClient);

router.use((request, response, next) => {
  const ehPublica = ROTAS_PUBLICAS.some(
    (publica) => request.path === publica || request.path.startsWith(`${publica}/`),
  );
  if (ehPublica) return next();
  return middlewareAutenticacao(request, response, next);
});

router.all(/.*/, proxy);

export { router as authRouter };
