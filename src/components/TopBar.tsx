import React from 'react'
import { useAppStore } from '../store/useAppStore'

export default function TopBar() {
  const reset = useAppStore(s => s.reset)
  const profile = useAppStore(s => s.profile)

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Shareable link copied to clipboard!')
    } catch {
      alert('Copy failed. You can share the URL in your address bar.')
    }
  }

  return (
    <div className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-brand-600"></div>
          <div className="text-lg font-semibold">Passcom</div>
          <div className="hidden md:block text-sm text-gray-500">US Small‑Business Compliance</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={reset}>Reset</button>
          <button className="btn btn-primary" onClick={onShare}>Share link</button>
        </div>
      </div>
    </div>
  )
}
