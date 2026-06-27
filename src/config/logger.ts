// Configuracao de logging do BFF com pino: um logger base para a aplicacao e um
// logger HTTP que registra cada requisicao com nivel proporcional ao status.
import pino from "pino";
import pinoHttp from "pino-http";

import { env } from "@/config/env";

// Logger base da aplicacao. Cada log sai com servico/ambiente fixos (base) e
// timestamp em ISO, facilitando filtrar por servico na agregacao de logs.
export const logger = pino({
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    servico: "anatoquizup-bff",
    ambiente: env.NODE_ENV,
  },
});

// Logger de requisicoes HTTP, derivado do logger base.
export const loggerHttp = pinoHttp({
  logger,
  // Define a severidade do log pelo desfecho: 5xx/erro = error, 4xx = warn, resto = info.
  customLogLevel(_request, response, error) {
    if (error || response.statusCode >= 500) {
      return "error";
    }

    if (response.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
  // Loga so o essencial de cada req/res para nao poluir nem vazar dados sensiveis.
  serializers: {
    req(request) {
      return {
        method: request.method,
        url: request.url,
      };
    },
    res(response) {
      return {
        statusCode: response.statusCode,
      };
    },
  },
});
