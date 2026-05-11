import { criarOpcoesCors, parseCorsOrigins } from "@/config/cors";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";
import { filtrarHeadersDeRepasse } from "@/shared/utils/headers";

describe("utils/headers - filtrarHeadersDeRepasse", () => {
  it("remove headers reservados", () => {
    const resultado = filtrarHeadersDeRepasse({
      host: "exemplo.com",
      "content-length": "10",
      "transfer-encoding": "chunked",
      connection: "keep-alive",
      "accept-encoding": "gzip",
      origin: "https://front.example.com",
      "x-internal-token": "token-cliente",
      "x-user-id": "usuario-forjado",
      authorization: "Bearer token",
    });

    expect(resultado).toEqual({ authorization: "Bearer token" });
  });

  it("converte arrays em valores separados por virgula", () => {
    const resultado = filtrarHeadersDeRepasse({
      "x-custom": ["a", "b", "c"],
    });
    expect(resultado).toEqual({ "x-custom": "a,b,c" });
  });

  it("ignora valores undefined", () => {
    const resultado = filtrarHeadersDeRepasse({
      "x-vazio": undefined,
      "x-presente": "ok",
    });
    expect(resultado).toEqual({ "x-presente": "ok" });
  });

  it("trata case-insensitivity para reservados", () => {
    const resultado = filtrarHeadersDeRepasse({ Host: "exemplo.com", "X-OK": "valor" });
    expect(resultado).toEqual({ "X-OK": "valor" });
  });
});

describe("proxy.middleware - criarProxyHandler", () => {
  it("permite reescrever a URL repassada ao downstream", async () => {
    const client = {
      request: jest.fn().mockResolvedValue({ status: 200, data: { ok: true }, headers: {} }),
    };
    const response = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    await criarProxyHandler(client as never, {
      montarUrl: () => "/api/v1/questoes/gerar",
    })(
      {
        method: "POST",
        originalUrl: "/api/v1/ia/questoes/gerar",
        headers: {},
        body: { tema: "torax" },
      } as never,
      response as never,
      next,
    );

    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/api/v1/questoes/gerar" }),
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("ErroAplicacao", () => {
  it("preserva codigo, status, mensagem e detalhes", () => {
    const erro = new ErroAplicacao({
      mensagem: "Falhou",
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      codigoStatus: 401,
      detalhes: { foo: "bar" },
    });
    expect(erro).toBeInstanceOf(Error);
    expect(erro.name).toBe("ErroAplicacao");
    expect(erro.message).toBe("Falhou");
    expect(erro.codigo).toBe(CodigoDeErro.NAO_AUTORIZADO);
    expect(erro.codigoStatus).toBe(401);
    expect(erro.detalhes).toEqual({ foo: "bar" });
  });

  it("aceita ausencia de detalhes", () => {
    const erro = new ErroAplicacao({
      mensagem: "X",
      codigo: CodigoDeErro.ERRO_INTERNO,
      codigoStatus: 500,
    });
    expect(erro.detalhes).toBeUndefined();
  });
});

describe("config/cors", () => {
  it("parseCorsOrigins separa por virgula e remove vazios", () => {
    expect(parseCorsOrigins("a,b , c, ,d")).toEqual(["a", "b", "c", "d"]);
  });

  it("criarOpcoesCors permite origem incluida", () => {
    const opcoes = criarOpcoesCors(["http://app"]);
    const callback = jest.fn();
    (opcoes.origin as (origin: string | undefined, cb: jest.Mock) => void)(
      "http://app",
      callback,
    );
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("criarOpcoesCors permite ausencia de origem (curl/same-origin)", () => {
    const opcoes = criarOpcoesCors(["http://app"]);
    const callback = jest.fn();
    (opcoes.origin as (origin: string | undefined, cb: jest.Mock) => void)(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("criarOpcoesCors rejeita origem nao listada", () => {
    const opcoes = criarOpcoesCors(["http://app"]);
    const callback = jest.fn();
    (opcoes.origin as (origin: string | undefined, cb: jest.Mock) => void)(
      "http://outro",
      callback,
    );
    expect(callback).toHaveBeenCalledTimes(1);
    const argumento = callback.mock.calls[0][0];
    expect(argumento).toBeInstanceOf(ErroAplicacao);
    expect((argumento as ErroAplicacao).codigoStatus).toBe(403);
  });
});
