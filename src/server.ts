import { aplicacao } from "@/config/app";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

async function iniciarServidor() {
  const servidorHttp = aplicacao.listen(env.PORT, "0.0.0.0", () => {
    logger.info({ port: env.PORT }, "BFF em execucao.");
  });

  const encerrarServidor = (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Sinal de encerramento recebido.");
    servidorHttp.close(() => {
      logger.info("BFF HTTP encerrado.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => encerrarServidor("SIGINT"));
  process.on("SIGTERM", () => encerrarServidor("SIGTERM"));
}

void iniciarServidor().catch((error) => {
  logger.error({ error }, "Falha ao iniciar o BFF.");
  process.exit(1);
});
