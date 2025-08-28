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
    <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/pass_com_logo.jpeg"        // <-- correct path from /public
            alt="Passcom logo"
            className="h-7 w-7 rounded-xl object-cover"
            width={28}
            height={28}
            loading="eager"
            decoding="async"
          />
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold">Passcom</div>
            <div className="hidden md:block text-sm text-gray-500">US Small-Business Compliance</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={onShare}>Share</button>
          <button className="btn btn-ghost" onClick={reset}>Reset</button>
        </div>
      </div>
    </header>
  )
}
