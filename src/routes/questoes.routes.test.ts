import jwt from "jsonwebtoken";
import request from "supertest";

jest.mock("@/shared/clients/quiz.client", () => ({
  quizClient: {
    request: jest.fn(),
  },
}));

import { aplicacao } from "@/config/app";
import { env } from "@/config/env";
import { quizClient } from "@/shared/clients/quiz.client";

const quizRequestMock = quizClient.request as jest.Mock;

describe("questoesRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("exige Authorization para listar questoes", async () => {
    const resposta = await request(aplicacao).get("/api/v1/questoes");

    expect(resposta.status).toBe(401);
    expect(quizRequestMock).not.toHaveBeenCalled();
  });

  test("encaminha questoes autenticadas para o Quiz-Service", async () => {
    const token = jwt.sign(
      { id: "professor-1", email: "professor@anatoquizup.com", papel: "PROFESSOR", status: "ATIVO" },
      env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );

    quizRequestMock.mockResolvedValueOnce({
      status: 200,
      headers: { "content-type": "application/json" },
      data: { dados: [], metadados: { page: 1, limit: 10, total: 0, totalPages: 1 } },
    });

    const resposta = await request(aplicacao)
      .get("/api/v1/questoes")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(quizRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "/api/v1/questoes",
        headers: expect.objectContaining({
          "x-internal-token": env.INTERNAL_TOKEN,
          "x-user-id": "professor-1",
          "x-user-papel": "PROFESSOR",
          "x-user-status": "ATIVO",
        }),
      }),
    );
  });
});
