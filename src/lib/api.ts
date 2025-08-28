import { BusinessProfile, EvaluationResponse, HealthStatus } from '../types/business'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function getHealthStatus(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/api/health/status`)
  if (!res.ok) throw new Error(`Status ${res.status}`)
  return res.json()
}

export async function postEvaluate(profile: BusinessProfile, idempotencyKey: string): Promise<EvaluationResponse> {
  const res = await fetch(`${API_BASE}/api/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(profile)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Status ${res.status}`)
  }
  return res.json()
}
