// Utility helpers for symmetric encryption using AES-256-GCM.
// Works in browsers and Node.js runtimes by relying on the Web Crypto API
// (Node 15+ exposes this as `crypto.webcrypto`).

// ---------------------------------------------------------------------------
// NOTE: These helpers purposely avoid referencing `window` so that they can be
// used in any JavaScript context (browser, server, worker, etc.).
// ---------------------------------------------------------------------------

// Usage:
//   import { encryptString, decryptString } from "@/lib/crypto-utils";
//   const cipher = await encryptString("secret text", passphrase);
//   const plain = await decryptString(cipher, passphrase);

// ---------------------------------------------------------------------------

const SALT = "chai-tea-salt"; // constant salt for key derivation
const ITERATIONS = 100_000;
const IV_LENGTH = 12; // 96-bit IV (recommended for GCM)

// -- Text encoding helpers ---------------------------------------------------
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// -- Retrieve a WebCrypto-compatible `crypto` instance -----------------------
async function getCrypto(): Promise<Crypto> {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    return globalThis.crypto as Crypto;
  }
  // Node.js fallback
  const { webcrypto } = await import("crypto");
  return webcrypto as unknown as Crypto;
}

// -- Derive an AES-GCM key from a passphrase --------------------------------
async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const crypto = await getCrypto();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// -- Base64 helpers that work in all runtimes --------------------------------
function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  // Node.js
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  // Node.js
  return new Uint8Array(Buffer.from(base64, "base64"));
}

// -- Public helpers ----------------------------------------------------------
export async function encryptString(
  plaintext: string,
  passphrase: string
): Promise<string> {
  const crypto = await getCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  // Concatenate IV + ciphertext for storage/transmission
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return bytesToBase64(combined);
}

export async function decryptString(
  encoded: string,
  passphrase: string
): Promise<string> {
  try {
    const crypto = await getCrypto();
    const combined = base64ToBytes(encoded);
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);
    const key = await deriveKey(passphrase);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return decoder.decode(plainBuf);
  } catch {
    return ""; // return empty string on failure
  }
}
