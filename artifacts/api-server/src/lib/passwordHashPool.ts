import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

type PendingTask = {
  resolve: (value: boolean | string) => void;
  reject: (reason?: unknown) => void;
  type: "compare" | "hash";
};

let pool: BcryptWorkerPool | null = null;

class BcryptWorkerPool {
  private readonly workers: Worker[] = [];
  private readonly available = new Set<Worker>();
  private readonly pendingByWorker = new Map<Worker, PendingTask>();
  private readonly queue: Array<{
    workerTask: { type: "compare" | "hash"; password: string; hash?: string; rounds?: number };
    pending: PendingTask;
  }> = [];
  private nextId = 1;

  constructor(private readonly workerPath: string, size: number) {
    for (let i = 0; i < size; i += 1) {
      const worker = new Worker(workerPath, { type: "module" });
      worker.on("message", (msg: { id: number; ok: boolean; result?: boolean | string; error?: string }) => {
        const pending = this.pendingByWorker.get(worker);
        this.pendingByWorker.delete(worker);
        this.available.add(worker);
        if (!pending) {
          this.pump();
          return;
        }
        if (msg.ok) pending.resolve(msg.result as boolean | string);
        else pending.reject(new Error(msg.error || "bcrypt worker failed"));
        this.pump();
      });
      worker.on("error", (err) => {
        const pending = this.pendingByWorker.get(worker);
        if (pending) {
          this.pendingByWorker.delete(worker);
          pending.reject(err);
        }
        this.available.add(worker);
        this.pump();
      });
      this.workers.push(worker);
      this.available.add(worker);
    }
  }

  private pump(): void {
    while (this.queue.length > 0 && this.available.size > 0) {
      const worker = this.available.values().next().value as Worker;
      this.available.delete(worker);
      const item = this.queue.shift();
      if (!item) {
        this.available.add(worker);
        return;
      }
      this.pendingByWorker.set(worker, item.pending);
      worker.postMessage({ id: this.nextId++, ...item.workerTask });
    }
  }

  run(task: { type: "compare" | "hash"; password: string; hash?: string; rounds?: number }): Promise<boolean | string> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        workerTask: task,
        pending: { resolve, reject, type: task.type },
      });
      this.pump();
    });
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}

function workerPoolSize(): number {
  const fromEnv = Number(process.env.BCRYPT_WORKER_POOL_SIZE || 0);
  if (Number.isFinite(fromEnv) && fromEnv >= 1) return Math.min(8, Math.floor(fromEnv));
  return Math.min(4, Math.max(2, os.cpus().length || 2));
}

function resolveWorkerPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "bcryptWorker.mjs");
}

function getPool(): BcryptWorkerPool {
  if (!pool) {
    pool = new BcryptWorkerPool(resolveWorkerPath(), workerPoolSize());
  }
  return pool;
}

export async function poolComparePassword(password: string, hash: string): Promise<boolean> {
  return getPool().run({ type: "compare", password, hash }) as Promise<boolean>;
}

export async function poolHashPassword(password: string, rounds: number): Promise<string> {
  return getPool().run({ type: "hash", password, rounds }) as Promise<string>;
}

export function passwordPoolSize(): number {
  return workerPoolSize();
}
