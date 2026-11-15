/**
 * ALTAIR — TelemetryPanel Component
 * Right panel: Fidelity score, comparative metrics, and risk assessment report.
 */

import { AlertTriangle, CheckCircle, AlertCircle, XCircle, Info, Database } from 'lucide-react'
import useStore from '../store/useStore'

// ── Risk level config ─────────────────────────────────────────────────────────
const RISK_CONFIG = {
  LOW:      { color: '#22C55E', Icon: CheckCircle,  badgeClass: 'risk-badge-low' },
  MODERATE: { color: '#F59E0B', Icon: AlertCircle,  badgeClass: 'risk-badge-moderate' },
  HIGH:     { color: '#F59E0B', Icon: AlertTriangle, badgeClass: 'risk-badge-high' },
  CRITICAL: { color: '#EF4444', Icon: XCircle,       badgeClass: 'risk-badge-critical' },
}

// ── Fidelity gauge ────────────────────────────────────────────────────────────
function FidelityGauge({ value, accentColor }) {
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

      {/* Large value */}
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

      {/* Bar */}
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
        <div
          className="fidelity-bar-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ── Metric row ────────────────────────────────────────────────────────────────
function MetricRow({ metric }) {
  const getScoreColor = (s) => {
    if (s >= 70) return '#22C55E'
    if (s >= 40) return '#F59E0B'
    return '#EF4444'
  }
  const color = getScoreColor(metric.score)

  const fmt = (v, dec = 1) => v == null ? '—' : Number(v).toFixed(dec)

  return (
    <div className="px-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xs text-text-secondary font-medium">{metric.metric}</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-10 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${metric.score}%`, background: color }}
            />
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
          <span className="text-text-primary">
            {metric.target_value === 0 ? '0' : fmt(metric.target_value)} {metric.unit}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Risk item ─────────────────────────────────────────────────────────────────
function RiskItem({ item }) {
  const cfg = RISK_CONFIG[item.level] || RISK_CONFIG.MODERATE
  const { Icon, color, badgeClass } = cfg

  return (
    <div className="px-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={11} style={{ color }} className="shrink-0" />
        <span className="text-2xs font-semibold text-text-primary">{item.system}</span>
        <span className={`ml-auto text-2xs font-mono font-bold px-1.5 py-px rounded-sm ${badgeClass}`}>
          {item.level}
        </span>
      </div>
      <p className="text-2xs text-text-secondary leading-relaxed">{item.detail}</p>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ accentColor }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
      <div
        className="w-10 h-10 rounded-sm border flex items-center justify-center"
        style={{ borderColor: `${accentColor}30`, background: `${accentColor}08` }}
      >
        <Info size={18} style={{ color: accentColor }} />
      </div>
      <div>
        <div className="text-xs font-medium text-text-primary mb-1">No Analysis Active</div>
        <div className="text-2xs text-text-dim leading-relaxed">
          Click anywhere on the map or select a preset analog site to begin fidelity analysis.
        </div>
      </div>
    </div>
  )
}

// ── Main TelemetryPanel ───────────────────────────────────────────────────────
export default function TelemetryPanel() {
  const selectedTarget = useStore((s) => s.selectedTarget)
  const analysisResult = useStore((s) => s.analysisResult)
  const isAnalyzing = useStore((s) => s.isAnalyzing)
  const analysisError = useStore((s) => s.analysisError)
  const clickedCoords = useStore((s) => s.clickedCoords)

  const isMoon = selectedTarget?.id === 'lunar_south_pole'
  const accentColor = isMoon ? '#29B6F6' : '#EF4444'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      {/* Panel header */}
      <div className="panel-header shrink-0">
        <Database size={11} style={{ color: accentColor }} />
        <div className="label-tag">Live Telemetry & Fidelity Diagnostics</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-4 rounded-full animate-pulse"
                  style={{ background: accentColor, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <div className="text-2xs text-text-dim font-mono">Querying NASA POWER API…</div>
          </div>
        )}

        {/* Error state */}
        {!isAnalyzing && analysisError && (
          <div className="m-3 p-3 bg-crimson/10 border border-crimson/20 rounded-sm">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={12} className="text-crimson" />
              <span className="text-xs font-semibold text-crimson">Analysis Failed</span>
            </div>
            <p className="text-2xs text-text-secondary">{analysisError}</p>
          </div>
        )}

        {/* Empty state */}
        {!isAnalyzing && !analysisError && !analysisResult && (
          <EmptyState accentColor={accentColor} />
        )}

        {/* Results */}
        {!isAnalyzing && analysisResult && (
          <div className="animate-slide-up">
            {/* Fidelity gauge */}
            <FidelityGauge value={analysisResult.overall_fidelity_pct} accentColor={accentColor} />

            {/* Earth telemetry quick stats */}
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
                      {value != null ? `${Number(value).toFixed(1)} ${unit}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-metric comparisons */}
            <div>
              <div className="px-3 py-2 border-b border-border">
                <div className="label-tag">Metric Comparisons</div>
              </div>
              {analysisResult.metric_comparisons.map((m) => (
                <MetricRow key={m.metric} metric={m} />
              ))}
            </div>

            {/* Operational summary */}
            <div className="p-3 border-t border-border bg-elevated/30">
              <div className="label-tag mb-1.5">Operational Assessment</div>
              <p className="text-2xs text-text-secondary leading-relaxed font-mono">
                {analysisResult.operational_summary}
              </p>
            </div>

            {/* Risk items */}
            <div>
              <div className="px-3 py-2 border-t border-border">
                <div className="label-tag">Risk Assessment</div>
              </div>
              {analysisResult.risk_assessment.map((item, i) => (
                <RiskItem key={i} item={item} />
              ))}
            </div>

            {/* Data sources */}
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
