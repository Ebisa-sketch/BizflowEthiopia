/**
 * In-memory or cache-based idempotency key tracker
 * For high reliability in POS sales and financial write operations
 */

const processedKeys = new Map<string, { timestamp: number; response: unknown }>();
const TTL_MS = 60 * 1000; // 60 seconds

export function checkIdempotency(key: string): unknown | null {
  const item = processedKeys.get(key);
  if (!item) return null;

  if (Date.now() - item.timestamp > TTL_MS) {
    processedKeys.delete(key);
    return null;
  }

  return item.response;
}

export function recordIdempotency(key: string, response: unknown): void {
  // Prune expired
  const now = Date.now();
  for (const [k, v] of processedKeys.entries()) {
    if (now - v.timestamp > TTL_MS) {
      processedKeys.delete(k);
    }
  }

  processedKeys.set(key, { timestamp: now, response });
}
