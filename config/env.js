const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["local", "development", "production"]).default("local"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().url(),
  MONGODB_TLS_INSECURE: z.enum(["true", "false"]).default("false"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  DEFAULT_TEACHER_PASSWORD: z.string().min(1).default("teacher123"),
  DEFAULT_STUDENT_PASSWORD: z.string().min(1).default("student123"),
});

let config = null;

const loadConfig = () => {
  if (config) return config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment validation failed:");
    result.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
  }

  config = result.data;
  return config;
};

const validateEnv = () => loadConfig();

module.exports = { validateEnv, loadConfig, envSchema };
