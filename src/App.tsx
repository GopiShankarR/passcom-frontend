import React, { useEffect } from 'react'
import TopBar from './components/TopBar'
import BusinessProfileForm from './components/BusinessProfileForm'
import ResultsPanel from './components/ResultsPanel'
import VizGraph from './components/VizGraph'
import RechartsSummary from './components/RechartsSummary'
import { useAppStore } from './store/useAppStore'
import { postEvaluate, getHealthStatus } from './lib/api'
import { uuidv4 } from './utils/uuid'
import { useQuerySync } from './hooks/useQuerySync'

export default function App() {
  useQuerySync()
  const profile = useAppStore(s => s.profile)
  const setResult = useAppStore(s => s.setResult)
  const setError = useAppStore(s => s.setError)
  const result = useAppStore(s => s.lastResult)
  const error = useAppStore(s => s.lastError)
  const submitting = useAppStore(s => s.submitting)
  const setSubmitting = useAppStore(s => s.setSubmitting)

  useEffect(() => {
    getHealthStatus().catch(() => {/* ignore */})
  }, [])

  const onSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const idk = uuidv4()
      const res = await postEvaluate(profile, idk)
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <main className="mx-auto max-w-7xl w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <BusinessProfileForm onSubmit={onSubmit} />
          {error && <div className="section-card border-red-200">
            <div className="text-sm text-red-700">Error: {error}</div>
          </div>}
        </div>

        <div className="space-y-4">
          <ResultsPanel result={result} />
          <RechartsSummary result={result} />
          <VizGraph result={result} />
        </div>
      </main>

      <footer className="mt-auto border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-gray-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} Passcom — Demo MVP</div>
          <div className="space-x-4">
            <button className="btn btn-ghost" onClick={() => window.print()}>Print to PDF</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
