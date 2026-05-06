import pino from "pino";
import pinoHttp from "pino-http";

import { env } from "@/config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    servico: "anatoquizup-bff",
    ambiente: env.NODE_ENV,
  },
});

export const loggerHttp = pinoHttp({
  logger,
  customLogLevel(_request, response, error) {
    if (error || response.statusCode >= 500) {
      return "error";
    }

    if (response.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
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
