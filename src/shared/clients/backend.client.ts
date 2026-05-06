import axios from "axios";

import { env } from "@/config/env";

export const backendClient = axios.create({
  baseURL: env.BACKEND_URL,
  timeout: env.REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});
