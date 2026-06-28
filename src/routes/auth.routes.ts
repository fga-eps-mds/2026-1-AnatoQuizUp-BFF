import { Router } from "express";

import { backendClient } from "@/shared/clients/backend.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

// Rotas de autenticacao acessiveis sem login (login, cadastro, recuperacao de senha e
// consultas de apoio ao formulario). As demais exigem token valido.
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

// Autenticacao seletiva: libera as rotas publicas (e suas subrotas) e exige token
// no restante antes de repassar ao Usuario-Service.
router.use((request, response, next) => {
  const ehPublica = ROTAS_PUBLICAS.some(
    (publica) => request.path === publica || request.path.startsWith(`${publica}/`),
  );
  if (ehPublica) return next();
  return middlewareAutenticacao(request, response, next);
});

router.all(/.*/, proxy);

export { router as authRouter };
