import axios, { type AxiosInstance } from "axios";

import { env } from "@/config/env";

// Cliente do servico de IA, criado so quando AI_URL esta configurada. Sem ela, fica
// null e as rotas /ia respondem 503 (IA desligada nesta release).
export const aiClient: AxiosInstance | null = env.AI_URL
  ? axios.create({
      baseURL: env.AI_URL,
      timeout: env.REQUEST_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
    })
  : null;
