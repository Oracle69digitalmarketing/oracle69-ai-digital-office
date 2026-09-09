import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { CredentialManager } from "../credential-manager.js";
import { PrismaClient } from "@prisma/client";

const ORIGINAL_ENV = process.env.ENCRYPTION_KEY;

function makeManager(): CredentialManager {
  const prisma = {} as unknown as PrismaClient;
  // @ts-ignore
  return new CredentialManager(prisma);
}

describe("CredentialManager (SEC-6 secure credential encryption)", () => {
  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = ORIGINAL_ENV;
    }
  });

  it("throws if ENCRYPTION_KEY is missing", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => makeManager()).toThrow(/ENCRYPTION_KEY is required/);
  });

  it("throws if a placeholder ENCRYPTION_KEY is used (no fallback)", () => {
    process.env.ENCRYPTION_KEY = "default-secret-key";
    expect(() => makeManager()).toThrow(/must not use a placeholder/);
  });

  it("encrypt/decrypt round trip", () => {
    process.env.ENCRYPTION_KEY = "a-very-strong-random-secret-key-for-tests-1234567890";
    const manager = makeManager();
    const cipher = (manager as any).encrypt("super-secret-token");
    const plain = (manager as any).decrypt(cipher);
    expect(plain).toBe("super-secret-token");
  });

  it("produces different ciphertext for the same plaintext (fresh nonce)", () => {
    process.env.ENCRYPTION_KEY = "a-very-strong-random-secret-key-for-tests-1234567890";
    const manager = makeManager();
    const a = (manager as any).encrypt("same-plaintext");
    const b = (manager as any).encrypt("same-plaintext");
    expect(a).not.toBe(b);
  });

  it("tampered ciphertext fails decryption (does not return attacker plaintext)", () => {
    process.env.ENCRYPTION_KEY = "a-very-strong-random-secret-key-for-tests-1234567890";
    const manager = makeManager();
    const cipher = (manager as any).encrypt("sensitive-value");
    const blob = JSON.parse(cipher);
    blob.data = blob.data.slice(0, -2) + (blob.data.endsWith("ff") ? "00" : "ff");
    expect(() => (manager as any).decrypt(JSON.stringify(blob))).toThrow(/tampered/);
  });

  it("incorrect auth tag fails decryption", () => {
    process.env.ENCRYPTION_KEY = "a-very-strong-random-secret-key-for-tests-1234567890";
    const manager = makeManager();
    const cipher = (manager as any).encrypt("sensitive-value");
    const blob = JSON.parse(cipher);
    blob.tag = "00".repeat(16);
    expect(() => (manager as any).decrypt(JSON.stringify(blob))).toThrow();
  });

  it("malformed ciphertext fails decryption", () => {
    process.env.ENCRYPTION_KEY = "a-very-strong-random-secret-key-for-tests-1234567890";
    const manager = makeManager();
    expect(() => (manager as any).decrypt("not-json")).toThrow();
    expect(() => (manager as any).decrypt(":legacy-colon-format")).toThrow();
  });

  it("legacy colon-format ciphertext is not returned as plaintext", () => {
    process.env.ENCRYPTION_KEY = "a-very-strong-random-secret-key-for-tests-1234567890";
    const manager = makeManager();
    expect(() => (manager as any).decrypt("someivhex:somecipherhex")).toThrow();
  });

  it("uses AES-256-GCM authenticated encryption", () => {
    process.env.ENCRYPTION_KEY = "a-very-strong-random-secret-key-for-tests-1234567890";
    const manager = makeManager();
    const cipher = (manager as any).encrypt("x");
    const blob = JSON.parse(cipher);
    expect(blob.algo).toBe("aes-256-gcm");
    expect(blob.tag).toBeDefined();
    expect(blob.iv).toBeDefined();
    expect(blob.iv.length).toBeGreaterThan(0);
  });
});
