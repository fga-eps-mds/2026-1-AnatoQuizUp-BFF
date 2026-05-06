import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const ambienteAtual = process.env.NODE_ENV ?? "development";
const ambienteTeste = ambienteAtual === "test";

const obrigatoria = (nome: string) => z.string().min(1, `${nome} is required.`);

const obrigatoriaComDefaultDeTeste = (nome: string, padrao: string) =>
  ambienteTeste ? z.string().min(1).default(padrao) : obrigatoria(nome);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  BACKEND_URL: obrigatoriaComDefaultDeTeste("BACKEND_URL", "http://localhost:3333"),
  AI_URL: z
    .string()
    .url()
    .or(z.literal(""))
    .default(""),
  INTERNAL_TOKEN: obrigatoriaComDefaultDeTeste("INTERNAL_TOKEN", "test-internal-token"),
  JWT_SECRET_KEY: obrigatoriaComDefaultDeTeste("JWT_SECRET_KEY", "test-secret"),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((origem) => origem.trim())
        .filter(Boolean),
    ),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(z.flattenError(parsedEnv.error).fieldErrors)}`,
  );
}

export const env = parsedEnv.data;
