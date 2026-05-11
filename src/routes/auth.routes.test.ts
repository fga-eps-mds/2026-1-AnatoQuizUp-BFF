import request from "supertest";

import { aplicacao } from "@/config/app";
import { backendClient } from "@/shared/clients/backend.client";

jest.mock("@/shared/clients/backend.client", () => ({
  backendClient: {
    request: jest.fn(),
  },
}));

const backendRequestMock = backendClient.request as jest.Mock;

describe("authRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("encaminha cadastro de professor sem exigir Authorization", async () => {
    backendRequestMock.mockResolvedValueOnce({
      status: 201,
      headers: { "content-type": "application/json" },
      data: {
        mensagem: "Cadastro realizado. Aguarde aprovacao do administrador.",
      },
    });

    const resposta = await request(aplicacao)
      .post("/api/v1/autenticacao/cadastro/professor")
      .send({
        nome: "Hilmer Rodrigues Neri",
        email: "hilmer@unb.br",
        siape: "1234567",
        instituicao: "UnB",
        departamento: "Anatomia",
        curso: "Medicina",
        senha: "password123",
        confirmacaoSenha: "password123",
      });

    expect(resposta.status).toBe(201);
    expect(backendRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/api/v1/autenticacao/cadastro/professor",
        headers: expect.objectContaining({
          "x-internal-token": "test-internal-token",
        }),
      }),
    );
  });

  test("mantem rota autenticada protegida sem Authorization", async () => {
    const resposta = await request(aplicacao).get("/api/v1/autenticacao/usuario-atual");

    expect(resposta.status).toBe(401);
    expect(backendRequestMock).not.toHaveBeenCalled();
  });
});
