import { parentPort } from "node:worker_threads";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** @type {{ compare: (p: string, h: string) => Promise<boolean>; hash: (p: string, r: number) => Promise<string> }} */
let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch {
  bcrypt = require("bcryptjs");
}

parentPort?.on("message", async (msg) => {
  const { id, type, password, hash, rounds } = msg ?? {};
  try {
    if (type === "compare") {
      const result = await bcrypt.compare(password, hash);
      parentPort?.postMessage({ id, ok: true, result });
      return;
    }
    if (type === "hash") {
      const result = await bcrypt.hash(password, rounds);
      parentPort?.postMessage({ id, ok: true, result });
      return;
    }
    parentPort?.postMessage({ id, ok: false, error: "unknown task" });
  } catch (error) {
    parentPort?.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
