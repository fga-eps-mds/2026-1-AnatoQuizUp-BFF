import type { CorsOptions } from "cors";

import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

/**
 * Converte a string de origens do .env em uma lista normalizada.
 *
 * Separa por virgula, remove espacos em volta e descarta entradas vazias.
 *
 * @param value String de origens separadas por virgula (ex.: "a,b,c").
 * @returns Lista de origens limpas.
 */
export function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Monta as opcoes do CORS a partir da lista de origens permitidas.
 *
 * Libera requisicoes sem origin (ex.: chamadas server-to-server e health checks)
 * e as de origens presentes na lista; as demais sao rejeitadas com 403.
 *
 * @param origensPermitidas Lista de origens autorizadas.
 * @returns Objeto de configuracao aceito pelo middleware cors.
 */
export function criarOpcoesCors(origensPermitidas: string[]): CorsOptions {
  return {
    origin(origin, callback) {
      // Sem origin (ex.: chamadas server-to-server/health) ou origin na lista: libera.
      if (!origin || origensPermitidas.includes(origin)) {
        callback(null, true);
        return;
      }

      // Origin nao autorizada vira erro 403 tratado pelo middleware central.
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
