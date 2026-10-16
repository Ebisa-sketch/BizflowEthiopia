import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().regex(
    /^\d+(?:s|m|h|d|w|y)$/,
    "JWT_EXPIRES_IN must be a duration such as 15m, 7d, or 1y"
  ),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().default("ETB"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("en"),
});

const parsedEnv = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bizflow_ethiopia?schema=public",
  JWT_SECRET: process.env.JWT_SECRET || "bizflow_development_super_secret_jwt_key_min_32_chars",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "ETB",
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en",
});

export function assertProductionEnv(source: NodeJS.ProcessEnv): void {
  if (source.NODE_ENV !== "production") return;

  const errors: string[] = [];
  if (!source.DATABASE_URL) {
    errors.push("DATABASE_URL must be set in production");
  }
  if (!source.JWT_SECRET) {
    errors.push("JWT_SECRET must be set in production");
  } else if (source.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters in production");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production environment: ${errors.join("; ")}`);
  }
}

assertProductionEnv(process.env);

export const env = parsedEnv;
