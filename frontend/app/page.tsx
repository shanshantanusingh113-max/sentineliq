'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { C, FONT, SHADOW } from '@/lib/tokens'
import { Wordmark } from '@/components/Logo'

// ── Content ──────────────────────────────────────────────

const QUEUE = [
  { id: 'a3f9b2c', user: 'James Sterling', role: 'Treasury officer', type: 'Bulk data export', score: 94, at: '02:14' },
  { id: 'b7d1e4f', user: 'Maria Lopez', role: 'Teller', type: 'Off-hours login', score: 78, at: '01:52' },
  { id: 'c2a8f3d', user: 'Arun Kapoor', role: 'Analyst', type: 'Velocity spike', score: 61, at: '01:37' },
  { id: 'd9e0a17', user: 'Hana Okafor', role: 'Admin', type: 'Privilege escalation', score: 57, at: '00:58' },
]

const SHAP = [
  { feature: 'transaction_velocity_ratio', value: 28.4 },
  { feature: 'off_hours_ratio', value: 19.2 },
  { feature: 'access_entropy', value: 14.1 },
  { feature: 'login_hour_deviation', value: 9.3 },
  { feature: 'download_volume_zscore', value: -6.2 },
]

const FACTS = [
  { value: '$19.5M', label: 'Average yearly cost of insider risk per organisation', source: 'Ponemon, 2026' },
  { value: '67 days', label: 'Average time to contain an insider incident', source: 'Ponemon, 2026' },
  { value: '0.4%', label: 'False positive rate of the three-model ensemble on the demo workforce', source: 'SentinelIQ validation' },
]

const STEPS = [
  { title: 'Detect', body: 'Each action becomes eight rolling-window features and is scored by all three models within milliseconds.' },
  { title: 'Surface', body: 'Scores above 65 land in the analyst queue with who, what, and how far from normal, in one line.' },
  { title: 'Explain', body: 'One click opens the case: 30 days of history, SHAP attribution, peer comparison, and every linked event.' },
  { title: 'Decide', body: 'Resolve or escalate. Each analyst label is kept and used to retrain the supervised model.' },
]

const SECTORS = [
  {
    title: 'Banking and fintech',
    body: 'Tellers, treasury desks, and payment operators can move money in a single action. Every transaction burst, cross-desk query, and bulk export is read against that employee\'s own history.',
    points: ['Off-hours access to core banking', 'Bulk customer record downloads', 'Transaction velocity spikes'],
  },
  {
    title: 'Privileged IT accounts',
    body: 'Admins and service accounts are the most valuable target for abuse and credential theft. Privilege changes, account tampering, and new devices are flagged as they happen.',
    points: ['Privilege escalation', 'Account modification tracking', 'Device and location changes'],
  },
  {
    title: 'Compliance and audit',
    body: 'Every alert maps to a MITRE ATT&CK technique. Case files carry the full event chain, attribution, and analyst decisions, ready for a regulator or internal audit.',
    points: ['T1078 Valid Accounts', 'T1530 Data from Cloud Storage', 'T1087 Account Discovery'],
  },
  {
    title: 'Security operations',
    body: 'Alerts arrive already explained, so analysts triage in seconds instead of correlating logs by hand for an hour.',
    points: ['Attribution on every alert', 'JSON evidence export per incident', 'Linked events grouped into cases'],
  },
]

const STACK = ['Isolation Forest', 'LSTM autoencoder', 'XGBoost', 'SHAP', 'FastAPI', 'Next.js']

// ── Type helpers ─────────────────────────────────────────

const display = (size: number, tracking: string) => ({
  margin: 0,
  fontSize: size,
  fontWeight: 400,
  letterSpacing: tracking,
  lineHeight: size >= 60 ? 1.04 : size >= 34 ? 1.16 : 1.28,
  color: C.textPrimary,
})

const serifBody = {
  fontFamily: FONT.serif,
  fontSize: 19,
  lineHeight: 1.5,
  color: C.textBody,
  margin: 0,
} as const

const mono = (size = 12, color: string = C.textMuted) => ({
  fontFamily: FONT.mono,
  fontSize: size,
  color,
  letterSpacing: 0,
})

const WRAP = { maxWidth: 1300, margin: '0 auto', padding: '0 24px' } as const

// ── Page ─────────────────────────────────────────────────

export default function LandingPage() {
  const reduce = useReducedMotion()
  const rise = (delay: number) => reduce
    ? {}
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const } }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Nav */}
      <header style={WRAP}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" aria-label="SentinelIQ home" style={{ textDecoration: 'none' }}>
            <Wordmark />
          </Link>
          <nav aria-label="Primary" className="hide-sm" style={{ display: 'flex', gap: 28, fontSize: 14 }}>
            <a href="#scoring" className="nav-link">Scoring</a>
            <a href="#explain" className="nav-link">Explainability</a>
            <a href="#workflow" className="nav-link">Workflow</a>
            <a href="#sectors" className="nav-link">Sectors</a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="https://github.com/shanshantanusingh113-max/sentineliq" target="_blank" rel="noopener noreferrer" className="nav-link hide-sm" style={{ fontSize: 14 }}>GitHub</a>
            <Link href="/dashboard" className="btn btn-ink btn-sm">Open dashboard</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ ...WRAP, paddingTop: 88 }}>
        <div style={{ maxWidth: 940 }}>
          <motion.h1 {...rise(0)} style={{ ...display(72, '-0.03em'), fontSize: 'clamp(42px, 6.4vw, 72px)' }}>
            Catch the insider before the money moves.
          </motion.h1>
          <motion.p {...rise(0.08)} className="serif" style={{ ...serifBody, marginTop: 28, maxWidth: 620 }}>
            SentinelIQ learns how each privileged employee normally works, scores every action against that baseline,
            and hands your analysts a written account of what changed and why it matters.
          </motion.p>
          <motion.div {...rise(0.16)} style={{ display: 'flex', gap: 10, marginTop: 36, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-ink">Open the live dashboard</Link>
            <a href="#workflow" className="btn btn-linen">See how an alert is made</a>
          </motion.div>
        </div>

        <motion.div {...rise(0.3)} style={{ marginTop: 72 }}>
          <ProductWindow />
        </motion.div>
      </section>

      {/* Facts */}
      <section style={{ ...WRAP, paddingTop: 112 }}>
        <div className="stat-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {FACTS.map(f => (
            <div key={f.value} style={{ borderTop: `1px solid ${C.borderStrong}`, paddingTop: 20 }}>
              <p style={display(36, '-0.02em')}>{f.value}</p>
              <p style={{ margin: '12px 0 6px', fontSize: 14, lineHeight: 1.5, color: C.textBody, maxWidth: 320 }}>{f.label}</p>
              <p style={mono(12, C.textFaint)}>{f.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature: baselines */}
      <Feature
        id="scoring"
        heading="Measured against themselves, not their job title."
        body="A teller who always logs in at 7am and one who works late shifts should not trip the same wire. Every employee gets a 30-day behavioural baseline covering login hours, download volumes, departments touched, and locations."
        visual={<BaselineVisual />}
      />

      {/* Feature: ensemble */}
      <Feature
        reverse
        heading="Three models read every event, and their disagreement is a signal."
        body="An Isolation Forest catches one-off outliers, an LSTM autoencoder catches sequences that drift, and XGBoost applies what analysts have already confirmed. Their weighted score becomes a single 0 to 100 risk number."
        visual={<EnsembleVisual />}
      />

      {/* Feature: explainability */}
      <Feature
        id="explain"
        heading="Every score comes with its reasons attached."
        body="SHAP attribution shows which behaviours pushed the score up or down, and by how much. Analysts see evidence, not a black-box flag, and can defend the decision to anyone who asks."
        visual={<ShapVisual />}
      />

      {/* Workflow */}
      <section id="workflow" style={{ ...WRAP, paddingTop: 128 }}>
        <h2 style={{ ...display(36, '-0.02em'), maxWidth: 640 }}>From event to decision in under thirty seconds.</h2>
        <ol className="steps-grid" style={{ listStyle: 'none', padding: 0, margin: '48px 0 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {STEPS.map((s, i) => (
            <li key={s.title} style={{ borderTop: `1px solid ${C.borderStrong}`, paddingTop: 20 }}>
              <span style={mono(12)}>Step {i + 1}</span>
              <h3 style={{ ...display(22, '-0.005em'), marginTop: 10 }}>{s.title}</h3>
              <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: C.textBody }}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Sectors */}
      <section id="sectors" style={{ ...WRAP, paddingTop: 128 }}>
        <div className="split-2" style={{ display: 'grid', gridTemplateColumns: '4fr 8fr', gap: 64 }}>
          <div>
            <h2 style={{ ...display(36, '-0.02em'), position: 'sticky', top: 32 }}>Built for places where one person can do real damage.</h2>
          </div>
          <div>
            {SECTORS.map((s, i) => (
              <div key={s.title} className="split-2" style={{
                display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32,
                padding: '28px 0',
                borderTop: `1px solid ${C.border}`,
                borderBottom: i === SECTORS.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <h3 style={display(22, '-0.005em')}>{s.title}</h3>
                <div>
                  <p className="serif" style={{ ...serifBody, fontSize: 17 }}>{s.body}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
                    {s.points.map(p => <li key={p} style={mono(12)}>{p}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section style={{ ...WRAP, paddingTop: 144, paddingBottom: 112 }}>
        <div style={{ background: C.card, borderRadius: 4, boxShadow: SHADOW.card, padding: 'clamp(32px, 6vw, 72px)' }}>
          <h2 style={{ ...display(54, '-0.025em'), fontSize: 'clamp(32px, 5vw, 54px)', maxWidth: 760 }}>
            Watch it score a live workforce.
          </h2>
          <p className="serif" style={{ ...serifBody, marginTop: 20, maxWidth: 560 }}>
            The demo runs fifty synthetic bank employees through the full pipeline in real time. Trigger an attack scenario and follow it from first event to closed case.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-ink">Open the live dashboard</Link>
            <Link href="/dashboard/alerts" className="btn btn-linen">Go to the alert queue</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ ...WRAP, paddingBottom: 48 }}>
        <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32, borderTop: `1px solid ${C.border}`, paddingTop: 40 }}>
          <div>
            <Wordmark />
            <p style={{ margin: '14px 0 0', fontSize: 13, color: C.textMuted, maxWidth: 280, lineHeight: 1.55 }}>
              Insider threat detection with per-user baselines and explainable scoring.
            </p>
          </div>
          <FooterCol title="Product" links={[['Overview', '/dashboard'], ['Alerts', '/dashboard/alerts'], ['Cases', '/dashboard/cases'], ['Users', '/dashboard/users']]} />
          <FooterCol title="Models" links={[['Intelligence', '/dashboard/intelligence'], ['How scoring works', '#scoring'], ['Explainability', '#explain']]} />
          <FooterCol title="Project" links={[['GitHub', 'https://github.com/shanshantanusingh113-max/sentineliq'], ['Workflow', '#workflow']]} />
        </div>
        <p style={{ ...mono(12, C.textFaint), marginTop: 40 }}>
          {STACK.join('  /  ')}
        </p>
      </footer>
    </div>
  )
}

// ── Sections ─────────────────────────────────────────────

function Feature({ id, heading, body, visual, reverse }: { id?: string; heading: string; body: string; visual: React.ReactNode; reverse?: boolean }) {
  const text = (
    <div style={{ alignSelf: 'center' }}>
      <h2 style={{ ...display(26, '-0.012em'), maxWidth: 440 }}>{heading}</h2>
      <p className="serif" style={{ ...serifBody, fontSize: 17, marginTop: 16, maxWidth: 440 }}>{body}</p>
    </div>
  )
  return (
    <section id={id} style={{ ...WRAP, paddingTop: 128 }}>
      <div className="split-2" style={{ display: 'grid', gridTemplateColumns: reverse ? '6fr 4fr' : '4fr 6fr', gap: 64 }}>
        {reverse ? <>{visual}{text}</> : <>{text}{visual}</>}
      </div>
    </section>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.textPrimary }}>{title}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith('http')
              ? <a href={href} target="_blank" rel="noopener noreferrer" className="link-quiet" style={{ fontSize: 13 }}>{label}</a>
              : <Link href={href} className="link-quiet" style={{ fontSize: 13 }}>{label}</Link>}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Product window (hero) ────────────────────────────────

function WindowFrame({ title, tabs, children }: { title: string; tabs?: string[]; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, borderRadius: 4, boxShadow: SHADOW.card, overflow: 'hidden' }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
        <div style={{ display: 'flex', gap: 6 }} aria-hidden="true">
          {[0, 1, 2].map(i => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: C.borderStrong }} />)}
        </div>
        <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 13, color: C.textMuted, pointerEvents: 'none' }}>{title}</span>
      </div>
      {tabs && (
        <div style={{ display: 'flex', gap: 0, padding: '0 14px', borderBottom: `1px solid ${C.border}`, background: C.panel }}>
          {tabs.map((t, i) => (
            <span key={t} style={{
              ...mono(12, i === 0 ? C.textPrimary : C.textMuted),
              padding: '9px 12px',
              borderBottom: i === 0 ? `1px solid ${C.textPrimary}` : '1px solid transparent',
              marginBottom: -1,
            }}>{t}</span>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

function ProductWindow() {
  const max = 30
  return (
    <WindowFrame title="SentinelIQ - Alert queue" tabs={['queue.open', 'cases', 'intelligence']}>
      <div className="alert-demo-grid" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', minHeight: 440, background: C.bg }}>
        {/* Queue */}
        <div style={{ borderRight: `1px solid ${C.border}` }}>
          <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, color: C.textPrimary }}>Open alerts</span>
            <span style={mono(12)}>4 above 50</span>
          </div>
          {QUEUE.map((a, i) => {
            const active = i === 0
            const col = a.score >= 65 ? C.critical : C.medium
            return (
              <div key={a.id} style={{
                padding: '13px 18px',
                borderTop: `1px solid ${C.border}`,
                background: active ? C.card : 'transparent',
                boxShadow: active ? `inset 2px 0 0 ${C.textPrimary}` : 'none',
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 4,
              }}>
                <span style={{ fontSize: 14, color: C.textPrimary }}>{a.user}</span>
                <span style={{ fontSize: 14, color: col, fontVariantNumeric: 'tabular-nums' }}>{a.score}</span>
                <span style={{ fontSize: 13, color: C.textMuted }}>{a.type}</span>
                <span style={mono(12, C.textFaint)}>{a.at}</span>
              </div>
            )
          })}
        </div>

        {/* Case detail */}
        <div style={{ padding: '24px 28px', display: 'grid', gap: 22, alignContent: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <span style={mono(12)}>alert a3f9b2c / T1530</span>
              <p style={{ ...display(26, '-0.012em'), marginTop: 6 }}>Bulk data export</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted }}>James Sterling, Treasury officer</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 54, lineHeight: 1, letterSpacing: '-0.03em', color: C.critical, fontVariantNumeric: 'tabular-nums' }}>94</span>
              <p style={{ ...mono(12), margin: '4px 0 0' }}>risk / 100</p>
            </div>
          </div>

          <p className="serif" style={{ ...serifBody, fontSize: 17, maxWidth: 560, borderLeft: `2px solid ${C.borderStrong}`, paddingLeft: 16 }}>
            At 02:14, five hours outside his usual window, James exported 4.2 GB of customer records from three departments he has not touched in thirty days.
          </p>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: C.textPrimary }}>What drove the score</span>
              <span style={mono(12, C.textFaint)}>SHAP, XGBoost</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {SHAP.map(s => {
                const pos = s.value > 0
                return (
                  <div key={s.feature} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 48px', alignItems: 'center', gap: 12 }}>
                    <span style={{ ...mono(12, C.textBody), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.feature}</span>
                    <div style={{ height: 6, background: C.hover, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(Math.abs(s.value) / max, 1) * 100}%`, background: pos ? C.critical : C.low, borderRadius: 2 }} />
                    </div>
                    <span style={{ ...mono(12, pos ? C.critical : C.low), textAlign: 'right' }}>{pos ? '+' : '-'}{Math.abs(s.value).toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="btn btn-ink btn-sm" aria-hidden="true">Escalate</span>
            <span className="btn btn-linen btn-sm" aria-hidden="true">Mark as false positive</span>
            <span style={{ ...mono(12, C.textFaint), marginLeft: 'auto' }}>IF 0.91 / LSTM 0.96 / XGB 0.88</span>
          </div>
        </div>
      </div>
    </WindowFrame>
  )
}

// ── Feature visuals ──────────────────────────────────────

function BaselineVisual() {
  // 24 hourly bars: this user's normal activity, with tonight's event marked.
  const normal = [0, 0, 0, 0, 0, 0, 1, 4, 8, 9, 9, 8, 6, 8, 9, 8, 7, 4, 1, 0, 0, 0, 0, 0]
  return (
    <WindowFrame title="Baseline - James Sterling">
      <div style={{ padding: '24px 24px 20px', background: C.bg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: C.textPrimary }}>Login hour, last 30 days</span>
          <span style={mono(12)}>usual window 07:00 - 18:00</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 4, alignItems: 'end', height: 140 }}>
          {normal.map((v, h) => {
            const flagged = h === 2
            return (
              <div key={h} style={{
                height: flagged ? '62%' : `${Math.max(v / 9, 0.03) * 100}%`,
                background: flagged ? C.critical : v === 0 ? C.border : C.borderStrong,
                borderRadius: 2,
              }} />
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {['00', '06', '12', '18', '23'].map(t => <span key={t} style={mono(12, C.textFaint)}>{t}</span>)}
        </div>
        <p style={{ margin: '18px 0 0', fontSize: 13, color: C.textBody }}>
          <span style={{ color: C.critical }}>02:14 tonight</span> is 5.1 standard deviations from his own pattern.
        </p>
      </div>
    </WindowFrame>
  )
}

function EnsembleVisual() {
  const models = [
    { name: 'Isolation Forest', role: 'point outliers', weight: 0.4, score: 91 },
    { name: 'LSTM autoencoder', role: 'sequence drift', weight: 0.4, score: 96 },
    { name: 'XGBoost', role: 'learned from labels', weight: 0.2, score: 88 },
  ]
  return (
    <WindowFrame title="Ensemble - event 8f21c">
      <div style={{ background: C.bg }}>
        {models.map(m => (
          <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 48px', gap: 16, alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, color: C.textPrimary }}>{m.name}</p>
              <p style={{ margin: '2px 0 0', ...mono(12) }}>{m.role} / weight {m.weight}</p>
            </div>
            <div style={{ height: 6, background: C.hover, borderRadius: 2 }}>
              <div style={{ width: `${m.score}%`, height: '100%', background: C.textPrimary, borderRadius: 2 }} />
            </div>
            <span style={{ ...mono(13, C.textPrimary), textAlign: 'right' }}>{m.score}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '20px 24px' }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>Weighted risk score</span>
          <span style={{ fontSize: 36, letterSpacing: '-0.02em', color: C.critical, lineHeight: 1 }}>94</span>
        </div>
      </div>
    </WindowFrame>
  )
}

function ShapVisual() {
  return (
    <WindowFrame title="Attribution - alert a3f9b2c">
      <div style={{ padding: 24, background: C.bg }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
          <span style={mono(12, C.low)}>lowers risk</span>
          <span style={{ ...mono(12, C.critical), textAlign: 'right' }}>raises risk</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {SHAP.map(s => {
            const pos = s.value > 0
            const w = `${Math.min(Math.abs(s.value) / 30, 1) * 50}%`
            return (
              <div key={s.feature}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={mono(12, C.textBody)}>{s.feature}</span>
                  <span style={mono(12, pos ? C.critical : C.low)}>{pos ? '+' : '-'}{Math.abs(s.value).toFixed(1)}</span>
                </div>
                <div style={{ position: 'relative', height: 6, background: C.hover, borderRadius: 2 }}>
                  <span style={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 1, background: C.borderStrong }} />
                  <span style={{
                    position: 'absolute', top: 0, bottom: 0, borderRadius: 2,
                    background: pos ? C.critical : C.low,
                    width: w,
                    left: pos ? '50%' : `calc(50% - ${w})`,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </WindowFrame>
  )
}
