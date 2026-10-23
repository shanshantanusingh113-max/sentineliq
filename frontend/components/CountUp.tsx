'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

interface Props {
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  delay?: number
  // when set, re-runs every time this key changes (used by the hero scoring loop)
  runKey?: string | number
  from?: number
}

// Counts from `from` to `to` once the element scrolls into view.
export default function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1.4, delay = 0, runKey, from = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: runKey === undefined, margin: '-40px' })
  const reduce = useReducedMotion()
  const [val, setVal] = useState(reduce ? to : from)
  const current = useRef(from)
  const started = useRef(false)

  useEffect(() => {
    if (!inView) return
    if (reduce) { setVal(to); current.current = to; return }
    // first run (or a keyed re-run) counts up from `from`; later value changes glide from the current number
    const start = runKey !== undefined || !started.current ? from : current.current
    started.current = true
    const controls = animate(start, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => { current.current = v; setVal(v) },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, duration, delay, reduce, runKey])

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  )
}
