import { BusinessProfile } from '../types/business'

const BASE = (import.meta.env.VITE_API_BASE ?? '').trim()
const u = (path: string) => `${BASE}${path}`

// ---------- HTTP helper with abort reasons + external signal ----------
type HttpInit = RequestInit & {
  timeoutMs?: number
  signal?: AbortSignal
}

function timeoutReason() {
  // DOMException isn't guaranteed in all runtimes
  try { return new DOMException('Timeout', 'TimeoutError') } catch {
    const e = new Error('Timeout'); (e as any).name = 'TimeoutError'; return e
  }
}
function abortReason() {
  try { return new DOMException('Aborted', 'AbortError') } catch {
    const e = new Error('Aborted'); (e as any).name = 'AbortError'; return e
  }
}

async function http<T>(path: string, init: HttpInit = {}): Promise<T> {
  const { timeoutMs = 30000, signal: externalSignal, ...opts } = init

  const local = new AbortController()
  let timer: any = null

  // Forward external aborts (preserve original reason if present)
  if (externalSignal) {
    const fwd = () =>
      local.abort((externalSignal as any).reason ?? abortReason())
    if (externalSignal.aborted) fwd()
    else externalSignal.addEventListener('abort', fwd, { once: true })
  }

  // Timeout -> abort with clear reason
  if (timeoutMs > 0) {
    timer = setTimeout(() => local.abort(timeoutReason()), timeoutMs)
  }

  try {
    const res = await fetch(u(path), { ...opts, signal: local.signal })
    const text = await res.text()
    const body = text ? JSON.parse(text) : undefined
    if (!res.ok) {
      const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`
      throw new Error(msg)
    }
    return body as T
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// Useful if you want to ignore aborts/timeouts at call sites
export const isAbortLike = (err: any) =>
  err?.name === 'AbortError' || err?.name === 'TimeoutError'

// ---------- Types from backend ----------
export interface EvaluateResponse {
  obligations: Array<{
    action: string
    description: string
    ruleId: string     // e.g. federal:osha:recordkeeping
    ruleTitle: string  // human label
  }>
  hits: Array<{
    ruleId: string
    title: string
    why: any           // JSONLogic object
  }>
  derived: any         // computed flags
}

export const newIdempotencyKey = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

// ---------- API wrappers ----------
export function getHealth() {
  return http<{ ok: boolean; version: string; ruleset: number }>('/api/health/status')
}

export function evaluateProfile(
  profile: BusinessProfile,
  opts: { idempotencyKey?: string; timeoutMs?: number; signal?: AbortSignal } = {}
) {
  const key = opts.idempotencyKey ?? newIdempotencyKey()
  return http<EvaluateResponse>('/api/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify(profile),
    timeoutMs: opts.timeoutMs ?? 20000,
    signal: opts.signal,            // <— callers may cancel safely
  })
}

export const postEvaluate = evaluateProfile
export const getHealthStatus = getHealth
