'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useSpring, useTransform, type Variants } from 'framer-motion'
import { C, LABEL } from '@/lib/tokens'
import Logo from '@/components/Logo'
import HeroCard from '@/components/landing/HeroCard'
import CountUp from '@/components/CountUp'

/* Layout: every section sits on one 12-column grid (.g12, 19px gutter) inside a 1400px column.
   Shared column starts - 1 (labels / headings), 7 (supporting copy) - line up down the page. */
const EASE = [0.16, 1, 0.3, 1] as const

const reveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const HEADLINE = ['Insider', 'threats,', 'caught before', 'the damage.']

const STATS = [
  { to: 19.5, decimals: 1, prefix: '$', suffix: 'M', unit: 'Per year', label: 'Average insider risk cost per organisation (Ponemon, 2026)' },
  { to: 67, decimals: 0, prefix: '', suffix: '', unit: 'Days', label: 'Average time to contain an insider incident (Ponemon, 2026)' },
  { to: 0.4, decimals: 1, prefix: '', suffix: '%', unit: 'FP rate', label: 'False positive rate on the 3-model ensemble' },
]

const STACK = [
  'Isolation Forest', 'LSTM Autoencoder', 'XGBoost', 'SHAP', 'PyTorch',
  'scikit-learn', 'FastAPI', 'Next.js', 'SQLite WAL', 'MITRE ATT&CK',
]

const SHAP_MOCK = [
  { feature: 'transaction_velocity_ratio', value: 28.4, positive: true },
  { feature: 'off_hours_ratio', value: 19.2, positive: true },
  { feature: 'access_entropy', value: 14.1, positive: true },
  { feature: 'login_hour_deviation', value: 9.3, positive: true },
  { feature: 'download_volume_zscore', value: 6.2, positive: false },
]

const CAPABILITIES = [
  { n: '01', title: 'Per-user baselines', tag: 'Behaviour', visual: 'baseline' as const,
    desc: 'Each employee is scored against their own 30-day history, not a generic role profile. Off-hours logins, download volumes and cross-department queries are measured against what that user actually does.' },
  { n: '02', title: 'Ensemble scoring', tag: 'Models', visual: 'ensemble' as const,
    desc: 'Isolation Forest, an LSTM Autoencoder and XGBoost score every event in parallel. When the models disagree, the disagreement itself is surfaced to the analyst next to the final risk score.' },
  { n: '03', title: 'Explainable alerts', tag: 'SHAP', visual: 'shap' as const,
    desc: 'Every alert ships with feature attribution. Analysts see which behavioural signals drove the score and by how much, measured against the user\'s own baseline.' },
  { n: '04', title: 'Investigator view', tag: 'Casework', visual: 'case' as const,
    desc: 'One click opens the full evidence package: risk score, SHAP explanation, 30 days of history, peer comparison against same-role employees and every linked prior incident.' },
]

const WORKFLOW = [
  { n: '01', title: 'Detect', desc: 'Every action is encoded into 8 rolling-window features and scored by all three models. The ensemble returns a 0-100 risk score within milliseconds.' },
  { n: '02', title: 'Surface', desc: 'When the score breaches threshold, an alert lands on the queue with a one-line summary: who, what event, and how risky.' },
  { n: '03', title: 'Explain', desc: 'The case view shows 30-day risk history, SHAP attribution, individual model scores and peer comparison against same-role staff.' },
  { n: '04', title: 'Decide', desc: 'Resolve or escalate in one action. Every analyst label feeds active learning, so XGBoost improves with each decision.' },
]

const ENVIRONMENTS = [
  { title: 'Banking and fintech', tags: ['Off-hours core banking access', 'Bulk customer record downloads', 'Transaction velocity spikes'],
    desc: 'Tellers, treasury desks and payment operators hold access that can move money in a single action. Every transaction burst, cross-desk query and bulk export is scored against that employee\'s own baseline.' },
  { title: 'Privileged IT and admin', tags: ['Privilege escalation', 'Account modification', 'Device and location anomalies'],
    desc: 'Admins and service accounts are the highest-value target for insider abuse. Privilege escalation, account tampering and unusual device or location changes are flagged the moment they happen.' },
  { title: 'Compliance and audit', tags: ['T1078 Valid Accounts', 'T1530 Data from Cloud Storage', 'T1087 Account Discovery'],
    desc: 'Every alert maps to a MITRE ATT&CK technique. Case files carry the full event chain, SHAP evidence and analyst labels, packaged for regulator or internal audit handoff.' },
  { title: 'Security operations', tags: ['Ensemble-scored alerts', 'JSON evidence export', 'Kill-chain case clustering'],
    desc: 'Alerts arrive pre-explained with risk score, top SHAP drivers, behavioural history and peer comparison. Analysts triage in seconds instead of hours of manual correlation.' },
]

const GITHUB = 'https://github.com/TeamSigmoidIdea20/sentineliq'

/* ------------------------------------------------------------------ */

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ ...LABEL, margin: 0, ...style }}>{children}</p>
}

// Index label + title on a hairline that draws itself in from the left.
function SectionHead({ index, label, right }: { index: string; label: string; right?: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      className="g12" style={{ position: 'relative', alignItems: 'center', paddingTop: 15, marginBottom: 76 }}
    >
      <motion.span
        aria-hidden="true"
        variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 1.1, ease: EASE } } }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.border, transformOrigin: 'left' }}
      />
      <motion.div variants={reveal} className="sh-index" style={{ gridColumn: '1 / 2' }}><Label>({index})</Label></motion.div>
      <motion.div variants={reveal} className="sh-label" style={{ gridColumn: '2 / 7' }}><Label style={{ color: C.textPrimary }}>{label}</Label></motion.div>
      {right && <motion.div variants={reveal} style={{ gridColumn: '7 / 13', justifySelf: 'end' }}>{right}</motion.div>}
    </motion.div>
  )
}

// Display heading that rises in line by line behind a mask.
function MaskLines({ lines, delay = 0, inView = false, as = 'h2', style }: { lines: string[]; delay?: number; inView?: boolean; as?: 'h1' | 'h2'; style?: React.CSSProperties }) {
  const Tag = as
  return (
    <Tag style={{ margin: 0, fontWeight: 400, lineHeight: 0.8, letterSpacing: '0.013em', textTransform: 'uppercase', ...style }}>
      {lines.map((line, i) => (
        <span key={line} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.05em' }}>
          <motion.span
            style={{ display: 'block' }}
            initial={{ y: '105%' }}
            {...(inView
              ? { whileInView: { y: 0 }, viewport: { once: true, margin: '-60px' } }
              : { animate: { y: 0 } })}
            transition={{ duration: 0.95, delay: delay + i * 0.08, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

function CapabilityVisual({ kind }: { kind: 'baseline' | 'ensemble' | 'shap' | 'case' }) {
  const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 11, color: C.textMuted }

  if (kind === 'baseline') {
    const rows = [
      { label: 'login_hour', base: 34, now: 88 },
      { label: 'download_mb', base: 22, now: 61 },
      { label: 'dept_access', base: 40, now: 46 },
    ]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 19 }}>
        {rows.map(r => (
          <div key={r.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={mono}>{r.label}</span>
              <span style={{ ...mono, color: r.now > 60 ? C.critical : C.textPrimary }}>{r.now}</span>
            </div>
            <div style={{ position: 'relative', height: 2, background: C.border }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.base}%`, background: C.textMuted }} />
              <div style={{ position: 'absolute', left: `${r.now}%`, top: -5, width: 1, height: 12, background: r.now > 60 ? C.critical : C.textPrimary }} />
            </div>
          </div>
        ))}
        <span style={{ ...mono, fontSize: 10 }}>bar = 30-day baseline   tick = current event</span>
      </div>
    )
  }

  if (kind === 'ensemble') {
    const bars = [{ m: 'IF', v: 81 }, { m: 'LSTM', v: 94 }, { m: 'XGB', v: 88 }]
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 19, height: 150 }}>
        {bars.map(b => (
          <div key={b.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: 8 }}>
            <span style={{ ...mono, color: C.textPrimary }}>{b.v}</span>
            <div style={{ height: 96, display: 'flex', alignItems: 'flex-end' }}>
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${b.v}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%', border: `1px solid ${C.textPrimary}`, background: b.v >= 90 ? C.textPrimary : 'transparent' }}
              />
            </div>
            <span style={mono}>{b.m}</span>
          </div>
        ))}
        <div style={{ width: 1, alignSelf: 'stretch', background: C.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
          <span style={{ ...LABEL, fontSize: 10 }}>Ensemble</span>
          <span style={{ fontSize: 70, lineHeight: 0.8, color: C.critical, letterSpacing: '0.013em', marginTop: 8 }}>88</span>
        </div>
      </div>
    )
  }

  if (kind === 'shap') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {SHAP_MOCK.map(s => (
          <div key={s.feature} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 1fr 44px', alignItems: 'center', gap: 15 }}>
            <span style={{ ...mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.feature}</span>
            <div style={{ height: 2, background: C.border }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min((s.value / 30) * 100, 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: s.positive ? C.textPrimary : C.textMuted }}
              />
            </div>
            <span style={{ ...mono, color: s.positive ? C.textPrimary : C.textMuted, textAlign: 'right' }}>{s.positive ? '+' : '-'}{s.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ margin: -30 }}>
      <div style={{ padding: '15px 19px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15 }}>
        <div>
          <span style={{ ...LABEL, color: C.critical }}>Critical</span>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: C.textPrimary }}>Bulk data export</p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>J. Sterling - Treasury - 2m ago</p>
        </div>
        <span style={{ fontSize: 46, lineHeight: 0.8, color: C.critical }}>94</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[['IF', '0.81'], ['LSTM', '0.94'], ['XGB', '0.88']].map(([m, v], i) => (
          <div key={m} style={{ padding: '15px 19px', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <span style={{ ...LABEL, fontSize: 10 }}>{m}</span>
            <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-mono)', fontSize: 15, color: C.textPrimary }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}


const TAPE = [
  { id: 'TXN-8F21', kind: 'Wire', amt: '$48,200.00', who: 'J. Sterling', where: 'Lagos', at: '02:14', score: 94 },
  { id: 'TXN-1C07', kind: 'POS', amt: '$62.40', who: 'A. Mehta', where: 'Mumbai', at: '09:41', score: 8 },
  { id: 'TXN-4A9E', kind: 'Export', amt: '12,480 records', who: 'M. Lopez', where: 'Core DB', at: '23:52', score: 81 },
  { id: 'TXN-77B3', kind: 'ACH', amt: '$1,250.00', who: 'R. Okafor', where: 'London', at: '10:03', score: 12 },
  { id: 'TXN-2D5C', kind: 'Role grant', amt: 'treasury_admin', who: 'K. Hayes', where: 'IAM', at: '01:27', score: 88 },
  { id: 'TXN-90F1', kind: 'Card', amt: '$318.99', who: 'L. Chen', where: 'Singapore', at: '14:16', score: 6 },
  { id: 'TXN-6E44', kind: 'Velocity', amt: '41 tx / 5 min', who: 'A. Kapoor', where: 'Branch 12', at: '11:58', score: 72 },
  { id: 'TXN-3B18', kind: 'Wire', amt: '$9,900.00', who: 'S. Novak', where: 'Zurich', at: '16:22', score: 19 },
]

function TransactionTape() {
  const rows = [...TAPE, ...TAPE]
  return (
    <div aria-hidden="true" style={{ position: 'relative', flexShrink: 0, borderTop: `1px solid ${C.border}`, overflow: 'hidden', height: 46, display: 'flex', alignItems: 'center', background: C.bg }}>
      <div className="tape-track" style={{ display: 'flex', whiteSpace: 'nowrap' }}>
        {rows.map((t, i) => {
          const flagged = t.score >= 65
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 15, padding: '0 30px', borderRight: `1px solid ${C.border}`, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: flagged ? C.textPrimary : C.textMuted }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: flagged ? C.critical : C.textFaint, flexShrink: 0 }} />
              <span>{t.id}</span>
              <span style={{ color: C.textMuted }}>{t.at}</span>
              <span>{t.kind}</span>
              <span>{t.amt}</span>
              <span style={{ color: C.textMuted }}>{t.who} - {t.where}</span>
              <span style={{ color: flagged ? C.critical : C.textFaint }}>{flagged ? `Flagged ${t.score}` : `Clear ${String(t.score).padStart(2, '0')}`}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}


/* ------------------------------------------------------------------ */

function Workflow() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 55%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  const step = useTransform(progress, v => Math.min(3, Math.floor(v * 4.2)))
  const [active, setActive] = useState(-1)
  useEffect(() => step.on('change', v => setActive(v)), [step])

  return (
    <div ref={ref} className="g12 steps-grid" style={{ position: 'relative', paddingTop: 30 }}>
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.border }} />
      <motion.div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.textPrimary, scaleX: progress, transformOrigin: 'left' }} />
      {WORKFLOW.map((s, i) => {
        const on = active >= i
        return (
          <div key={s.n} className="step" style={{ gridColumn: `${i * 3 + 1} / span 3`, position: 'relative', paddingRight: 19 }}>
            <span aria-hidden="true" className="step-dot" style={{ position: 'absolute', left: 0, top: -34, width: 7, height: 7, background: on ? C.textPrimary : C.bg, border: `1px solid ${on ? C.textPrimary : C.borderStrong}`, transition: 'all 0.4s' }} />
            <span style={{ display: 'block', fontSize: 76, lineHeight: 0.8, letterSpacing: '0.013em', color: on ? C.textPrimary : C.textFaint, transition: 'color 0.5s' }}>{s.n}</span>
            <p style={{ margin: '76px 0 15px', fontSize: 34, lineHeight: 1, letterSpacing: '0.006em', textTransform: 'uppercase' }}>{s.title}</p>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, color: C.textMuted, maxWidth: 300 }}>{s.desc}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: C.bg, color: C.textPrimary, minHeight: '100vh', overflowX: 'clip' }}>

      {/* Scroll progress */}
      <motion.div aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 1, background: C.textPrimary, scaleX: bar, transformOrigin: 'left', zIndex: 60 }} />

      {/* ── Top bar ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(10,10,9,0.86)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        transition: 'background-color 0.3s, border-color 0.3s',
      }}>
        <div className="wrap g12 keep" style={{ height: 76, alignItems: 'center' }}>
          <Link href="/" aria-label="SentinelIQ home" style={{ gridColumn: '1 / 4', textDecoration: 'none' }}>
            <Logo />
          </Link>
          <nav className="hide-md" style={{ gridColumn: '7 / 11', display: 'flex', gap: 30 }}>
            {[['Capabilities', '#capabilities'], ['Workflow', '#workflow'], ['Coverage', '#coverage']].map(([label, href]) => (
              <a key={href} href={href} className="landing-nav-link" style={{ ...LABEL, color: C.textMuted }}>{label}</a>
            ))}
          </nav>
          <div style={{ gridColumn: '11 / 13', justifySelf: 'end' }}>
            <Link href="/dashboard" className="ghost-pill">Live demo <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
        <div className="wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 140, paddingBottom: 46 }}>
          <div className="g12" style={{ alignItems: 'end', rowGap: 46 }}>
            <div className="hero-copy-col" style={{ gridColumn: '1 / 9', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="g12 keep hero-label" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', marginBottom: 46, paddingTop: 4 }}>
                <Label>(00)</Label>
                <Label style={{ gridColumn: '2 / 9', color: C.textPrimary }}>AI-driven insider threat detection</Label>
              </motion.div>
              <div className="hero-h1"><MaskLines as="h1" lines={HEADLINE} delay={0.1} style={{ fontSize: 'clamp(44px, 6.1vw, 92px)', whiteSpace: 'nowrap', marginBottom: -6 }} /></div>
            </div>
            <div className="hero-card-col" style={{ gridColumn: '9 / 13' }}>
              <HeroCard />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
            className="g12" style={{ position: 'relative', marginTop: 76, paddingTop: 19 }}
          >
            <motion.span aria-hidden="true" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, delay: 0.6, ease: EASE }}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.border, transformOrigin: 'left' }} />
            <div style={{ gridColumn: '1 / 7' }}>
              <Label>Banks and fintech - flagship use case</Label>
            </div>
            <p style={{ gridColumn: '7 / 12', margin: 0, fontSize: 15, lineHeight: 1.4, color: C.textMuted }}>
              A behavioural fingerprint for every privileged user, scored in real time by a 3-model ensemble. Deviations reach the security team in seconds.
            </p>
            <div className="hide-md" style={{ gridColumn: '12 / 13', justifySelf: 'end', alignSelf: 'end', ...LABEL, color: C.textPrimary, opacity: scrolled ? 0 : 1, transition: 'opacity 0.3s', whiteSpace: 'nowrap' }}>
              Scroll <span className="scroll-arrow" aria-hidden="true">↓</span>
            </div>
          </motion.div>
        </div>
        <TransactionTape />
      </section>

      {/* ── About ── */}
      <section style={{ padding: '119px 0 76px' }}>
        <div className="wrap">
          <SectionHead index="01" label="About the platform" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="g12">
            <motion.div variants={reveal} style={{ gridColumn: '1 / 6' }}>
              <p style={{ margin: '0 0 30px', fontSize: 15, lineHeight: 1.4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                We build a baseline for every privileged user, then watch for the moment behaviour stops matching it.
              </p>
              <Link href="/dashboard" className="ghost-link">Open the dashboard <span className="arrow" aria-hidden="true">→</span></Link>
            </motion.div>
            <motion.div variants={reveal} style={{ gridColumn: '7 / 13' }}>
              <p style={{ margin: '0 0 30px', fontSize: 'clamp(22px, 2.4vw, 34px)', lineHeight: 1.15, letterSpacing: '0.006em' }}>
                SentinelIQ scores every action as it happens. When a teller exports a customer book at 2am, or an admin grants themselves a role they have never held, the analyst knows within seconds - not after data or money has left the building.
              </p>
              <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4, color: C.textMuted, maxWidth: 560 }}>
                Isolation Forest, an LSTM Autoencoder and XGBoost run side by side on a live event stream. Every alert carries SHAP attribution so the score is never a black box.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '0 0 119px' }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="wrap g12 stats-row">
          {STATS.map((s, i) => (
            <motion.div key={s.label} variants={reveal} style={{ gridColumn: `${i * 4 + 1} / span 4`, position: 'relative', paddingTop: 19 }}>
              <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.border }} />
              <Label style={{ marginBottom: 46 }}>{s.unit}</Label>
              <p style={{ margin: '0 0 30px', fontSize: 'clamp(56px, 6.4vw, 103px)', lineHeight: 0.8, letterSpacing: '0.013em' }}>
                <CountUp to={s.to} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} duration={1.8} delay={i * 0.12} />
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, color: C.textMuted, maxWidth: 300 }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Built on (2 x 5) ── */}
      <section style={{ padding: '0 0 119px' }}>
        <div className="wrap">
          <SectionHead index="02" label="Built on" right={<Label>10 components</Label>} />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="hairline-grid stack-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {STACK.map((name, i) => (
              <motion.div key={name} variants={reveal} className="cell-hover stack-cell"
                style={{ background: C.card, aspectRatio: '1.6 / 1', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 19 }}>
                <span style={{ ...LABEL, position: 'absolute', top: 15, left: 15, fontSize: 10, color: C.textFaint }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="stack-name" style={{ fontSize: 'clamp(15px, 1.4vw, 22px)', letterSpacing: '0.006em', textAlign: 'center' }}>{name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section id="capabilities" style={{ padding: '0 0 119px', scrollMarginTop: 76 }}>
        <div className="wrap">
          <SectionHead index="03" label="Capabilities" right={<Link href="/dashboard" className="ghost-pill quiet">Open dashboard <span aria-hidden="true">→</span></Link>} />
          <div className="g12" style={{ marginBottom: 76 }}>
            <MaskLines inView lines={['Built around', 'the analyst.']} style={{ gridColumn: '1 / 13', fontSize: 'clamp(44px, 7.1vw, 103px)' }} />
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="g12 work-grid" style={{ rowGap: 19 }}>
            {CAPABILITIES.map((cap, i) => (
              <motion.article key={cap.n} variants={reveal} className="grid-paper cap-card"
                style={{ gridColumn: i % 2 === 0 ? '1 / 7' : '7 / 13', padding: 30, display: 'flex', flexDirection: 'column', minHeight: 560, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                  <Label>({cap.n})</Label>
                  <Label>{cap.tag}</Label>
                </div>
                <h3 style={{ margin: '0 0 19px', fontSize: 'clamp(30px, 3.2vw, 46px)', fontWeight: 400, lineHeight: 1, letterSpacing: '0.006em' }}>{cap.title}</h3>
                <p style={{ margin: '0 0 46px', fontSize: 15, lineHeight: 1.4, color: C.textMuted, maxWidth: 480 }}>{cap.desc}</p>
                <div style={{ marginTop: 'auto', background: C.bg, border: `1px solid ${C.border}`, padding: 30 }}>
                  <CapabilityVisual kind={cap.visual} />
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section id="workflow" style={{ padding: '0 0 119px', scrollMarginTop: 76 }}>
        <div className="wrap">
          <SectionHead index="04" label="Analyst workflow" right={<Label>Under 30 seconds</Label>} />
          <Workflow />
        </div>
      </section>

      {/* ── Coverage ── */}
      <section id="coverage" style={{ padding: '0 0 119px', scrollMarginTop: 76 }}>
        <div className="wrap">
          <SectionHead index="05" label="Built for" />
          {ENVIRONMENTS.map((env, i) => (
            <motion.div key={env.title}
              variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              className="g12 cov-row"
              style={{ position: 'relative', padding: '30px 0 46px', borderBottom: i === ENVIRONMENTS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <motion.span aria-hidden="true" variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 1, ease: EASE } } }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.border, transformOrigin: 'left' }} />
              <motion.div variants={reveal} style={{ gridColumn: '1 / 2' }}>
                <Label style={{ lineHeight: '46px' }}>({String(i + 1).padStart(2, '0')})</Label>
              </motion.div>
              <motion.h3 variants={reveal} style={{ gridColumn: '2 / 7', margin: 0, fontSize: 'clamp(28px, 3vw, 46px)', fontWeight: 400, lineHeight: 1, letterSpacing: '0.006em' }}>
                {env.title}
              </motion.h3>
              <motion.div variants={reveal} style={{ gridColumn: '7 / 13' }}>
                <p style={{ margin: '0 0 19px', fontSize: 18, lineHeight: 1.4, color: C.textMuted }}>{env.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {env.tags.map(t => (
                    <span key={t} className="tag" style={{ ...LABEL, color: C.textPrimary, border: `1px solid ${C.border}`, borderRadius: 10, padding: '5px 15px' }}>{t}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '119px 0' }}>
        <div className="wrap">
          <SectionHead index="06" label="The next incident" />
          <div className="g12" style={{ marginBottom: 76 }}>
            <MaskLines inView lines={['The next insider', 'attack is already', 'in progress.']} style={{ gridColumn: '1 / 13', fontSize: 'clamp(48px, 8vw, 128px)' }} />
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="g12" style={{ alignItems: 'end' }}>
            <div style={{ gridColumn: '1 / 7', display: 'flex', gap: 19, flexWrap: 'wrap' }}>
              <Link href="/dashboard" className="ghost-pill">View live demo <span aria-hidden="true">→</span></Link>
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="ghost-pill quiet">Source <span aria-hidden="true">↗</span></a>
            </div>
            <p style={{ gridColumn: '7 / 12', margin: 0, fontSize: 18, lineHeight: 1.4, color: C.textMuted }}>
              SentinelIQ surfaces it before the damage is done.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="wrap g12 keep" style={{ paddingTop: 30, paddingBottom: 30, alignItems: 'center' }}>
          <div style={{ gridColumn: '1 / 7' }}><Logo /></div>
          <div style={{ gridColumn: '7 / 13', display: 'flex', gap: 30, alignItems: 'center', justifyContent: 'flex-end' }}>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="landing-nav-link" style={{ ...LABEL }}>GitHub</a>
            <Link href="/dashboard" className="landing-nav-link" style={{ ...LABEL }}>Demo</Link>
            <Label>ISO 27001</Label>
          </div>
        </div>
      </footer>
    </div>
  )
}
