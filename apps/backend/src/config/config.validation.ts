export function validateConfig(config: Record<string, unknown>) {
  const errors: string[] = [];

  const jwtSecret = config["JWT_SECRET"];
  if (typeof jwtSecret !== "string" || jwtSecret.length === 0) {
    errors.push("JWT_SECRET is required. Set a strong JWT_SECRET environment variable before starting the application.");
  } else if (jwtSecret === "your-jwt-secret" || jwtSecret === "fallback_secret") {
    errors.push("JWT_SECRET must not use a placeholder or default value.");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n  - ${errors.join("\n  - ")}`);
  }

  return config;
}
