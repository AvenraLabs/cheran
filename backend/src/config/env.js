import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.string().default("5000").transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DB_URI: z.string().min(1, "DB_URI is required"),
  DB_POOL_MAX: z.string().default("20").transform((v) => parseInt(v, 10)),
  DB_POOL_MIN: z.string().default("2").transform((v) => parseInt(v, 10)),
  DB_POOL_ACQUIRE: z.string().default("30000").transform((v) => parseInt(v, 10)),
  DB_POOL_IDLE: z.string().default("10000").transform((v) => parseInt(v, 10)),
  DB_STATEMENT_TIMEOUT: z.string().default("15000").transform((v) => parseInt(v, 10)),
  DB_IDLE_TX_TIMEOUT: z.string().default("10000").transform((v) => parseInt(v, 10)),
  DB_SSL: z.string().default("false").transform((v) => v === "true"),
  MAX_FILE_SIZE_MB: z.string().default("25").transform((v) => parseInt(v, 10)),
  CORS_ORIGIN: z.string().default("*"),
  JWT_SECRET: z.string().default("cheran_super_secret_jwt_key_2026_production"),
  JWT_EXPIRES_IN: z.string().default("30d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
