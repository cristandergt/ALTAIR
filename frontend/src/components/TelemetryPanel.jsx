/**
 * ALTAIR — TelemetryPanel Component
 * Right panel: Fidelity score, comparative metrics, and risk assessment report.
 */

import { AlertTriangle, CheckCircle, AlertCircle, XCircle, Info, Database, Target } from 'lucide-react'
import useStore from '../store/useStore'

const RISK_CONFIG = {
  LOW:      { color: '#22C55E', Icon: CheckCircle,  badgeClass: 'risk-badge-low' },
  MODERATE: { color: '#F59E0B', Icon: AlertCircle,  badgeClass: 'risk-badge-moderate' },
  HIGH:     { color: '#F59E0B', Icon: AlertTriangle, badgeClass: 'risk-badge-high' },
  CRITICAL: { color: '#EF4444', Icon: XCircle,       badgeClass: 'risk-badge-critical' },
}

function FidelityGauge({ value }) {
  const getColor = (v) => {
    if (v >= 70) return '#22C55E'
    if (v >= 50) return '#F59E0B'
    if (v >= 30) return '#F59E0B'
    return '#EF4444'
  }
  const color = getColor(value)
  const getGrade = (v) => {
    if (v >= 75) return 'HIGH-FIDELITY'
    if (v >= 50) return 'MODERATE'
    if (v >= 30) return 'LOW-FIDELITY'
    return 'NON-ANALOG'
  }

  return (
    <div className="p-3 border-b border-border">
      <div className="label-tag mb-2">Analog Fidelity Score</div>
      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-4xl font-mono font-bold" style={{ color }}>
          {value.toFixed(1)}
        </div>
        <div className="text-text-dim font-mono text-sm">%</div>
        <div className="ml-auto">
          <div
            className="text-2xs font-mono font-semibold px-2 py-0.5 rounded-sm border"
            style={{ color, borderColor: `${color}40`, background: `${color}10` }}
          >
            {getGrade(value)}
          </div>
        </div>
      </div>
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
        <div className="fidelity-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

function MetricRow({ metric }) {
  const getScoreColor = (s) => {
    if (s >= 70) return '#22C55E'
    if (s >= 40) return '#F59E0B'
    return '#EF4444'
  }
  const color = getScoreColor(metric.score)
  const fmt = (v, dec = 1) => (v == null ? '-' : Number(v).toFixed(dec))

  return (
    <div className="px-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xs text-text-secondary font-medium">{metric.metric}</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-10 bg-elevated rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${metric.score}%`, background: color }} />
          </div>
          <span className="font-mono text-2xs" style={{ color }}>{metric.score}%</span>
        </div>
      </div>
      <div className="flex items-center gap-3 font-mono text-2xs">
        <div>
          <span className="text-text-dim">Earth: </span>
          <span className="text-text-primary">{fmt(metric.earth_value)} {metric.unit}</span>
        </div>
        <div className="text-border">|</div>
        <div>
          <span className="text-text-dim">Target: </span>
          <span className="text-text-primary">{metric.target_value === 0 ? '0' : fmt(metric.target_value)} {metric.unit}</span>
        </div>
      </div>
    </div>
  )
}

function RiskItem({ item }) {
  const cfg = RISK_CONFIG[item.level] || RISK_CONFIG.MODERATE
  const { Icon, color, badgeClass } = cfg
  return (
    <div className="px-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={11} style={{ color }} className="shrink-0" />
        <span className="text-2xs font-semibold text-text-primary">{item.system}</span>
        <span className={`ml-auto text-2xs font-mono font-bold px-1.5 py-px rounded-sm ${badgeClass}`}>{item.level}</span>
      </div>
      <p className="text-2xs text-text-secondary leading-relaxed">{item.detail}</p>
    </div>
  )
}

function buildDecisionSupport(result, hardware) {
  const score = result.overall_fidelity_pct ?? 0
  const risks = result.risk_assessment || []
  const critical = risks.filter((r) => r.level === 'CRITICAL' || r.level === 'HIGH')
  let readiness = 'Exploratory only'
  let readinessColor = '#EF4444'
  if (score >= 75 && critical.length === 0) { readiness = 'Strong analog candidate'; readinessColor = '#22C55E' }
  else if (score >= 50) { readiness = 'Viable for targeted tests'; readinessColor = '#F59E0B' }

  const sorted = [...(result.metric_comparisons || [])].sort((a, b) => b.score - a.score)
  const strength = sorted[0]
  const gap = sorted[sorted.length - 1]
  const uses = score >= 60
    ? [`${hardware} procedure rehearsal`, 'Subsystem validation in relevant conditions', 'Crew/ops training & contingency drills']
    : [`Isolated ${hardware} subsystem tests`, 'Environmental risk characterization', 'Compare with additional candidate sites']

  return { readiness, readinessColor, strength, gap, criticalCount: critical.length, uses }
}

function MissionBrief({ result, hardware, accentColor }) {
  const d = buildDecisionSupport(result, hardware)
  const dq = result.earth_telemetry?.data_quality
  const dqColor = dq?.status === 'live' ? '#22C55E' : (dq?.status === 'unavailable' ? '#EF4444' : '#F59E0B')
  return (
    <div className="p-3 border-b border-border bg-elevated/20">
      <div className="flex items-center gap-2 mb-2">
        <Target size={12} style={{ color: accentColor }} />
        <div className="label-tag">Mission Decision Brief</div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs text-text-secondary">Readiness</span>
        <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded-sm border"
          style={{ color: d.readinessColor, borderColor: `${d.readinessColor}40`, background: `${d.readinessColor}10` }}>
          {d.readiness}
        </span>
      </div>
      {dq && (
        <div className="mb-2 px-2 py-1.5 rounded-sm border" style={{ borderColor: `${dqColor}33`, background: `${dqColor}0f` }}>
          <div className="flex items-center justify-between gap-2">
            <span className="label-tag">Data Quality</span>
            <span className="text-2xs font-mono" style={{ color: dqColor }}>{dq.label}</span>
          </div>
          {dq.status !== 'live' && <div className="text-2xs text-text-dim mt-1">Results remain usable for demo via resilience fallback/partial data; verify with live sources when available.</div>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-void/40 rounded-sm p-2 border border-border/40">
          <div className="label-tag mb-1">Top Strength</div>
          <div className="text-2xs text-text-primary">{d.strength?.metric || '-'}</div>
          <div className="font-mono text-2xs text-green-ok">{d.strength ? `${d.strength.score}%` : ''}</div>
        </div>
        <div className="bg-void/40 rounded-sm p-2 border border-border/40">
          <div className="label-tag mb-1">Key Gap</div>
          <div className="text-2xs text-text-primary">{d.gap?.metric || '-'}</div>
          <div className="font-mono text-2xs text-amber">{d.gap ? `${d.gap.score}%` : ''}</div>
        </div>
      </div>
      <div className="label-tag mb-1">Recommended Use ({hardware})</div>
      <ul className="space-y-0.5 mb-2">
        {d.uses.map((u, i) => (
          <li key={i} className="text-2xs text-text-secondary leading-relaxed">• {u}</li>
        ))}
      </ul>
      <div className="text-2xs text-text-dim leading-relaxed">
        Earth: NASA POWER + Open-Elevation (live when available). Target: curated NASA mission refs. Scoring: heuristic decision-support (not flight-certified). {d.criticalCount > 0 ? `${d.criticalCount} high/critical risk flags.` : 'No high/critical risk flags.'}
      </div>
      {result.methodology && (
        <div className="mt-2 pt-2 border-t border-border/40">
          <div className="label-tag mb-1">Methodology & Limits</div>
          <div className="text-2xs text-text-dim leading-relaxed">• {result.methodology.scoring}</div>
          <div className="text-2xs text-text-dim leading-relaxed">• {result.methodology.interpretation}</div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ accentColor }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
      <div className="w-10 h-10 rounded-sm border flex items-center justify-center" style={{ borderColor: `${accentColor}30`, background: `${accentColor}08` }}>
        <Info size={18} style={{ color: accentColor }} />
      </div>
      <div>
        <div className="text-xs font-medium text-text-primary mb-1">No Analysis Active</div>
        <div className="text-2xs text-text-dim leading-relaxed">
          Click the map or select a preset analog site to generate a NASA-data mission brief.
        </div>
      </div>
      <div className="w-full text-left bg-elevated/30 border border-border/60 rounded-sm p-2.5 space-y-1">
        <div className="label-tag">What you get</div>
        <div className="text-2xs text-text-secondary">• Live Earth telemetry (NASA POWER) vs. Moon/Mars targets</div>
        <div className="text-2xs text-text-secondary">• Hardware-aware fidelity, risks, and readiness guidance</div>
        <div className="text-2xs text-text-secondary">• Faster analog-site screening for mission planning & training</div>
      </div>
    </div>
  )
}

export default function TelemetryPanel() {
  const selectedTarget = useStore((s) => s.selectedTarget)
  const selectedHardware = useStore((s) => s.selectedHardware)
  const analysisResult = useStore((s) => s.analysisResult)
  const isAnalyzing = useStore((s) => s.isAnalyzing)
  const analysisError = useStore((s) => s.analysisError)

  const isMoon = selectedTarget?.id === 'lunar_south_pole'
  const accentColor = isMoon ? '#29B6F6' : '#EF4444'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      <div className="panel-header shrink-0">
        <Database size={11} style={{ color: accentColor }} />
        <div className="label-tag">Live Telemetry & Fidelity Diagnostics</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1 h-4 rounded-full animate-pulse" style={{ background: accentColor, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <div className="text-2xs text-text-dim font-mono">Querying NASA POWER API...</div>
          </div>
        )}

        {!isAnalyzing && analysisError && (
          <div className="m-3 p-3 bg-crimson/10 border border-crimson/20 rounded-sm">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={12} className="text-crimson" />
              <span className="text-xs font-semibold text-crimson">Analysis Failed</span>
            </div>
            <p className="text-2xs text-text-secondary">{analysisError}</p>
            <p className="text-2xs text-text-dim mt-2">Tip: for a resilient demo, select a preset analog site (left panel) to use curated fallback telemetry if live APIs are unavailable.</p>
          </div>
        )}

        {!isAnalyzing && !analysisError && !analysisResult && (
          <EmptyState accentColor={accentColor} />
        )}

        {!isAnalyzing && analysisResult && (
          <div className="animate-slide-up">
            <FidelityGauge value={analysisResult.overall_fidelity_pct} />
            <MissionBrief result={analysisResult} hardware={selectedHardware} accentColor={accentColor} />

            <div className="p-3 border-b border-border">
              <div className="label-tag mb-2">Earth Site Telemetry</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Temp (Mean)', value: analysisResult.earth_telemetry.temperature_mean_c, unit: '°C' },
                  { label: 'Solar', value: analysisResult.earth_telemetry.solar_irradiance_wm2, unit: 'W/m²' },
                  { label: 'Wind', value: analysisResult.earth_telemetry.wind_speed_ms, unit: 'm/s' },
                  { label: 'Elevation', value: analysisResult.earth_telemetry.elevation_m, unit: 'm' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="bg-elevated/50 rounded-sm p-1.5">
                    <div className="label-tag mb-0.5">{label}</div>
                    <div className="font-mono text-xs text-text-primary">
                      {value != null ? `${Number(value).toFixed(1)} ${unit}` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="px-3 py-2 border-b border-border">
                <div className="label-tag">Metric Comparisons</div>
              </div>
              {analysisResult.metric_comparisons.map((m) => (
                <MetricRow key={m.metric} metric={m} />
              ))}
            </div>

            <div className="p-3 border-t border-border bg-elevated/30">
              <div className="label-tag mb-1.5">Operational Assessment</div>
              <p className="text-2xs text-text-secondary leading-relaxed font-mono">
                {analysisResult.operational_summary}
              </p>
            </div>

            <div>
              <div className="px-3 py-2 border-t border-border">
                <div className="label-tag">Risk Assessment</div>
              </div>
              {analysisResult.risk_assessment.map((item, i) => (
                <RiskItem key={i} item={item} />
              ))}
            </div>

            <div className="p-3 border-t border-border bg-void/40">
              <div className="label-tag mb-1.5">Data Sources</div>
              {analysisResult.data_sources.map((src, i) => (
                <div key={i} className="text-2xs text-text-dim font-mono leading-relaxed">{src}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
