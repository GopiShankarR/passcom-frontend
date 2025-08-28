export function encodeState(obj: any): string {
  const json = JSON.stringify(obj)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64
}

export function decodeState<T = any>(b64: string): T | null {
  try {
    const json = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
