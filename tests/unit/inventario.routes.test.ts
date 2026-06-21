import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import express from "express";

jest.mock("@/shared/middlewares/autenticacao.middleware", () => ({
  middlewareAutenticacao: jest.fn((req: Request, res: Response, next: NextFunction) => {
    next();
  }),
}));

jest.mock("@/shared/middlewares/proxy.middleware", () => ({
  criarProxyHandler: jest.fn(() => {
    return (req: Request, res: Response) => {
      res.status(200).json({ interceptadoPeloProxy: true, rota: req.path });
    };
  }),
}));

jest.mock("@/shared/clients/quiz.client", () => ({
  quizClient: {}, 
}));

import { inventarioRouter } from "../../src/routes/inventario.routes"; 
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";

describe("BFF - Roteador de Inventário", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use("/api/v1/inventario", inventarioRouter);
  });

  describe("Caminho Feliz (Sucesso)", () => {
    it("deve interceptar um GET e repassar para o proxy após autenticar", async () => {
      const response = await request(app).get("/api/v1/inventario/meu-perfil");

      expect(middlewareAutenticacao).toHaveBeenCalled();
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ interceptadoPeloProxy: true, rota: "/meu-perfil" });
    });

    it("deve interceptar um PATCH e repassar para o proxy após autenticar", async () => {
      const response = await request(app)
        .patch("/api/v1/inventario/equipar")
        .send({ itemLojaId: "item-123" });

      expect(middlewareAutenticacao).toHaveBeenCalled();
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ interceptadoPeloProxy: true, rota: "/equipar" });
    });
  });

  describe("Caminho de Erro (Falha na Autenticação)", () => {
    it("não deve repassar para o proxy se o middleware de autenticação bloquear", async () => {
      (middlewareAutenticacao as jest.Mock).mockImplementationOnce((req: Request, res: Response) => {
        res.status(401).json({ mensagem: "Não autorizado" });
      });

      const response = await request(app).get("/api/v1/inventario/meu-perfil");

      expect(middlewareAutenticacao).toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ mensagem: "Não autorizado" });
    });
  });
});