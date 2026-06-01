import express from "express";
import request from "supertest";
import type { Request, Response } from "express";

import { dashboardAlunoRouter } from "../../src/routes/dashboardAluno.routes";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";

jest.mock("@/shared/middlewares/autenticacao.middleware", () => ({
  middlewareAutenticacao: jest.fn(),
}));

jest.mock("@/shared/middlewares/proxy.middleware", () => ({
  criarProxyHandler: jest.fn().mockReturnValue((req: Request, res: Response) => {
    res.status(200).json({ mockProxy: true, url: req.url });
  }),
}));

jest.mock("@/shared/clients/quiz.client", () => ({
  quizClient: { baseURL: "http://mock-quiz-service" },
}));

describe("DashboardAluno Router (BFF)", () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();

    (middlewareAutenticacao as jest.Mock).mockImplementation((req, res, next) => {
      next();
    });

    app = express();
    app.use(express.json());
    app.use("/api/v1/dashboardAluno", dashboardAlunoRouter);
  });

  it("deve repassar a requisicao para o proxy quando o usuario esta autenticado", async () => {
    const response = await request(app).get("/api/v1/dashboardAluno");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ mockProxy: true, url: "/" });
    expect(middlewareAutenticacao).toHaveBeenCalled();
  });

  it("deve bloquear com 401 quando a autenticacao falha", async () => {
    (middlewareAutenticacao as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(401).json({ erro: "Não autorizado" });
    });

    const response = await request(app).get("/api/v1/dashboardAluno");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ erro: "Não autorizado" });
  });
});
