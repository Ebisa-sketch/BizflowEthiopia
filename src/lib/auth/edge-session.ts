interface EdgeSessionClaims {
  userId: string;
  exp: number;
  nbf?: number;
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function isValidEdgeSessionToken(
  token: string | undefined,
  secret: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<boolean> {
  try {
    if (!token || !secret || token.length > 8192) return false;

    const parts = token.split(".");
    if (parts.length !== 3 || parts.some((part) => !part)) return false;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedHeader))
    ) as { alg?: string; typ?: string };
    if (header.alg !== "HS256" || header.typ !== "JWT") return false;

    const claims = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload))
    ) as Partial<EdgeSessionClaims>;
    if (
      typeof claims.userId !== "string" ||
      claims.userId.length === 0 ||
      typeof claims.exp !== "number" ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= nowSeconds ||
      (claims.nbf !== undefined &&
        (typeof claims.nbf !== "number" || claims.nbf > nowSeconds))
    ) {
      return false;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(new TextEncoder().encode(secret)),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      toArrayBuffer(decodeBase64Url(encodedSignature)),
      toArrayBuffer(
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
      )
    );
  } catch {
    return false;
  }
}
