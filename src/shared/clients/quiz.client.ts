import axios from "axios";

import { env } from "@/config/env";

// Cliente HTTP pre-configurado para o Quiz-Service (questoes, turmas, gamificacao).
// Mesma ideia do backendClient: baseURL e timeout centralizados.
export const quizClient = axios.create({
  baseURL: env.QUIZ_SERVICE_URL,
  timeout: env.REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});
