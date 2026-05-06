import jwt from "jsonwebtoken";
import request from "supertest";

jest.mock("@/shared/clients/backend.client", () => ({
  backendClient: { request: jest.fn() },
}));

jest.mock("@/shared/clients/ai.client", () => ({
  aiClient: { request: jest.fn() },
}));

import { aplicacao } from "@/config/app";
import { aiClient } from "@/shared/clients/ai.client";

const SEGREDO = process.env.JWT_SECRET_KEY ?? "test-secret";

const tokenValido = () =>
  jwt.sign({ sub: "u1", perfil: "ALUNO", status: "ATIVO" }, SEGREDO, { expiresIn: "5m" });

const aiMock = aiClient as unknown as { request: jest.Mock };

beforeEach(() => {
  aiMock.request.mockReset();
});

describe("/api/v1/ia - proxy para AI habilitado", () => {
  it("remove o prefixo /ia antes de repassar para o AI", async () => {
    aiMock.request.mockResolvedValue({
      status: 200,
      data: { mensagem: "ok", dados: { id: "q1" } },
      headers: {},
    });

    const resposta = await request(aplicacao)
      .post("/api/v1/ia/questoes/gerar")
      .set("Authorization", `Bearer ${tokenValido()}`)
      .send({ tema: "torax" });

    expect(resposta.status).toBe(200);
    expect(aiMock.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/api/v1/questoes/gerar",
      }),
    );
  });
});
