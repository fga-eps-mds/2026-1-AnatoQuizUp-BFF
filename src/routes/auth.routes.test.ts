import request from "supertest";

jest.mock("@/shared/clients/backend.client", () => ({
  backendClient: {
    request: jest.fn(),
  },
}));

import { aplicacao } from "@/config/app";
import { env } from "@/config/env";
import { backendClient } from "@/shared/clients/backend.client";

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
        senha: "senhaValida123",
        confirmacaoSenha: "senhaValida123",
      });

    expect(resposta.status).toBe(201);
    expect(backendRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/api/v1/autenticacao/cadastro/professor",
        headers: expect.objectContaining({
          "x-internal-token": env.INTERNAL_TOKEN,
        }),
      }),
    );
  });

  test("encaminha consulta publica de email sem repassar Origin ao Backend", async () => {
    backendRequestMock.mockResolvedValueOnce({
      status: 200,
      headers: { "content-type": "application/json" },
      data: {
        mensagem: "Email disponivel.",
        dados: { email: "miguelmsoliveira@gmail.com", disponivel: true },
      },
    });

    const resposta = await request(aplicacao)
      .get("/api/v1/autenticacao/alunos/email-disponivel")
      .query({ email: "miguelmsoliveira@gmail.com" })
      .set("Origin", "http://localhost:5173");

    expect(resposta.status).toBe(200);
    expect(backendRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/api/v1/autenticacao/alunos/email-disponivel"),
        headers: expect.objectContaining({
          "x-internal-token": env.INTERNAL_TOKEN,
        }),
      }),
    );
    expect(backendRequestMock.mock.calls[0][0].headers).not.toHaveProperty("origin");
  });

  test("mantem rota autenticada protegida sem Authorization", async () => {
    const resposta = await request(aplicacao).get("/api/v1/autenticacao/usuario-atual");

    expect(resposta.status).toBe(401);
    expect(backendRequestMock).not.toHaveBeenCalled();
  });
});
