import { useCallback, useEffect, useState } from 'react'

const STORAGE_NAMESPACE = 'cryptologist:gate:'

type GateState = 'locked' | 'fresh'

interface FeatureGateOptions {
  bypass?: boolean
}

export function useFeatureGate(featureKey: string, options?: FeatureGateOptions) {
  const bypass = options?.bypass ?? false
  const storageKey = `${STORAGE_NAMESPACE}${featureKey}`
  const [state, setState] = useState<GateState>('fresh')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (bypass) {
      window.localStorage.removeItem(storageKey)
      setState('fresh')
      return
    }
    const existing = window.localStorage.getItem(storageKey)
    if (existing === 'locked') {
      setState('locked')
    }
  }, [storageKey, bypass])

  const consume = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (bypass) {
      return true
    }
    if (state === 'locked') {
      return false
    }
    window.localStorage.setItem(storageKey, 'locked')
    setState('locked')
    return true
  }, [state, storageKey, bypass])

  return {
    locked: bypass ? false : state === 'locked',
    consume,
  }
}
