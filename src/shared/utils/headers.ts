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

export function filtrarHeadersDeRepasse(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(headers)) {
    if (HEADERS_RESERVADOS.has(chave.toLowerCase())) continue;
    if (Array.isArray(valor)) {
      out[chave] = valor.join(",");
    } else if (typeof valor === "string") {
      out[chave] = valor;
    }
  }
  return out;
}
