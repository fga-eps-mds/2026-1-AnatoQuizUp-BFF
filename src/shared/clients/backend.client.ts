import axios from "axios";

import { env } from "@/config/env";

// Cliente HTTP pre-configurado para o Usuario-Service (auth/usuarios/admin/amizade).
// Centraliza baseURL e timeout para todas as chamadas reaproveitarem a mesma config.
export const backendClient = axios.create({
  baseURL: env.BACKEND_URL,
  timeout: env.REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});
