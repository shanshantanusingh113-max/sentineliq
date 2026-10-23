'use client'

import { useMemo } from 'react'
import { Star } from 'lucide-react'
import type { User } from '@/lib/api'
import { timeAgo, formatFraudType } from '@/lib/api'
import { C, FONT, riskColor, riskLevel } from '@/lib/tokens'
import RiskBadge from './RiskBadge'

function TrendArrow({ trend }: { trend?: string }) {
  if (trend === 'up') return <span aria-label="rising" style={{ fontSize: 13, color: C.critical }}>↑</span>
  if (trend === 'down') return <span aria-label="falling" style={{ fontSize: 13, color: C.low }}>↓</span>
  return <span aria-label="steady" style={{ fontSize: 13, color: C.textFaint }}>→</span>
}

function MiniSparkline({ score, userId, trend }: { score: number; userId: string; trend?: string }) {
  const points = useMemo(() => {
    const seed = userId.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0)
    return Array.from({ length: 7 }, (_, i) => {
      const jitter = (Math.sin(seed + i * 37.3) * 0.5 + 0.5) * 6 - 3
      let base = score
      if (trend === 'up') base = score - 18 + (i / 6) * 22
      else if (trend === 'down') base = score + 18 - (i / 6) * 22
      return Math.max(0, Math.min(100, base + jitter))
    })
  }, [userId, score, trend])
  const max = 100
  const h = 28
  const w = 60
  const path = points.map((v, i) => `${(i / 6) * w},${h - (v / max) * h}`).join(' L ')
  const strokeColor = trend === 'up' ? C.critical : trend === 'down' ? C.low : C.textMuted
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={path} fill="none" stroke={strokeColor} strokeWidth="1.5" />
    </svg>
  )
}

interface Props {
  users: User[]
  loading?: boolean
  onSelectUser?: (id: string) => void
  watchlist?: Set<string>
  onToggleWatchlist?: (id: string) => void
  restrictedUsers?: Set<string>
}

export default function UserTable({ users, loading, onSelectUser, watchlist, onToggleWatchlist, restrictedUsers }: Props) {
  if (loading) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }} aria-busy="true">
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ height: 56, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16 }}>
            <div className="skeleton" style={{ width: 30, height: 30, borderRadius: '50%' }} />
            {[140, 90, 90, 60, 70].map((w, j) => (
              <div key={j} className="skeleton" style={{ height: 11, width: w }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  const cell = { padding: '11px 16px', whiteSpace: 'nowrap' } as const
  const tag = (color: string, wash: string, text: string) => (
    <span style={{ fontSize: 12, color, background: wash, borderRadius: 4, padding: '1px 7px', marginLeft: 2 }}>{text}</span>
  )

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 720 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {onToggleWatchlist && <th style={{ width: 40, ...cell }}><span style={{ position: 'absolute', left: -9999 }}>Watchlist</span></th>}
            {['Person', 'Role', 'Department', 'Risk', 'Last active', ''].map((h) => (
              <th key={h} style={{ ...cell, textAlign: 'left', color: C.textMuted, fontWeight: 400, fontSize: 13 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const level = riskLevel(user.risk_score)
            const isWatched = watchlist?.has(user.id) ?? false
            const isRestricted = restrictedUsers?.has(user.id) ?? user.restricted ?? false
            return (
              <tr
                key={user.id}
                className="row-hover"
                tabIndex={onSelectUser ? 0 : undefined}
                role={onSelectUser ? 'button' : undefined}
                aria-label={onSelectUser ? `View profile for ${user.name}` : undefined}
                onClick={() => onSelectUser?.(user.id)}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onSelectUser) { e.preventDefault(); onSelectUser(user.id) } }}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  cursor: onSelectUser ? 'pointer' : 'default',
                  background: C.bg,
                }}
              >
                {onToggleWatchlist && (
                  <td style={{ ...cell, width: 40 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleWatchlist(user.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                      aria-label={isWatched ? `Remove ${user.name} from watchlist` : `Add ${user.name} to watchlist`}
                      aria-pressed={isWatched}
                    >
                      <Star size={14} color={isWatched ? C.amber : C.textFaint} fill={isWatched ? C.amber : 'none'} strokeWidth={1.6} />
                    </button>
                  </td>
                )}
                <td style={cell}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      aria-hidden="true"
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: C.hover, boxShadow: `inset 0 0 0 1.5px ${riskColor(user.risk_score)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: C.textPrimary, flexShrink: 0,
                      }}
                    >
                      {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ margin: 0, color: C.textPrimary, fontSize: 14 }}>{user.name}</p>
                      <p style={{ margin: 0, color: C.textFaint, fontSize: 12, fontFamily: FONT.mono }}>{user.id}</p>
                    </div>
                    {isWatched && tag(C.amber, C.mediumWash, 'Watching')}
                    {isRestricted && tag(C.critical, C.criticalWash, 'Restricted')}
                  </div>
                </td>
                <td style={{ ...cell, color: C.textBody }}>
                  {formatFraudType(user.role)}
                </td>
                <td style={{ ...cell, color: C.textBody }}>
                  {formatFraudType(user.department)}
                </td>
                <td style={cell}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, color: riskColor(user.risk_score), fontVariantNumeric: 'tabular-nums', minWidth: 22 }}>
                      {Math.round(user.risk_score)}
                    </span>
                    <TrendArrow trend={user.risk_trend} />
                    <RiskBadge level={level} size="sm" />
                  </div>
                </td>
                <td style={{ ...cell, color: C.textMuted, fontSize: 13 }}>
                  {timeAgo(user.last_seen)}
                </td>
                <td style={{ ...cell, textAlign: 'right' }}>
                  {onSelectUser && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); onSelectUser(user.id) }}
                    >
                      View profile
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {users.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 14 }}>
          No one matches this view. Clear the search or filters to see the full workforce.
        </div>
      )}
    </div>
  )
}
