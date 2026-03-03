function isTestMode() {
  return process.env.NODE_ENV === "test";
}

function isNonProduction() {
  return process.env.NODE_ENV !== "production";
}

export function getEnv(key: string): string | undefined {
  return process.env[key];
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export function requireEnvOrTestFallback(key: string, fallback: string): string {
  const value = process.env[key];
  if (value) return value;
  if (isTestMode() || isNonProduction()) return fallback;
  throw new Error(`Missing required env var: ${key}`);
}
