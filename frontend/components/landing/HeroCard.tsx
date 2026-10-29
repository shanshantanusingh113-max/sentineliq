'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { C, IRIDESCENT, LABEL } from '@/lib/tokens'
import CountUp from '@/components/CountUp'

// Sample transactions the hero cycles through. Illustrative only - the dashboard uses live data.
const TXNS = [
  { id: 'TXN-8F21', holder: 'J. Sterling', dept: 'Treasury', pan: '0947', kind: 'Wire', amt: '$48,200', where: 'Lagos', at: '02:14', models: [0.81, 0.94, 0.88], score: 94 },
  { id: 'TXN-1C07', holder: 'A. Mehta', dept: 'Retail', pan: '3381', kind: 'POS', amt: '$62.40', where: 'Mumbai', at: '09:41', models: [0.06, 0.11, 0.07], score: 8 },
  { id: 'TXN-4A9E', holder: 'M. Lopez', dept: 'Operations', pan: '5216', kind: 'Export', amt: '12,480 rec', where: 'Core DB', at: '23:52', models: [0.74, 0.86, 0.79], score: 81 },
  { id: 'TXN-77B3', holder: 'R. Okafor', dept: 'Payments', pan: '7702', kind: 'ACH', amt: '$1,250', where: 'London', at: '10:03', models: [0.14, 0.09, 0.12], score: 12 },
]
const CYCLE_MS = 5200
const MODEL_NAMES = ['IF', 'LSTM', 'XGB']

function verdict(score: number) {
  if (score >= 65) return { text: 'Flagged', color: C.critical }
  if (score >= 40) return { text: 'Review', color: C.medium }
  return { text: 'Clear', color: C.low }
}

function CardFace({ holder, dept, pan }: { holder: string; dept: string; pan: string }) {
  const ink = C.onInk
  const small: React.CSSProperties = { display: 'block', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.65 }
  return (
    <div style={{ position: 'absolute', inset: 0, padding: 'clamp(18px, 2vw, 28px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: ink }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bank_Corp_01</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          <path d="M8.5 7.5a6 6 0 010 9" /><path d="M12 5a9.5 9.5 0 010 14" /><path d="M15.5 2.5a13 13 0 010 19" />
        </svg>
      </div>
      <svg viewBox="0 0 58 44" style={{ width: 'clamp(38px, 3.6vw, 52px)', height: 'auto' }} fill="none" stroke={ink} strokeWidth="1.3" aria-hidden="true">
        <rect x="0.65" y="0.65" width="56.7" height="42.7" rx="7" />
        <path d="M0.65 15h18M0.65 29h18M39.35 15h18M39.35 29h18M19 0.65v42.7M39 0.65v42.7M19 22h20" />
      </svg>
      <div>
        <AnimatePresence mode="wait">
          <motion.p
            key={pan}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}
            style={{ margin: '0 0 12px', fontFamily: 'var(--font-mono)', fontSize: 'clamp(15px, 1.6vw, 24px)', letterSpacing: '0.12em' }}
          >
            4532 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {pan}
          </motion.p>
        </AnimatePresence>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 15 }}>
          <div>
            <span style={small}>Cardholder</span>
            <AnimatePresence mode="wait">
              <motion.span key={holder} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                style={{ display: 'block', fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {holder} - {dept}
              </motion.span>
            </AnimatePresence>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={small}>Valid thru</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>09/29</span>
          </div>
        </div>
      </div>
      <div className="card-scan" />
      <div className="card-sheen" />
    </div>
  )
}

export default function HeroCard() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const t = TXNS[i]
  const v = verdict(t.score)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setI(n => (n + 1) % TXNS.length), CYCLE_MS)
    return () => window.clearInterval(id)
  }, [reduce])

  // pointer tilt
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 120, damping: 14 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 14 })

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => { mx.set(0); my.set(0) }

  const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} style={{ width: '100%', perspective: 1100 }}>
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 18 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div className="card-float" style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1.586 / 1', borderRadius: 18, overflow: 'hidden', background: IRIDESCENT }}>
            <CardFace holder={t.holder} dept={t.dept} pan={t.pan} />
          </div>
        </motion.div>
      </motion.div>

      {/* Live scoring panel - same width as the card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginTop: 30, border: `1px solid ${C.border}`, background: C.bg }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', borderBottom: `1px solid ${C.border}`, ...mono }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted }}>
            <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.low }} />
            Live scoring
          </span>
          <AnimatePresence mode="wait">
            <motion.span key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ color: C.textMuted }}>
              {t.id}
            </motion.span>
          </AnimatePresence>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 19, padding: '15px 15px 12px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.3 }}
              style={{ ...mono, color: C.textMuted, lineHeight: 1.7 }}>
              <div style={{ color: C.textPrimary }}>{t.kind} {t.amt}</div>
              <div>{t.at} - {t.where}</div>
            </motion.div>
          </AnimatePresence>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: 46, lineHeight: 0.8, letterSpacing: '0.013em', color: v.color, transition: 'color 0.4s' }}>
              <CountUp to={t.score} runKey={t.id} duration={1.1} />
            </span>
          </div>
        </div>

        {/* risk meter */}
        <div style={{ padding: '0 15px 15px' }}>
          <div style={{ position: 'relative', height: 2, background: C.border }}>
            <motion.div
              key={t.id}
              initial={{ width: 0 }} animate={{ width: `${t.score}%` }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: v.color }}
            />
            <div style={{ position: 'absolute', left: '65%', top: -4, width: 1, height: 10, background: C.textMuted }} />
          </div>
          <div style={{ position: 'relative', height: 14, marginTop: 6, ...mono, fontSize: 10, color: C.textFaint }}>
            <span style={{ position: 'absolute', left: 0 }}>0</span>
            <span style={{ position: 'absolute', left: '65%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Threshold 65</span>
            <span style={{ position: 'absolute', right: 0 }}>100</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 1.1fr', borderTop: `1px solid ${C.border}` }}>
          {t.models.map((m, k) => (
            <div key={MODEL_NAMES[k]} style={{ padding: '10px 15px', borderRight: `1px solid ${C.border}` }}>
              <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>{MODEL_NAMES[k]}</span>
              <div style={{ ...mono, color: C.textPrimary, marginTop: 4 }}>
                <CountUp to={m} decimals={2} runKey={t.id} duration={0.9} delay={0.1 * k} />
              </div>
            </div>
          ))}
          <div style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={t.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.9 }}
                style={{ ...LABEL, color: v.color, border: `1px solid ${v.color}`, borderRadius: 10, padding: '3px 10px' }}
              >
                {v.text}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
