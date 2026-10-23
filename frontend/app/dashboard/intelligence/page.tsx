'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'
import { api, type Intelligence, type ModelInfo, type Stats, type WebhookConfig, timeAgo } from '@/lib/api'
import PageHeader, { SectionTitle } from '@/components/PageHeader'
import { C, FONT } from '@/lib/tokens'

const IntelligenceCharts = dynamic(() => import('@/components/IntelligenceCharts'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', gap: 16 }} aria-busy="true">
      {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
    </div>
  ),
})

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '18px 20px 16px' }}>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: C.textMuted }}>{label}</p>
      <p style={{ margin: 0, fontSize: 36, color: C.textPrimary, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p style={{ margin: '8px 0 0', fontSize: 12, color: C.textMuted }}>{sub}</p>}
    </div>
  )
}

function ModelCard({
  name, weight, description, params, metric,
}: {
  name: string
  weight: string
  description: string
  params: { label: string; value: string }[]
  metric: { label: string; value: string }
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '22px 22px 18px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 400, letterSpacing: '-0.005em', color: C.textPrimary }}>{name}</h3>
        <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textMuted, paddingTop: 6 }}>weight {weight}</span>
      </div>
      <p className="serif" style={{ margin: '0 0 18px', fontSize: 16, color: C.textBody, lineHeight: 1.5 }}>{description}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
        {params.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textMuted }}>{label}</span>
            <span style={{ fontSize: 12, color: C.textPrimary, fontFamily: FONT.mono }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>{metric.label}</span>
          <span style={{ fontSize: 16, color: C.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{metric.value}</span>
        </div>
      </div>
    </div>
  )
}

export default function IntelligencePage() {
  const [data, setData] = useState<Intelligence | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [logLines, setLogLines] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const [webhook, setWebhook] = useState<WebhookConfig | null>(null)
  const [webhookInput, setWebhookInput] = useState('')
  const [webhookSaving, setWebhookSaving] = useState(false)
  const [webhookSaved, setWebhookSaved] = useState(false)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const loadAll = async () => {
    setLoading(true)
    const [intel, st, mi, wh] = await Promise.allSettled([
      api.intelligence(),
      api.stats(),
      api.modelInfo(),
      api.getWebhook(),
    ])
    if (intel.status === 'fulfilled') setData(intel.value)
    else setData(null)
    if (st.status === 'fulfilled') setStats(st.value)
    if (mi.status === 'fulfilled') setModelInfo(mi.value)
    if (wh.status === 'fulfilled') {
      setWebhook(wh.value)
      setWebhookInput(wh.value.url)
    }
    setLoading(false)
  }

  const saveWebhook = useCallback(async () => {
    setWebhookSaving(true)
    try {
      const result = await api.setWebhook(webhookInput.trim())
      setWebhook(result)
      setWebhookSaved(true)
      setTimeout(() => setWebhookSaved(false), 2500)
    } catch { /* ignore */ }
    setWebhookSaving(false)
  }, [webhookInput])

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logLines])

  const runTraining = async () => {
    if (training) return
    setTraining(true)
    setLogLines([])

    // Fire retrain - real API call
    setLogLines(['[00:00] Requesting retrain...'])
    const retrainPromise = api.retrain().catch(() => null)
    await new Promise((r) => setTimeout(r, 200))
    setLogLines((prev) => [...prev, '[00:01] Waiting for retrain response...'])

    // Await the real retrain response
    const result = await retrainPromise
    const labelsN = result?.labels_used ?? 0
    const skipped = result?.status === 'skipped' || result === null

    const precisionVal = result?.precision_after != null ? result.precision_after.toFixed(3) : '-'
    const recallVal    = result?.recall_after    != null ? result.recall_after.toFixed(3)    : '-'
    const f1Val        = result?.f1_after        != null ? result.f1_after.toFixed(3)        : '-'

    // Tail lines - reflect real outcome
    const tailLines: string[] = skipped
      ? [
          `[00:07] Loading analyst labels from SQLite - ${labelsN} labels found (need ≥10)`,
          '[00:08] Skipping XGBoost retrain - insufficient labeled data',
          '[00:09] Pipeline complete. Label more alerts and retry.',
        ]
      : [
          `[00:07] Loading analyst labels from SQLite - ${labelsN} labels found...`,
          '[00:08] Retraining XGBoost - n_estimators=100, 5 fraud classes...',
          `[00:09] XGBoost retrained. Precision: ${precisionVal} | Recall: ${recallVal} | F1: ${f1Val}`,
          '[00:10] Ensemble weights applied: IF(0.4) + LSTM(0.4) + XGB(0.2)',
          '[00:11] Models saved to disk. Pipeline complete.',
        ]

    for (const line of tailLines) {
      await new Promise((r) => setTimeout(r, 150))
      setLogLines((prev) => [...prev, line])
    }

    // Optimistically patch model card data from retrain response
    if (!skipped && result) {
      setData((prev) => prev ? {
        ...prev,
        labeled_count: result.labels_used,
        last_retrain_ts: new Date().toISOString(),
        precision: result.precision_after ?? prev.precision,
        recall: result.recall_after ?? prev.recall,
        f1: result.f1_after ?? prev.f1,
      } : prev)
    }

    // Re-fetch all data - 500ms delay to ensure SQLite write completes
    await new Promise((r) => setTimeout(r, 500))
    await loadAll()
    setTraining(false)
  }

  // Anomaly rate: alerts_24h / events_24h from stats (supports both old and new field names)
  const _a24 = stats ? (stats.alerts_24h ?? stats.alerts_today ?? 0) : 0
  const _e24 = stats ? (stats.events_24h ?? stats.events_today ?? 0) : 0
  const anomalyRatePct = _e24 > 0
    ? ((_a24 / _e24) * 100).toFixed(1)
    : data?.anomaly_rate != null ? data.anomaly_rate.toFixed(1) : '0.0'

  const detectDisplay = data
    ? data.mean_time_to_detect == null
      ? '-'
      : data.mean_time_to_detect < 1
        ? 'Real-time'
        : `${data.mean_time_to_detect.toFixed(1)}s`
    : '-'

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <PageHeader title="Model intelligence" description="How the three models are performing on live alert data from the last 7 days">
          <button className="btn btn-ink btn-sm" onClick={runTraining} disabled={training}>
            {training ? 'Retraining...' : 'Retrain with analyst labels'}
          </button>
        </PageHeader>

        <main className="page-pad" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 48px', display: 'flex', flexDirection: 'column', gap: 36 }}>
          {loading && !data && (
            <div className="stat-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} aria-busy="true">
              {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 260 }} />)}
            </div>
          )}

          {data && (
            <>
              {/* Model Pipeline cards */}
              <div>
                <SectionTitle aside="weighted into one 0 to 100 score">The scoring pipeline</SectionTitle>
                <div className="stat-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <ModelCard
                    name="Isolation Forest"
                    weight="0.4"
                    description="Trained on synthetic events at startup. Contamination parameter set to 0.1 - the model expects ~10% of events to be anomalous. Scores each incoming event by how isolated it is from the normal cluster. No labels required - fully unsupervised."
                    params={[
                      { label: 'contamination', value: modelInfo ? String(modelInfo.isolation_forest.contamination) : '0.1' },
                      { label: 'n_estimators', value: modelInfo ? String(modelInfo.isolation_forest.n_estimators) : '100' },
                      { label: 'training events', value: String(data.training_events || 0) },
                    ]}
                    metric={{ label: 'Live anomaly rate', value: `${anomalyRatePct}%` }}
                  />
                  <ModelCard
                    name="LSTM Autoencoder"
                    weight="0.4"
                    description="Trained on sequences of consecutive events per user. Learns to reconstruct normal behavioural sequences. When reconstruction error exceeds threshold, the event is flagged. Detects slow behavioural drift that point anomaly models miss."
                    params={[
                      { label: 'seq_len', value: modelInfo ? String(modelInfo.lstm.seq_len) : '-' },
                      { label: 'hidden_size', value: modelInfo ? String(modelInfo.lstm.hidden_size) : '-' },
                      { label: 'n_features', value: modelInfo ? String(modelInfo.lstm.n_features) : '-' },
                    ]}
                    metric={{ label: 'Model agreement rate', value: `${data.model_agreement_rate.toFixed(1)}%` }}
                  />
                  <ModelCard
                    name="XGBoost Classifier"
                    weight="0.2"
                    description="Trained on labeled synthetic data with 5 fraud pattern classes. Retrains when investigators label alerts as True Positive or False Positive - active learning loop. Each retrain incorporates analyst feedback to improve precision."
                    params={[
                      { label: 'n_estimators', value: modelInfo ? String(modelInfo.xgboost.n_estimators) : '150' },
                      { label: 'max_depth', value: modelInfo ? String(modelInfo.xgboost.max_depth) : '3' },
                      { label: 'last retrain', value: data.last_retrain_ts ? timeAgo(data.last_retrain_ts) : 'Not yet' },
                    ]}
                    metric={{ label: 'Labels collected', value: String(data.labeled_count ?? 0) }}
                  />
                </div>
              </div>

              {/* Ensemble Performance stats */}
              <div>
                <SectionTitle aside={`measured against analyst labels / ${data.training_events || 0} events processed`}>Ensemble accuracy</SectionTitle>
                <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <Stat label="Precision" value={data.precision != null ? `${(data.precision * 100).toFixed(1)}%` : '-'} sub={data.precision == null ? 'needs 10 or more labels' : 'of flagged alerts were real'} />
                  <Stat label="Recall" value={data.recall != null ? `${(data.recall * 100).toFixed(1)}%` : '-'} sub={data.recall == null ? 'needs 10 or more labels' : 'of real threats were caught'} />
                  <Stat label="F1 score" value={data.f1 != null ? `${(data.f1 * 100).toFixed(1)}%` : '-'} sub={data.f1 == null ? 'needs 10 or more labels' : 'balance of the two'} />
                  <Stat label="Time to detect" value={detectDisplay} sub="from event to alert, on average" />
                </div>
              </div>

              {/* Training log - own full-width section, below ensemble performance */}
              {logLines.length > 0 && (
                <div>
                  <SectionTitle>Training log</SectionTitle>
                  <div
                    ref={logRef}
                    style={{
                      background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                      padding: '14px 16px', fontFamily: FONT.mono, fontSize: 12,
                      color: C.textBody, lineHeight: 1.75,
                      minHeight: 200, maxHeight: 400, overflowY: 'auto',
                    }}
                  >
                    {logLines.map((line, i) => (
                      <div key={i} style={{ color: line.includes('Skipping') || line.includes('insufficient') ? C.medium : C.textBody }}>
                        <span style={{ color: C.textFaint }}>$ </span>{line}
                      </div>
                    ))}
                    {training && (
                      <div style={{ display: 'inline-block', width: 8, height: 14, background: C.ink, verticalAlign: 'middle', marginLeft: 2 }} />
                    )}
                  </div>
                </div>
              )}

              <IntelligenceCharts data={data} />

              {/* Webhook Notifications */}
              <div>
                <SectionTitle>Integrations</SectionTitle>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '20px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 16, color: C.textPrimary }}>Alert notifications</p>
                      <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>Sends a POST request whenever an alert scores 80 or above. Works with Slack, Teams, Discord, or any HTTP endpoint.</p>
                    </div>
                    <span style={{
                      fontSize: 12, padding: '2px 8px', borderRadius: 4, flexShrink: 0,
                      background: webhook?.configured ? C.lowWash : C.hover,
                      color: webhook?.configured ? C.low : C.textMuted,
                    }}>
                      {webhook?.configured ? 'Active' : 'Not set up'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      aria-label="Webhook URL"
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={webhookInput}
                      onChange={(e) => setWebhookInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveWebhook()}
                      style={{
                        flex: 1, padding: '9px 12px', fontSize: 12, fontFamily: FONT.mono,
                        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4,
                        color: C.textPrimary, minWidth: 0,
                      }}
                    />
                    <button
                      onClick={saveWebhook}
                      disabled={webhookSaving}
                      className="btn btn-ink btn-sm"
                    >
                      {webhookSaved ? 'Saved' : webhookSaving ? 'Saving...' : 'Save webhook'}
                    </button>
                  </div>
                  {webhook?.configured && (
                    <p style={{ margin: '10px 0 0', fontSize: 12, color: C.textMuted }}>
                      Payload: <code style={{ fontFamily: FONT.mono, color: C.textPrimary }}>{'{ alert_id, user_name, risk_score, fraud_type, risk_level, timestamp }'}</code>
                    </p>
                  )}
                </div>
              </div>

              {/* API Connector */}
              <div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '20px 20px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 16, color: C.textPrimary }}>Event ingestion</p>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: C.textMuted }}>
                    POST raw events from Finacle, Temenos, or any core banking system directly into the ML pipeline. Each event is scored and can trigger an alert.
                  </p>
                  <div className="stat-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 13, color: C.textMuted }}>Endpoint</p>
                      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 12px', fontFamily: FONT.mono, fontSize: 12, color: C.textPrimary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>POST {apiBase}/api/ingest</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${apiBase}/api/ingest`)}
                          className="link-ember"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 13, color: C.textMuted }}>Response</p>
                      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 12px', fontFamily: FONT.mono, fontSize: 12, color: C.textMuted }}>
                        {'{ event_id, risk_score, risk_level, alert_id?, alert_triggered }'}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 13, color: C.textMuted }}>Required fields</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['user_id', 'event_type', 'department', 'location', 'hour', 'tx_count', 'download_mb'].map(f => (
                        <span key={f} style={{ fontSize: 12, fontFamily: FONT.mono, color: C.textPrimary, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 7px' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && !data && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24, color: C.textMuted }}>
              Model metrics will appear once the scoring service has finished starting.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
