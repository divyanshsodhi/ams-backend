const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["local", "development", "production"]).default("local"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment validation failed:");
    result.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
  }

  return result.data;
};

module.exports = { validateEnv, envSchema };
