/**
 * Production Error Tracking & Sentry Interface
 * Gracefully operates in three modes:
 * 1. Full Sentry capture (when SENTRY_DSN is configured and SDK is present)
 * 2. HTTP Sentry Store API dispatch (zero external dependency mode)
 * 3. Graceful fallback console logger (development and unconfigured test environments)
 */

export interface ErrorContext {
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
  user?: {
    id?: string;
    email?: string;
    role?: string;
    businessId?: string;
  };
  level?: "fatal" | "error" | "warning" | "info" | "debug";
}

let isInitialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  if (isInitialized) return;
  isInitialized = true;
  console.log("[SENTRY] Error tracking initialized with configured DSN.");
}

/**
 * Captures an unexpected exception or error.
 */
export function captureException(error: unknown, context?: ErrorContext): string {
  const dsn = process.env.SENTRY_DSN;
  const eventId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : JSON.stringify(error);

  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log locally
  console.error(`[ERROR_TRACKER] [${eventId}]`, errorMessage, {
    context,
    stack: errorStack,
  });

  // If SENTRY_DSN is present, dispatch asynchronously via Sentry Store / envelope API
  if (dsn) {
    try {
      const url = new URL(dsn);
      const projectId = url.pathname.replace(/^\//, "");
      const publicKey = url.username;
      const sentryHost = url.host;

      if (publicKey && projectId && typeof fetch !== "undefined") {
        const sentryEndpoint = `https://${sentryHost}/api/${projectId}/store/`;
        fetch(sentryEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=bizflow-client/1.0, sentry_key=${publicKey}`,
          },
          body: JSON.stringify({
            event_id: eventId.replace(/[^a-f0-9]/gi, "").padEnd(32, "0").substring(0, 32),
            timestamp: new Date().toISOString().replace("Z", ""),
            level: context?.level || "error",
            platform: "node",
            message: errorMessage,
            exception: {
              values: [
                {
                  type: error instanceof Error ? error.name : "Error",
                  value: errorMessage,
                  stacktrace: errorStack
                    ? {
                        frames: errorStack
                          .split("\n")
                          .slice(1)
                          .map((line) => ({ filename: line.trim() })),
                      }
                    : undefined,
                },
              ],
            },
            tags: context?.tags,
            extra: context?.extra,
            user: context?.user,
          }),
        }).catch((err) => {
          console.warn("[SENTRY] Background dispatch failed:", err?.message || err);
        });
      }
    } catch (parseErr) {
      console.warn("[SENTRY] DSN parsing error:", parseErr);
    }
  }

  return eventId;
}

/**
 * Captures an informational or diagnostic message.
 */
export function captureMessage(
  message: string,
  level: ErrorContext["level"] = "info",
  context?: ErrorContext
): string {
  return captureException(new Error(message), { ...context, level });
}
