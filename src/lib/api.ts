import { BusinessProfile, EvaluationResponse, HealthStatus } from '../types/business'

const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

const u = (path: string) => `${BASE}${path}`;

// export async function getHealthStatus(): Promise<HealthStatus> {
//   const res = await fetch(`${API_BASE}/api/health/status`)
//   if (!res.ok) throw new Error(`Status ${res.status}`)
//   return res.json()
// }

async function http<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 15000, ...opts } = init;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(u(path), { ...opts, signal: ctrl.signal });
    const text = await res.text();
    const body = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return body as T;
  } finally {
    clearTimeout(t);
  }
}

export const newIdempotencyKey = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** ---- API types from backend response ---- */
export interface EvaluateResponse {
  obligations: Array<{
    action: string;
    description: string;
    ruleId: string;     // e.g. federal:osha:recordkeeping
    ruleTitle: string;  // human label
  }>;
  hits: Array<{
    ruleId: string;
    title: string;
    why: any;           // JSONLogic object
  }>;
  derived: any;         // computed flags
}

export function getHealth() {
  return http<{ ok: boolean; version: string; ruleset: number }>("/api/health/status");
}

export function evaluateProfile(
  profile: BusinessProfile,
  opts: { idempotencyKey?: string; timeoutMs?: number } = {}
) {
  const key = opts.idempotencyKey ?? newIdempotencyKey();
  return http<EvaluateResponse>("/api/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(profile),
    timeoutMs: opts.timeoutMs ?? 20000,
  });
}