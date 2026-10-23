'use client'

import { C } from '@/lib/tokens'

// Shared top bar for every dashboard page: a quiet weight-400 title, an
// optional one-line description, and a right-aligned action slot.
export default function PageHeader({ title, description, children }: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <header style={{
      minHeight: 64, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      padding: '12px 28px', borderBottom: `1px solid ${C.border}`, background: C.bg,
    }}>
      <div style={{ minWidth: 0, flex: '1 1 280px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 400, letterSpacing: '-0.005em', lineHeight: 1.25, color: C.textPrimary }}>{title}</h1>
        {description && <p style={{ margin: '2px 0 0', fontSize: 13, color: C.textMuted }}>{description}</p>}
      </div>
      {children && <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{children}</div>}
    </header>
  )
}

export function LiveStatus({ status, updated }: { status: 'ok' | 'initializing' | 'offline'; updated?: Date | null }) {
  const color = status === 'ok' ? C.low : status === 'initializing' ? C.medium : C.critical
  const label = status === 'ok' ? 'Live' : status === 'initializing' ? 'Starting up' : 'Offline'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: C.textMuted }}>
      <span className={status === 'ok' ? 'animate-pulse-dot' : undefined} style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      <span style={{ color: C.textPrimary }}>{label}</span>
      {updated && (
        <span style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', fontSize: 12, color: C.textFaint }}>
          {updated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
    </span>
  )
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 400, letterSpacing: 0, color: C.textPrimary }}>{children}</h2>
      {aside && <span style={{ fontSize: 13, color: C.textMuted }}>{aside}</span>}
    </div>
  )
}
