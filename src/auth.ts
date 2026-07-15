// Password hashing (PBKDF2 via SubtleCrypto) and JWT session helpers.
// No external dependencies — everything here runs natively on the Workers runtime.

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";
const KEY_LENGTH_BITS = 256;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function randomSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function deriveHash(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromHex(saltHex) as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  return toHex(derived);
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomSaltHex();
  const hash = await deriveHash(password, salt);
  return { hash, salt };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  const candidate = await deriveHash(password, salt);
  if (candidate.length !== hash.length) return false;
  // Constant-time-ish comparison
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

// --- JWT (HMAC-SHA256) ---

export interface SessionPayload {
  uid: number;
  username: string;
  exp: number; // unix seconds
}

function base64UrlEncode(data: ArrayBuffer | string): string {
  let bytes: Uint8Array;
  if (typeof data === "string") {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = new Uint8Array(data);
  }
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "===".slice((padded.length + 3) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const signaturePart = base64UrlEncode(signature);
  return `${signingInput}.${signaturePart}`;
}

export async function verifySession(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signaturePart) as BufferSource,
    new TextEncoder().encode(signingInput)
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "surikata_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
