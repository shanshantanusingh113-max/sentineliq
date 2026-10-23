'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { C, FONT } from '@/lib/tokens'
import { Wordmark } from '@/components/Logo'

const NAV = [
  { href: '/dashboard', label: 'Overview', key: 'H', icon: OverviewIcon },
  { href: '/dashboard/alerts', label: 'Alerts', key: 'A', icon: AlertIcon },
  { href: '/dashboard/cases', label: 'Cases', key: 'C', icon: CasesIcon },
  { href: '/dashboard/intelligence', label: 'Intelligence', key: 'I', icon: IntelligenceIcon },
  { href: '/dashboard/users', label: 'Users', key: 'U', icon: UsersIcon },
]

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside
        className="sidebar-hidden"
        style={{
          width: 232,
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: 56, padding: '0 18px', display: 'flex', alignItems: 'center' }}>
          <Link href="/" aria-label="SentinelIQ home" style={{ textDecoration: 'none' }}>
            <Wordmark />
          </Link>
        </div>

        <div style={{ padding: '4px 12px 12px' }}>
          <button
            onClick={() => window.dispatchEvent(new Event('sentinel:cmdk'))}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
              color: C.textMuted, fontSize: 13,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16" y2="16" />
            </svg>
            <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
            <kbd style={{ fontFamily: FONT.mono, fontSize: 11, color: C.textFaint }}>⌘K</kbd>
          </button>
        </div>

        <nav aria-label="Dashboard" style={{ padding: '4px 12px', flex: 1 }}>
          {NAV.map(({ href, label, key, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={active ? undefined : 'side-link'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 10px',
                  borderRadius: 4,
                  marginBottom: 1,
                  textDecoration: 'none',
                  background: active ? C.hover : 'transparent',
                  color: active ? C.textPrimary : C.textMuted,
                  fontSize: 14,
                }}
              >
                <Icon active={active} />
                <span style={{ flex: 1 }}>{label}</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.textFaint }}>G {key}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textPrimary }}>Bank Corp 01</p>
          <p style={{ margin: '2px 0 0', fontFamily: FONT.mono, fontSize: 11, color: C.textFaint }}>internal network / v1.0</p>
        </div>
      </aside>

      {/* Mobile top bar - replaces the sidebar under 768px */}
      <div
        className="mobile-bar"
        style={{
          display: 'none',
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
          height: 52, padding: '0 16px', gap: 12,
          alignItems: 'center', justifyContent: 'space-between',
          background: C.bg, borderBottom: `1px solid ${C.border}`,
        }}
      >
        <Link href="/" aria-label="SentinelIQ home" style={{ textDecoration: 'none' }}><Wordmark size={13} /></Link>
        <nav aria-label="Dashboard" style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link key={href} href={href} aria-label={label} aria-current={active ? 'page' : undefined}
                style={{ padding: 8, borderRadius: 4, background: active ? C.hover : 'transparent', display: 'flex' }}>
                <Icon active={active} />
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

const stroke = (active: boolean) => (active ? C.textPrimary : C.textMuted)
const svgProps = (active: boolean) => ({
  width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none',
  stroke: stroke(active), strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

function OverviewIcon({ active }: { active: boolean }) {
  return (
    <svg {...svgProps(active)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  )
}

function AlertIcon({ active }: { active: boolean }) {
  return (
    <svg {...svgProps(active)}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg {...svgProps(active)}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CasesIcon({ active }: { active: boolean }) {
  return (
    <svg {...svgProps(active)}>
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <rect x="3" y="7" width="18" height="14" rx="1.5" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  )
}

function IntelligenceIcon({ active }: { active: boolean }) {
  return (
    <svg {...svgProps(active)}>
      <path d="M3 3v18h18" />
      <path d="M7 15l3-3 3 2 5-7" />
    </svg>
  )
}
