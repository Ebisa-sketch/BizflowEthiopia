export function getAllowedApiOrigin(
  origin: string | null,
  environment: NodeJS.ProcessEnv = process.env
): string | null {
  if (!origin) return null;

  const configuredOrigins = (environment.MOBILE_APP_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredOrigins.includes(origin)) return origin;
  if (environment.NODE_ENV === "production") return null;

  try {
    const parsedOrigin = new URL(origin);
    if (
      parsedOrigin.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsedOrigin.hostname)
    ) {
      return origin;
    }
  } catch {
    return null;
  }

  return null;
}
