'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { C, IRIDESCENT, LABEL } from '@/lib/tokens'

const MAX = 1400
const GUTTER = 'clamp(16px, 4vw, 46px)'

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const HEADLINE = ['Insider', 'threats,', 'caught before', 'the damage.']

const STATS = [
  { value: '$19.5M', unit: 'per year', label: 'Average insider risk cost per organisation (Ponemon, 2026)' },
  { value: '67', unit: 'days', label: 'Average time to contain an insider incident (Ponemon, 2026)' },
  { value: '0.4%', unit: 'FP rate', label: 'False positive rate on the 3-model ensemble' },
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
  {
    n: '01',
    title: 'Per-user baselines',
    tag: 'Behaviour',
    desc: 'Each employee is scored against their own 30-day history, not a generic role profile. Off-hours logins, download volumes and cross-department queries are measured against what that specific user actually does.',
    visual: 'baseline' as const,
  },
  {
    n: '02',
    title: 'Ensemble scoring',
    tag: 'Models',
    desc: 'Isolation Forest, an LSTM Autoencoder and XGBoost score every event in parallel. When the models disagree, the disagreement itself is surfaced to the analyst next to the final risk score.',
    visual: 'ensemble' as const,
  },
  {
    n: '03',
    title: 'Explainable alerts',
    tag: 'SHAP',
    desc: 'Every alert ships with feature attribution. Analysts see which behavioural signals drove the score, by how much, measured against the user\'s own baseline. No black-box anomaly flags.',
    visual: 'shap' as const,
  },
  {
    n: '04',
    title: 'Investigator view',
    tag: 'Casework',
    desc: 'One click opens the full evidence package: risk score, SHAP explanation, 30 days of history, peer comparison against same-role employees and every linked prior incident.',
    visual: 'case' as const,
  },
]

const WORKFLOW = [
  { n: '01', title: 'Detect', desc: 'Every action is encoded into 8 rolling-window features and scored by all three models. The ensemble returns a single 0-100 risk score within milliseconds.' },
  { n: '02', title: 'Surface', desc: 'When the score breaches threshold, an alert lands on the queue with a one-line summary: who, what event, and how risky.' },
  { n: '03', title: 'Explain', desc: 'The case view shows 30-day risk history, SHAP attribution, individual model scores and peer comparison against same-role staff.' },
  { n: '04', title: 'Decide', desc: 'Resolve or escalate in one action. Every analyst label feeds active learning, so XGBoost improves with each decision.' },
]

const ENVIRONMENTS = [
  {
    title: 'Banking and fintech',
    desc: 'Tellers, treasury desks and payment operators hold access that can move money in a single action. Every transaction burst, cross-desk query and bulk export is scored against that employee\'s own baseline.',
    tags: ['Off-hours core banking access', 'Bulk customer record downloads', 'Transaction velocity spikes'],
  },
  {
    title: 'Privileged IT and admin',
    desc: 'Admins and service accounts are the highest-value target for insider abuse. Privilege escalation, account tampering and unusual device or location changes are flagged the moment they happen.',
    tags: ['Privilege escalation', 'Account modification', 'Device and location anomalies'],
  },
  {
    title: 'Compliance and audit',
    desc: 'Every alert maps to a MITRE ATT&CK technique. Case files carry the full event chain, SHAP evidence and analyst labels, packaged for regulator or internal audit handoff.',
    tags: ['T1078 Valid Accounts', 'T1530 Data from Cloud Storage', 'T1087 Account Discovery'],
  },
  {
    title: 'Security operations',
    desc: 'Alerts arrive pre-explained with risk score, top SHAP drivers, behavioural history and peer comparison. Analysts triage in seconds instead of hours of manual correlation.',
    tags: ['Ensemble-scored alerts', 'JSON evidence export', 'Kill-chain case clustering'],
  },
]

/* ------------------------------------------------------------------ */

function Rings({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ position: 'absolute', pointerEvents: 'none', overflow: 'visible', ...style }}
    >
      {[50, 38, 26].map(r => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="0.12" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ ...LABEL, margin: 0, ...style }}>{children}</p>
}

function SectionHead({ index, label, right }: { index: string; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 19, borderTop: `1px solid ${C.border}`, paddingTop: 15, marginBottom: 76 }}>
      <div style={{ display: 'flex', gap: 30 }}>
        <Label>({index})</Label>
        <Label style={{ color: C.textPrimary }}>{label}</Label>
      </div>
      {right}
    </div>
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
    <div style={{ border: `1px solid ${C.border}`, background: C.bg }}>
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

const SPHERE = 'clamp(300px, 46vw, 640px)'

function HeroCopy({ wrap, ink = false }: { wrap: React.CSSProperties; ink?: boolean }) {
  const fg = ink ? C.onInk : C.textPrimary
  const sub = ink ? C.onInk : C.textMuted
  return (
    <div style={{ ...wrap, width: '100%', position: 'relative', paddingTop: 140, paddingBottom: 46 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} style={{ display: 'flex', gap: 30, marginBottom: 46 }}>
        <Label style={{ color: sub }}>(00)</Label>
        <Label style={{ color: fg }}>AI-driven insider threat detection</Label>
      </motion.div>

      {ink ? (
        <div style={{ margin: 0, fontSize: HERO_SIZE, fontWeight: 400, lineHeight: 0.8, letterSpacing: '0.013em', textTransform: 'uppercase', color: fg }}>
          <HeadlineLines />
        </div>
      ) : (
        <h1 style={{ margin: 0, fontSize: HERO_SIZE, fontWeight: 400, lineHeight: 0.8, letterSpacing: '0.013em', textTransform: 'uppercase', color: fg }}>
          <HeadlineLines />
        </h1>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }}
        className="intro-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 19, marginTop: 76, borderTop: `1px solid ${ink ? C.onInk : C.border}`, paddingTop: 19 }}
      >
        <Label style={{ color: sub }}>Banks and fintech - flagship use case</Label>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, color: sub, maxWidth: 460 }}>
          A behavioural fingerprint for every privileged user, scored in real time by a 3-model ensemble. Deviations reach the security team in seconds.
        </p>
      </motion.div>
    </div>
  )
}

const HERO_SIZE = 'clamp(52px, 10.2vw, 148px)'

function HeadlineLines() {
  return (
    <>
      {HEADLINE.map((line, i) => (
        <span key={line} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.04em' }}>
          <motion.span
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'block' }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const wrap: React.CSSProperties = { maxWidth: MAX, margin: '0 auto', padding: `0 ${GUTTER}` }

  return (
    <div style={{ background: C.bg, color: C.textPrimary, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Top bar ── */}
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
        <div style={{ ...wrap, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.textPrimary }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" aria-hidden="true" style={{ height: 22, width: 'auto', display: 'block' }} />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>SentinelIQ.</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <div className="hide-md" style={{ display: 'flex', gap: 30 }}>
              {[['Capabilities', '#capabilities'], ['Workflow', '#workflow'], ['Coverage', '#coverage']].map(([label, href]) => (
                <a key={href} href={href} className="landing-nav-link" style={{ ...LABEL, color: C.textMuted }}>{label}</a>
              ))}
            </div>
            <Link href="/dashboard" className="ghost-pill">Live demo <span aria-hidden="true">→</span></Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        {/* Sphere + rings, anchored right of center */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '62%', top: '44%', width: 0, height: 0 }}>
          <Rings size={1480} style={{ left: -740, top: -740 }} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="hero-sphere"
            style={{ position: 'absolute', left: `calc(${SPHERE} / -2)`, top: `calc(${SPHERE} / -2)`, width: SPHERE, height: SPHERE, background: IRIDESCENT }}
          />
        </div>

        {/* Bone layer */}
        <HeroCopy wrap={wrap} />

        {/* Ink layer - same copy, clipped to the sphere, so letters read as ink on the gradient */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', pointerEvents: 'none',
            clipPath: `circle(calc(${SPHERE} / 2) at 62% 44%)`,
          }}
        >
          <HeroCopy wrap={wrap} ink />
        </motion.div>

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', right: 30, bottom: 30, zIndex: 30,
            ...LABEL, color: C.textPrimary,
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: scrolled ? 0 : 1, transition: 'opacity 0.3s', pointerEvents: 'none',
          }}
        >
          Scroll <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* ── Intro block ── */}
      <section style={{ padding: '119px 0 76px' }}>
        <div style={wrap}>
          <SectionHead index="01" label="About the platform" />
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="intro-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 19 }}
          >
            <motion.div variants={reveal}>
              <p style={{ margin: '0 0 30px', fontSize: 15, lineHeight: 1.4, letterSpacing: '0.05em', textTransform: 'uppercase', maxWidth: 420 }}>
                We build a baseline for every privileged user, then watch for the moment behaviour stops matching it.
              </p>
              <Link href="/dashboard" className="ghost-link">
                Open the dashboard <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </motion.div>
            <motion.div variants={reveal}>
              <p style={{ margin: '0 0 19px', fontSize: 'clamp(22px, 2.6vw, 34px)', lineHeight: 1.1, letterSpacing: '0.006em' }}>
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
        <div style={wrap}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="stats-row"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
          >
            {STATS.map(({ value, unit, label }, i) => (
              <motion.div key={label} variants={reveal}
                style={{ padding: '46px 30px 30px', paddingLeft: i === 0 ? 0 : 30, borderRight: i < STATS.length - 1 ? `1px solid ${C.border}` : 'none' }}
              >
                <Label style={{ marginBottom: 30 }}>{unit}</Label>
                <p style={{ margin: '0 0 30px', fontSize: 'clamp(52px, 6vw, 103px)', lineHeight: 0.8, letterSpacing: '0.013em', color: C.textPrimary }}>{value}</p>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, color: C.textMuted, maxWidth: 300 }}>{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stack grid (2 x 5) ── */}
      <section style={{ padding: '0 0 119px' }}>
        <div style={wrap}>
          <SectionHead index="02" label="Built on" />
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="hairline-grid stack-grid"
            style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
          >
            {STACK.map((name, i) => (
              <motion.div key={name} variants={reveal} className="cell-hover"
                style={{ background: C.card, aspectRatio: '1.6 / 1', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 19 }}
              >
                <span style={{ ...LABEL, position: 'absolute', top: 15, left: 15, fontSize: 10, color: C.textFaint }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 'clamp(15px, 1.5vw, 22px)', letterSpacing: '0.006em', textAlign: 'center' }}>{name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Capabilities (featured work cards) ── */}
      <section id="capabilities" style={{ padding: '0 0 119px' }}>
        <div style={wrap}>
          <SectionHead
            index="03"
            label="Capabilities"
            right={<Link href="/dashboard" className="ghost-pill quiet">All capabilities <span aria-hidden="true">→</span></Link>}
          />
          <h2 style={{ margin: '0 0 76px', fontSize: 'clamp(40px, 6.2vw, 103px)', fontWeight: 400, lineHeight: 0.8, letterSpacing: '0.013em', textTransform: 'uppercase', maxWidth: 1100 }}>
            Built around the analyst.
          </h2>
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="work-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 19 }}
          >
            {CAPABILITIES.map(cap => (
              <motion.article key={cap.n} variants={reveal} className="grid-paper"
                style={{ padding: 30, display: 'flex', flexDirection: 'column', minHeight: 560, border: `1px solid ${C.border}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                  <Label>({cap.n})</Label>
                  <Label>{cap.tag}</Label>
                </div>
                <h3 style={{ margin: '0 0 19px', fontSize: 'clamp(32px, 3.4vw, 46px)', fontWeight: 400, lineHeight: 1, letterSpacing: '0.006em' }}>{cap.title}</h3>
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
      <section id="workflow" style={{ padding: '0 0 119px' }}>
        <div style={wrap}>
          <SectionHead index="04" label="Analyst workflow" right={<Label>Under 30 seconds</Label>} />
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="hairline-grid steps-grid"
            style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
          >
            {WORKFLOW.map(step => (
              <motion.div key={step.n} variants={reveal} className="cell-hover" style={{ padding: 30, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 76, lineHeight: 0.8, color: C.textFaint, letterSpacing: '0.013em' }}>{step.n}</span>
                <div style={{ marginTop: 'auto' }}>
                  <p style={{ margin: '0 0 15px', fontSize: 34, lineHeight: 1, letterSpacing: '0.006em', textTransform: 'uppercase' }}>{step.title}</p>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, color: C.textMuted }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Coverage ── */}
      <section id="coverage" style={{ padding: '0 0 119px' }}>
        <div style={wrap}>
          <SectionHead index="05" label="Built for" />
          <div>
            {ENVIRONMENTS.map((env, i) => (
              <motion.div key={env.title}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={reveal}
                className="split-grid"
                style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 19,
                  padding: '30px 0 46px',
                  borderTop: `1px solid ${C.border}`,
                  borderBottom: i === ENVIRONMENTS.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <Label>({String(i + 1).padStart(2, '0')})</Label>
                <h3 style={{ margin: 0, fontSize: 'clamp(28px, 3vw, 46px)', fontWeight: 400, lineHeight: 1, letterSpacing: '0.006em' }}>{env.title}</h3>
                <div>
                  <p style={{ margin: '0 0 19px', fontSize: 18, lineHeight: 1.4, color: C.textMuted }}>{env.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {env.tags.map(t => (
                      <span key={t} style={{ ...LABEL, color: C.textPrimary, border: `1px solid ${C.border}`, borderRadius: 10, padding: '5px 15px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '119px 0' }}>
        <Rings size={1100} style={{ right: -360, top: '50%', marginTop: -550 }} />
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}
          style={{ ...wrap, position: 'relative' }}
        >
          <SectionHead index="06" label="The next incident" />
          <h2 style={{ margin: '0 0 76px', fontSize: 'clamp(48px, 8vw, 128px)', fontWeight: 400, lineHeight: 0.8, letterSpacing: '0.013em', textTransform: 'uppercase', maxWidth: 1200 }}>
            The next insider attack is already in progress.
          </h2>
          <div className="intro-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 19, alignItems: 'end' }}>
            <div style={{ display: 'flex', gap: 19, flexWrap: 'wrap' }}>
              <Link href="/dashboard" className="ghost-pill">View live demo <span aria-hidden="true">→</span></Link>
              <a href="https://github.com/TeamSigmoidIdea20/sentineliq" target="_blank" rel="noopener noreferrer" className="ghost-pill quiet">Source <span aria-hidden="true">↗</span></a>
            </div>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4, color: C.textMuted, maxWidth: 460 }}>
              SentinelIQ surfaces it before the damage is done.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${C.border}` }}>
        <div style={{ ...wrap, padding: `30px ${GUTTER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 19 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>SentinelIQ.</span>
          <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
            <a href="https://github.com/TeamSigmoidIdea20/sentineliq" target="_blank" rel="noopener noreferrer" className="landing-nav-link" style={{ ...LABEL }}>GitHub</a>
            <Link href="/dashboard" className="landing-nav-link" style={{ ...LABEL }}>Demo</Link>
            <Label>ISO 27001</Label>
          </div>
        </div>
      </footer>
    </div>
  )
}
