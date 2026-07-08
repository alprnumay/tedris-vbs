import type { Request } from "express";
import { BCRYPT_ROUNDS } from "./bcryptConfig";

export type AuthTimingPayload = {
  route: string;
  totalMs: number;
  steps: Record<string, number>;
  bcryptRounds: number;
  status: number;
  email?: string;
};

export class AuthRequestTimer {
  private readonly t0 = performance.now();
  private readonly steps: Record<string, number> = {};

  mark(step: string): void {
    this.steps[step] = Math.round(performance.now() - this.t0);
  }

  finish(route: string, status: number, extra?: { email?: string }): AuthTimingPayload {
    const totalMs = Math.round(performance.now() - this.t0);
    return {
      route,
      totalMs,
      steps: { ...this.steps, responseReadyMs: totalMs },
      bcryptRounds: BCRYPT_ROUNDS,
      status,
      ...extra,
    };
  }
}

export function loadTestTimingRequested(req: Request): boolean {
  return req.headers["x-load-test-timing"] === "1";
}

export function logAuthTiming(payload: AuthTimingPayload): void {
  console.log(`[auth/timing] ${JSON.stringify(payload)}`);
}
