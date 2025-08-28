import React, { useMemo, useState } from 'react'
import type { EvaluationResponse, Obligation, Hit } from '../types/business'
import classNames from 'classnames'

function categorize(title: string): string {
  const t = (title || '').toLowerCase()
  if (/(wage|overtime|employee|osha|eeoc|i-9|form i-9|paid leave|workers' comp|workers comp|unemployment)/.test(t)) return 'Employment'
  if (/(privacy|ccpa|cpra|gdpr|hipaa|phi|ferpa|biometric|bipa|ssn|coppa|children)/.test(t)) return 'Privacy'
  if (/(sales tax|tax|withholding|nexus)/.test(t)) return 'Tax'
  if (/(alcohol|food|permit|license|health department)/.test(t)) return 'Licensing'
  return 'General'
}

function jurisdictionFromRuleId(ruleId: string): string {
  // Heuristic: "federal:*" | "state:XX:*" | "city:City,ST:*"
  const lower = ruleId.toLowerCase()
  if (lower.startsWith('federal')) return 'Federal'
  if (lower.startsWith('state:')) {
    const m = ruleId.split(':')[1]
    return `State (${m})`
  }
  if (lower.startsWith('city:')) return 'City'
  return 'Unknown'
}

/* ---- NEW: tiny helpers with NO hooks ---- */

// Extract "CA" from "State (CA)"; returns null if not a specific state chip.
const stateCodeFromLabel = (label: string): string | null => {
  const m = label.match(/^State\s+\(([A-Z]{2})\)$/)
  return m ? m[1] : null
}

// Narrow object-shaped derived facts to a selected state (e.g., CA).
function narrowDerivedByState(derived: Record<string, any> | undefined, selectedState: string | null) {
  if (!derived || !selectedState) return derived || {}

  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(derived)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const narrowed: Record<string, any> = {}
      for (const [mk, mv] of Object.entries(v)) {
        // Keys may be "CA" or "Los Angeles, CA" — extract state if present
        const keyState = mk.includes(',') ? mk.split(',').pop()!.trim() : mk
        if (keyState === selectedState) narrowed[mk] = mv
      }
      if (Object.keys(narrowed).length) out[k] = narrowed
    } else {
      // scalar/global fact — keep
      out[k] = v
    }
  }
  return out
}

export default function ResultsPanel({ result }: { result: EvaluationResponse | null }) {
  const [whyOpen, setWhyOpen] = useState<Record<string, boolean>>({})
  const [filterJur, setFilterJur] = useState<string>('All')
  const [filterCat, setFilterCat] = useState<string>('All')

  const groups = useMemo(() => {
    if (!result) return []
    const byJ: Record<string, Obligation[]> = {}
    for (const o of result.obligations) {
      const jur = jurisdictionFromRuleId(o.ruleId)
      byJ[jur] = byJ[jur] || []
      byJ[jur].push(o)
    }
    return Object.entries(byJ).map(([jur, list]) => ({ jur, list }))
  }, [result])

  const hitsMap = useMemo(() => {
    const m = new Map<string, Hit>()
    result?.hits.forEach(h => m.set(h.ruleId, h))
    return m
  }, [result])

  if (!result) return (
    <div className="section-card">
      <div className="text-sm text-gray-600">No results yet. Fill the form and click <b>Evaluate</b>.</div>
    </div>
  )

  const jurisdictions = ['All', ...groups.map(g => g.jur)]
  const allObligations = groups
    .flatMap(g => g.list)
    .map(o => ({
      ...o,
      jur: jurisdictionFromRuleId(o.ruleId),
      cat: categorize((o as any).ruleTitle ?? (o as any).title ?? '')
    }))
  const categories = ['All', ...Array.from(new Set(allObligations.map(o => o.cat)))]

  const filtered = allObligations.filter(
    o => (filterJur === 'All' || o.jur === filterJur) &&
         (filterCat === 'All' || o.cat === filterCat)
  )

  /* ---- NEW: compute derived-to-show without adding hooks ---- */
  const selectedState = stateCodeFromLabel(filterJur) // "CA" if "State (CA)" selected
  // If your backend returns object-shaped derived at result.derived, use that:
  const derivedObject = (result as any).derived as Record<string, any> | undefined
  const derivedToShow = derivedObject
    ? narrowDerivedByState(derivedObject, selectedState)
    // Fallback if your shape is string[] (derivedFacts): show only those that mention the state,
    // or global facts with no state-like token at all.
    : (() => {
        const facts = result.derived || []
        if (!selectedState) return { facts }
        const re = new RegExp(`\\b${selectedState}\\b`)
        return { facts: facts.filter(f => re.test(f) || !/[A-Z]{2}\\b/.test(f)) }
      })()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600">Filters:</span>
        {jurisdictions.map(j => (
          <button
            key={j}
            className={classNames('badge', j===filterJur ? 'bg-brand-50 border-brand-200 text-brand-800' : 'badge-muted')}
            onClick={() => setFilterJur(j)}
          >
            {j}
          </button>
        ))}
        <span className="mx-2 text-gray-300">|</span>
        {categories.map(c => (
          <button
            key={c}
            className={classNames('badge', c===filterCat ? 'bg-brand-50 border-brand-200 text-brand-800' : 'badge-muted')}
            onClick={() => setFilterCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="section-card">
        <div className="section-title mb-4">Obligations</div>
        <div className="space-y-3">
          {filtered.map(o => {
            const hit = hitsMap.get(o.ruleId)
            const open = !!whyOpen[o.ruleId]
            return (
              <div key={o.ruleId} className="border rounded-xl p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{(o as any).ruleTitle ?? (o as any).title ?? o.ruleId}</div>
                    <div className="text-sm text-gray-600">{(o as any).description ?? ''}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="badge badge-muted">{o.jur}</span>
                      <span className="badge badge-muted">{categorize((o as any).ruleTitle ?? (o as any).title ?? '')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText((o as any).action ?? '')}>Copy action</button>
                    <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText((o as any).description ?? '')}>Copy description</button>
                    <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(o.ruleId)}>Copy rule ID</button>
                    <button className="btn btn-primary" onClick={() => setWhyOpen(prev => ({...prev, [o.ruleId]: !open}))}>{open ? 'Hide why' : 'Why?'}</button>
                  </div>
                </div>
                {open && hit && (
                  <pre className="mt-3 bg-gray-50 border rounded-lg p-3 overflow-auto text-xs">{JSON.stringify(hit.why, null, 2)}</pre>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="section-card">
        <div className="section-title mb-2">Derived facts</div>
        <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(derivedToShow || {}).map(([k, v]) => {
            const isObj = v !== null && typeof v === 'object'
            return (
              <div
                key={k}
                className="border rounded-lg px-3 py-2 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-gray-700 font-medium">{k}</div>
                  <button
                    className="badge badge-muted"
                    onClick={() => navigator.clipboard.writeText(isObj ? JSON.stringify(v, null, 2) : String(v))}
                    title="Copy value"
                  >
                    Copy
                  </button>
                </div>

                {isObj ? (
                  <pre className="font-mono text-xs text-gray-900 bg-gray-50 border rounded-md p-2 whitespace-pre-wrap break-words overflow-auto max-h-40">
                    {JSON.stringify(v, null, 2)}
                  </pre>
                ) : (
                  <div className="font-mono text-gray-900 break-words">{String(v)}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
