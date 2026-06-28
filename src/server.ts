// Bootstrap do BFF: sobe a aplicacao Express na porta configurada e trata o
// encerramento gracioso. Separado de app.ts para manter a montagem testavel.
import { aplicacao } from "@/config/app";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

/**
 * Ponto de entrada do processo do BFF.
 *
 * Sobe o servidor HTTP na porta configurada e registra o encerramento gracioso
 * (graceful shutdown) em resposta aos sinais SIGINT/SIGTERM do orquestrador.
 */
async function iniciarServidor() {
  const servidorHttp = aplicacao.listen(env.PORT, "0.0.0.0", () => {
    logger.info({ port: env.PORT }, "BFF em execucao.");
  });

  // Graceful shutdown: para de aceitar conexoes e so encerra apos fechar as abertas.
  const encerrarServidor = (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Sinal de encerramento recebido.");
    servidorHttp.close(() => {
      logger.info("BFF HTTP encerrado.");
      process.exit(0);
    });
  };

  // Sinais enviados por orquestradores (ex.: Docker/Railway) ao reiniciar/parar o servico.
  process.on("SIGINT", () => encerrarServidor("SIGINT"));
  process.on("SIGTERM", () => encerrarServidor("SIGTERM"));
}

// Falha na subida e fatal: registra o motivo e sai com codigo de erro.
void iniciarServidor().catch((error) => {
  logger.error({ error }, "Falha ao iniciar o BFF.");
  process.exit(1);
});
