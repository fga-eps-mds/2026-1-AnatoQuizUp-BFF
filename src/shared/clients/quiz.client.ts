import axios from "axios";

import { env } from "@/config/env";

export const quizClient = axios.create({
  baseURL: env.QUIZ_SERVICE_URL,
  timeout: env.REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});
