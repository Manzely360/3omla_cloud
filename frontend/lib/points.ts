const POINTS_KEY = '3omla_points'
const LAST_PLAY_KEY = '3omla_last_played'

const SAFE_WINDOW = typeof window !== 'undefined'

export function getPoints(): number {
  if (!SAFE_WINDOW) return 0
  const raw = window.localStorage.getItem(POINTS_KEY)
  const parsed = parseInt(raw || '0', 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function setPoints(value: number) {
  if (!SAFE_WINDOW) return
  const sanitized = Math.max(0, Math.floor(value))
  window.localStorage.setItem(POINTS_KEY, String(sanitized))
  window.dispatchEvent(new CustomEvent('3omla:points', { detail: sanitized }))
}

export function addPoints(amount: number): number {
  if (!SAFE_WINDOW) return 0
  const current = getPoints()
  const next = current + Math.max(0, Math.floor(amount))
  setPoints(next)
  return next
}

export function getLastPlayed(): number | null {
  if (!SAFE_WINDOW) return null
  const raw = window.localStorage.getItem(LAST_PLAY_KEY)
  const ts = raw ? parseInt(raw, 10) : NaN
  return Number.isFinite(ts) ? ts : null
}

export function recordPlay(timestamp = Date.now()) {
  if (!SAFE_WINDOW) return
  window.localStorage.setItem(LAST_PLAY_KEY, String(timestamp))
}

export function canPlayToday(): boolean {
  const last = getLastPlayed()
  if (!last) return true
  const elapsed = Date.now() - last
  return elapsed >= 24 * 60 * 60 * 1000
}

export function msUntilNextPlay(): number {
  const last = getLastPlayed()
  if (!last) return 0
  const elapsed = Date.now() - last
  const remaining = 24 * 60 * 60 * 1000 - elapsed
  return remaining > 0 ? remaining : 0
}
