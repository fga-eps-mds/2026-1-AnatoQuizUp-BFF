import { Router } from "express";

import { adminRouter } from "@/routes/admin.routes";
import { authRouter } from "@/routes/auth.routes";
import { exemplosRouter } from "@/routes/exemplos.routes";
import { iaRouter } from "@/routes/ia.routes";
import { questoesRouter } from "@/routes/questoes.routes";

const apiRouter = Router();

apiRouter.use("/autenticacao", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/exemplos", exemplosRouter);
apiRouter.use("/ia", iaRouter);
apiRouter.use("/questoes", questoesRouter);

export { apiRouter };
