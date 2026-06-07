import { Router } from "express";

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
import { listasAlunoRouter } from "./listasAlunos.routes"

import { quizClient } from "@/shared/clients/quiz.client";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { amizadeRouter } from "./amizade.routes";

const apiRouter = Router();

apiRouter.use("/autenticacao", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/exemplos", exemplosRouter);
apiRouter.use("/questoes", questoesRouter);
apiRouter.use("/ia", iaRouter);
apiRouter.use("/turmas", turmasRouter);
apiRouter.use("/usuarios", usuariosRouter);
apiRouter.use("/quiz", middlewareAutenticacao, criarProxyHandler(quizClient));
apiRouter.use("/amizade",amizadeRouter);
apiRouter.use("/lista", listasRouter);
apiRouter.use("/listasAluno", listasAlunoRouter);
apiRouter.use("/turmasDashboard", turmaDashboardRouter);
apiRouter.use("/dashboardAluno", dashboardAlunoRouter);

export { apiRouter };