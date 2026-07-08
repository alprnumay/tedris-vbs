import bcryptjs from "bcryptjs";
import { createRequire } from "node:module";
import { BCRYPT_ROUNDS } from "./bcryptConfig";
import { poolComparePassword, poolHashPassword, passwordPoolSize } from "./passwordHashPool";

type BcryptImpl = {
  hash(password: string, rounds: number): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
  getRounds?(hash: string): number;
};

const require = createRequire(import.meta.url);

let impl: BcryptImpl | null = null;
let implLabel: "bcrypt-native" | "bcryptjs" = "bcryptjs";
let useWorkerPool = process.env.BCRYPT_USE_WORKER_POOL !== "0";

function resolveImpl(): BcryptImpl {
  if (impl) return impl;
  try {
    const native = require("bcrypt") as BcryptImpl;
    impl = native;
    implLabel = "bcrypt-native";
    return native;
  } catch {
    impl = bcryptjs;
    implLabel = "bcryptjs";
    return bcryptjs;
  }
}

export function passwordHashEngine(): "bcrypt-native" | "bcryptjs" {
  resolveImpl();
  return implLabel;
}

export function getPasswordHashRounds(hash: string): number {
  const native = resolveImpl();
  if (typeof native.getRounds === "function") {
    try {
      return native.getRounds(hash);
    } catch {
      /* fall through */
    }
  }
  const parts = hash.split("$");
  const rounds = Number(parts[2]);
  return Number.isFinite(rounds) ? rounds : BCRYPT_ROUNDS;
}

export function shouldUpgradePasswordHash(hash: string): boolean {
  return getPasswordHashRounds(hash) > BCRYPT_ROUNDS;
}

export async function hashPassword(password: string): Promise<string> {
  if (useWorkerPool) {
    return poolHashPassword(password, BCRYPT_ROUNDS);
  }
  return resolveImpl().hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (useWorkerPool) {
    return poolComparePassword(password, hash);
  }
  return resolveImpl().compare(password, hash);
}

export { BCRYPT_ROUNDS, passwordPoolSize };
