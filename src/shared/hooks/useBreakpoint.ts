import { useState, useEffect } from 'react'

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
    setMatches(query.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [breakpoint])

  return matches
}
