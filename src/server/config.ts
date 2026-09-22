import { z } from 'zod';
const envSchema = z.object({
  TYPESAFE_API_KEY: z.string().optional(),
  TYPESAFE_MAX_CALLS_PER_DAY: z.coerce.number().int().min(1).max(1000).default(100),
  TYPESAFE_TIMEOUT_MS: z.coerce.number().int().min(100).max(8000).default(4000),
  DATABASE_URL: z
    .string()
    .default('postgresql://checkout:local-demo-only@127.0.0.1:55542/checkout'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3190),
  INSTANCE_ID: z.string().default('api-local'),
  PUBLIC_ORIGIN: z.string().default('http://localhost:5190'),
  GAME_ORIGINS: z.string().default(''),
  GAME_SESSIONS_LIMIT: z.coerce.number().int().min(1).max(24000).default(15000),
  GAME_SESSIONS_GLOBAL_LIMIT: z.coerce.number().int().min(1).max(24000).default(15000),
  GAME_ORDERS_LIMIT: z.coerce.number().int().min(1).max(2400).default(1800),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SERVE_STATIC: z.string().default('true'),
  RELEASE: z.string().default('development'),
});
export function configuration(env: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.parse(env);
  return {
    ...parsed,
    GAME_ORIGINS: parsed.GAME_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
