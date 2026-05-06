import type { CorsOptions } from "cors";

import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function criarOpcoesCors(origensPermitidas: string[]): CorsOptions {
  return {
    origin(origin, callback) {
      if (!origin || origensPermitidas.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new ErroAplicacao({
          codigoStatus: 403,
          codigo: CodigoDeErro.PROIBIDO,
          mensagem: MENSAGENS.origemCorsNaoPermitida,
          detalhes: { origin },
        }),
      );
    },
  };
}
