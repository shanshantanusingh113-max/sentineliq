'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import CommandPalette from '@/components/CommandPalette'
import { api, type Alert, type User } from '@/lib/api'
import { C, SHADOW } from '@/lib/tokens'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [backendStatus, setBackendStatus] = useState<'ok' | 'initializing' | 'offline'>('ok')
  const gMode = useRef(false)

  useEffect(() => {
    const check = () => api.health()
      .then((r) => setBackendStatus(r.status === 'initializing' ? 'initializing' : 'ok'))
      .catch(() => setBackendStatus('offline'))
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const load = () => api.alerts({ status: 'open', page_size: 50 }).then(r => setAlerts(r.alerts)).catch(() => null)
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    api.users().then(setUsers).catch(() => null)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); setCmdkOpen(true); return }
      if (k === 'escape') { setCmdkOpen(false); return }
      if (gMode.current) {
        const routes: Record<string, string> = {
          h: '/dashboard', a: '/dashboard/alerts', c: '/dashboard/cases',
          i: '/dashboard/intelligence', u: '/dashboard/users',
        }
        if (routes[k]) { router.push(routes[k]) }
        gMode.current = false
      } else if (k === 'g' && !e.ctrlKey && !e.metaKey) {
        gMode.current = true
        setTimeout(() => { gMode.current = false }, 800)
      }
    }
    window.addEventListener('keydown', onKey)
    const onCustom = () => setCmdkOpen(true)
    window.addEventListener('sentinel:cmdk', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('sentinel:cmdk', onCustom)
    }
  }, [router])

  return (
    <>
      {backendStatus !== 'ok' && (
        <div role="status" style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: C.ink, color: C.onInk, borderRadius: 4, boxShadow: SHADOW.popover,
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, maxWidth: 'calc(100vw - 32px)',
        }}>
          <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: backendStatus === 'offline' ? C.critical : C.medium }} />
          {backendStatus === 'offline'
            ? <span>Can&apos;t reach the scoring service. Showing the last data received and retrying every 30 seconds.</span>
            : <span>Training models and loading the demo workforce. This takes about 30 seconds.</span>}
        </div>
      )}
      {children}
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} alerts={alerts} users={users} />
    </>
  )
}
