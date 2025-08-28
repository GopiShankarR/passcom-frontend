import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { EvaluationResponse } from '../types/business'
// import { jurisdictionFromRuleId } from '../utils/jurisdiction'
import { } from 'react'

function jurisdictionFromRuleId(ruleId: string): string {
  const lower = ruleId.toLowerCase()
  if (lower.startsWith('federal')) return 'Federal'
  if (lower.startsWith('state:')) return 'State'
  if (lower.startsWith('city:')) return 'City'
  return 'Unknown'
}

export default function RechartsSummary({ result }: { result: EvaluationResponse | null }) {
  const data = useMemo(() => {
    if (!result) return []
    const count: Record<string, number> = {}
    for (const o of result.obligations) {
      const j = jurisdictionFromRuleId(o.ruleId)
      count[j] = (count[j] || 0) + 1
    }
    return Object.entries(count).map(([name, value]) => ({ name, value }))
  }, [result])
  

  return (
    <div className="section-card">
      <div className="section-title mb-2">Obligations by Jurisdiction</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
