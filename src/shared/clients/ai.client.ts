import axios, { type AxiosInstance } from "axios";

import { env } from "@/config/env";

export const aiClient: AxiosInstance | null = env.AI_URL
  ? axios.create({
      baseURL: env.AI_URL,
      timeout: env.REQUEST_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
    })
  : null;
