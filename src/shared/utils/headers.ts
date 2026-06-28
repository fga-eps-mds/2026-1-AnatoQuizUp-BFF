// Headers que o BFF NUNCA deve repassar ao servico interno. Dividem-se em dois grupos:
// - hop-by-hop / de conexao (host, connection, te...), que pertencem a cada salto e
//   quebrariam o repasse se copiados;
// - de identidade interna (x-internal-token, x-user-*), que o proprio BFF reescreve
//   para o cliente nao conseguir forja-los.
const HEADERS_RESERVADOS = new Set([
  "host",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "proxy-authorization",
  "te",
  "trailer",
  "upgrade",
  "accept-encoding",
  "origin",
  "x-internal-token",
  "x-user-id",
  "x-user-papel",
  "x-user-status",
]);

/**
 * Filtra os headers da requisicao do cliente para repasse ao servico interno.
 *
 * Descarta os headers reservados (hop-by-hop e de identidade interna) e normaliza
 * valores repetidos, que chegam como array, para uma unica string com virgulas.
 *
 * @param headers Headers originais da requisicao do cliente.
 * @returns Headers seguros para serem repassados adiante.
 */
export function filtrarHeadersDeRepasse(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(headers)) {
    if (HEADERS_RESERVADOS.has(chave.toLowerCase())) continue;
    // Header repetido chega como array; normaliza para uma string separada por virgula.
    if (Array.isArray(valor)) {
      out[chave] = valor.join(",");
    } else if (typeof valor === "string") {
      out[chave] = valor;
    }
  }
  return out;
}
