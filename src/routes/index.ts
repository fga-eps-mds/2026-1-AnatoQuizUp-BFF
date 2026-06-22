import { Router, type NextFunction, type Request, type Response } from "express";

import { adminRouter } from "@/routes/admin.routes";
import { authRouter } from "@/routes/auth.routes";
import { exemplosRouter } from "@/routes/exemplos.routes";
import { iaRouter } from "@/routes/ia.routes";
import { questoesRouter } from "@/routes/questoes.routes";
import { turmasRouter } from "@/routes/turmas.routes";
import { usuariosRouter } from "@/routes/usuarios.routes";
import { listasRouter } from "./lista.routes";
import { turmaDashboardRouter } from "./dashboardTurma.routes";
import { dashboardAlunoRouter } from "./dashboardAluno.routes";
import { listasAlunoRouter } from "./listasAlunos.routes";

import { quizClient } from "@/shared/clients/quiz.client";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { amizadeRouter } from "./amizade.routes";
import { perfilSocialRouter } from "@/modules/perfil-social/perfil-social.routes";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

const apiRouter = Router();

const bloquearRotaInterna = (_request: Request, _response: Response, next: NextFunction) =>
  next(
    new ErroAplicacao({
      codigoStatus: 404,
      codigo: CodigoDeErro.NAO_ENCONTRADO,
      mensagem: "A rota solicitada nao foi encontrada.",
    }),
  );

apiRouter.use("/autenticacao", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/exemplos", exemplosRouter);
apiRouter.use("/questoes", questoesRouter);
apiRouter.use("/ia", iaRouter);
apiRouter.use("/turmas", turmasRouter);
apiRouter.use("/usuarios", usuariosRouter);
apiRouter.use("/quiz", middlewareAutenticacao, criarProxyHandler(quizClient));
apiRouter.use("/loja", middlewareAutenticacao, criarProxyHandler(quizClient));
apiRouter.use("/inventario/usuarios/equipados", middlewareAutenticacao, bloquearRotaInterna);
apiRouter.use("/inventario", middlewareAutenticacao, criarProxyHandler(quizClient));
apiRouter.use("/conquistas/usuarios/destaques", middlewareAutenticacao, bloquearRotaInterna);
apiRouter.use("/conquistas", middlewareAutenticacao, criarProxyHandler(quizClient));
apiRouter.use("/perfis", perfilSocialRouter);
apiRouter.use("/amizade", amizadeRouter);
apiRouter.use("/lista", listasRouter);
apiRouter.use("/listasAluno", listasAlunoRouter);
apiRouter.use("/turmasDashboard", turmaDashboardRouter);
apiRouter.use("/dashboardAluno", dashboardAlunoRouter);

export { apiRouter };
