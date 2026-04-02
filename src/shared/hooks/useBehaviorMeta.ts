import { useRef, useEffect } from 'react'

export function useBehaviorMeta() {
  const tabBlurCount = useRef(0)
  const sessionStart = useRef(Date.now())
  const questionStart = useRef(Date.now())
  const questionTimes = useRef<Record<string, number>>({})

  useEffect(() => {
    const onBlur = () => { tabBlurCount.current++ }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  // Call when leaving a question to record time spent on it
  const trackQuestionTime = (questionId: string) => {
    const elapsed = Date.now() - questionStart.current
    questionTimes.current[questionId] = (questionTimes.current[questionId] ?? 0) + elapsed
    questionStart.current = Date.now()
  }

  // Call on submit to collect full meta payload
  const collect = () => ({
    tab_blur_count: tabBlurCount.current,
    total_duration_ms: Date.now() - sessionStart.current,
    question_times: { ...questionTimes.current },
    device: {
      user_agent: navigator.userAgent.slice(0, 150),
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      color_depth: screen.colorDepth,
    },
  })

  return { collect, trackQuestionTime }
}
