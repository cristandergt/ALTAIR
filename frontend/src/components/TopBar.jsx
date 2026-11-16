/**
 * ALTAIR — TopBar Component
 * Mission context header with target, status, and navigation.
 */

import { Satellite, ArrowLeft, Activity } from 'lucide-react'
import useStore from '../store/useStore'

export default function TopBar() {
  const selectedTarget = useStore((s) => s.selectedTarget)
  const appPhase = useStore((s) => s.appPhase)
  const isMoon = selectedTarget?.id === 'lunar_south_pole'
  const accentColor = isMoon ? '#29B6F6' : '#EF4444'

  return (
    <div
      className="flex items-center justify-between px-4 h-11 border-b border-border bg-surface/80 shrink-0"
      style={{ borderBottomColor: `${accentColor}22` }}
    >
      {/* Left: navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => useStore.setState({ appPhase: 'destination', analysisResult: null, clickedCoords: null })}
          className="flex items-center gap-2 px-3 py-1.5 border rounded-sm text-xs font-semibold tracking-wide transition-colors"
          style={{ borderColor: `${accentColor}66`, color: accentColor, background: `${accentColor}14` }}
          title="Return to mission target selection"
        >
          <ArrowLeft size={13} />
          CHANGE PLANET
        </button>

        <div className="flex items-center gap-2 pl-1">
          <Satellite size={12} style={{ color: accentColor }} />
          <span className="label-tag" style={{ color: accentColor }}>
            {selectedTarget?.shortName?.toUpperCase() || 'TARGET'}
          </span>
          <span className="text-border">›</span>
          <span className="label-tag">COMMAND CENTER</span>
        </div>
      </div>

      {/* Center: system name */}
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <div className="w-1 h-1 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
        <span className="text-xs font-semibold tracking-[0.2em] text-text-primary">ALTAIR</span>
        <div className="w-1 h-1 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
      </div>

      {/* Right: status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity size={11} className="text-green-ok" />
          <span className="label-tag text-green-ok">NOMINAL</span>
        </div>
        <div className="label-tag">STALRED · STRD</div>
      </div>
    </div>
  )
}
