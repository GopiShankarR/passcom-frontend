import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { encodeState, decodeState } from '../utils/share'
import type { BusinessProfile } from '../types/business'

export function useQuerySync() {
  const [params, setParams] = useSearchParams()
  const profile = useAppStore(s => s.profile)
  const setFullProfile = useAppStore(s => s.setFullProfile)

  // On load, hydrate from ?s=
  useEffect(() => {
    const s = params.get('s')
    if (s) {
      const parsed = decodeState<BusinessProfile>(s)
      if (parsed) setFullProfile(parsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When profile changes, push into ?s=
  useEffect(() => {
    const sEnc = encodeState(profile)
    const next = new URLSearchParams(params)
    next.set('s', sEnc)
    setParams(next, { replace: true })
  }, [profile, params, setParams])
}
