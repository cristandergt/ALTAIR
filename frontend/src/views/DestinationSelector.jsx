/**
 * ALTAIR — Destination Selector View
 * Cinematic mission target selection screen.
 * SpaceX telemetry / NASA Mission Control aesthetic.
 */

import { useEffect, useState } from 'react'
import { ChevronRight, Satellite, AlertTriangle } from 'lucide-react'
import useStore from '../store/useStore'
import { fetchPlanets } from '../api/client'

// ── Reticle / corner decoration ──────────────────────────────────────────────
const Corner = ({ pos }) => {
  const base = 'absolute w-4 h-4 border-cyan'
  const styles = {
    tl: 'top-0 left-0 border-t border-l',
    tr: 'top-0 right-0 border-t border-r',
    bl: 'bottom-0 left-0 border-b border-l',
    br: 'bottom-0 right-0 border-b border-r',
  }
  return <span className={`${base} ${styles[pos]}`} />
}

const TargetCard = ({ target, onSelect, isHovered, onHover, onLeave }) => {
  const isMoon = target.id === 'lunar_south_pole'

  return (
    <button
      className={`
        relative group flex flex-col h-full border transition-all duration-300 cursor-pointer
        text-left select-none overflow-hidden
        ${isHovered
          ? isMoon
            ? 'border-cyan/60 bg-elevated shadow-cyan-glow'
            : 'border-crimson/60 bg-elevated shadow-crimson-glow'
          : 'border-border bg-panel hover:border-muted'
        }
      `}
      onClick={() => onSelect(target)}
      onMouseEnter={() => onHover(target.id)}
      onMouseLeave={onLeave}
    >
      {/* Top accent bar */}
      <div
        className="h-0.5 w-full transition-all duration-500"
        style={{
          background: isHovered
            ? isMoon
              ? 'linear-gradient(90deg, transparent, #29B6F6, transparent)'
              : 'linear-gradient(90deg, transparent, #EF4444, transparent)'
            : 'transparent',
        }}
      />

      {/* Grid background overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative p-8 flex flex-col h-full gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="label-tag mb-2">Mission Target</div>
            <div
              className="text-3xl mb-1"
              style={{ color: isMoon ? '#29B6F6' : '#EF4444' }}
            >
              {target.flag_emoji} {target.shortName}
            </div>
            <div className="text-text-secondary text-xs font-medium leading-snug">
              {target.name}
            </div>
          </div>

          <div
            className={`
              w-10 h-10 rounded-sm border flex items-center justify-center transition-all duration-300
              ${isHovered
                ? isMoon
                  ? 'border-cyan/40 bg-cyan/10'
                  : 'border-crimson/40 bg-crimson/10'
                : 'border-border bg-elevated'
              }
            `}
          >
            <Satellite
              size={18}
              style={{ color: isMoon ? '#29B6F6' : '#EF4444' }}
            />
          </div>
        </div>

        {/* Telemetry preview */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Temp Range', value: `${target.parameters.temperature_min_c}° → ${target.parameters.temperature_max_c}°C` },
            { label: 'Pressure', value: target.parameters.atmospheric_pressure_atm === 0 ? 'Vacuum (0 atm)' : `${target.parameters.atmospheric_pressure_atm} atm` },
            { label: 'Gravity', value: `${target.parameters.gravity_ms2} m/s²` },
            { label: 'Radiation', value: `${target.parameters.radiation_msv_day} mSv/day` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-void/50 rounded-sm p-2 border border-border/50">
              <div className="label-tag mb-1">{label}</div>
              <div className="font-mono text-xs text-text-primary">{value}</div>
            </div>
          ))}
        </div>

        {/* Source */}
        <div className="mt-auto">
          <div className="label-tag mb-1">Data Source</div>
          <div className="text-text-dim text-2xs font-mono leading-relaxed">{target.source}</div>
        </div>

        {/* Select CTA */}
        <div
          className={`
            flex items-center gap-2 text-xs font-semibold tracking-wide transition-all duration-300
            ${isHovered
              ? isMoon ? 'text-cyan' : 'text-crimson'
              : 'text-text-dim'
            }
          `}
        >
          <span>SELECT TARGET</span>
          <ChevronRight size={14} className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
        </div>
      </div>

      {/* Corner reticles */}
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />
    </button>
  )
}


export default function DestinationSelector() {
  const { enterCommandCenter } = useStore()
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    fetchPlanets()
      .then(setTargets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="relative h-full flex flex-col bg-void overflow-hidden animate-fade-in">
      {/* Background planets */}
      <div className="absolute inset-0 z-0 flex pointer-events-none" aria-hidden="true">
        <div
          className="w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg')" }}
        />
        <div
          className="w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg')" }}
        />
        <div className="absolute inset-0 bg-void/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/60 via-transparent to-void/60" />
      </div>

      {/* Top system bar */}
      <div className="relative z-10 flex items-center justify-between px-6 h-10 border-b border-border bg-surface/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-slow" />
          <span className="label-tag">ALTAIR / SYSTEM INIT / MISSION SELECTOR</span>
        </div>
        <div className="label-tag">STALRED · STRD · NASA SPACE APPS</div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-10 overflow-hidden">

        {/* Title block */}
        <div className="text-center mb-10">
          <div className="label-tag mb-4 tracking-[0.3em]">
            ◈ ANALOG LOCATION TELEMETRY ANALYSIS &amp; INTELLIGENCE REPORTER ◈
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-text-primary mb-2">
            ALTAIR
          </h1>
          <div className="w-16 h-px bg-cyan/40 mx-auto mb-4" />
          <p className="text-text-secondary text-sm max-w-2xl mx-auto leading-relaxed">
            Screen Earth analog sites for Moon and Mars missions using live NASA POWER Earth telemetry
            and curated NASA planetary references. Get hardware-aware fidelity, risk, and readiness
            insights to support mission planning, field testing, and crew training.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-2xs font-mono">
            <span className="px-2 py-1 border border-cyan/30 bg-cyan/10 text-cyan rounded-sm">Live: NASA POWER + Open-Elevation</span>
            <span className="px-2 py-1 border border-border bg-panel/70 text-text-secondary rounded-sm">Refs: NASA LRO Diviner · Perseverance MEDA/CRISM/PDS</span>
            <span className="px-2 py-1 border border-border bg-panel/70 text-text-secondary rounded-sm">Output: Fidelity · Risk · Readiness Brief</span>
          </div>
        </div>

        {/* Target cards */}
        {loading && (
          <div className="flex items-center gap-2 text-text-dim text-xs font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            Fetching planetary dataset…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-crimson text-xs bg-crimson/10 border border-crimson/20 rounded-sm px-4 py-3">
            <AlertTriangle size={14} />
            <span>Backend unreachable — ensure the FastAPI server is running. ({error})</span>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl" style={{ height: 'clamp(300px, 45vh, 420px)' }}>
            {targets.map((target) => (
              <TargetCard
                key={target.id}
                target={target}
                onSelect={enterCommandCenter}
                isHovered={hoveredId === target.id}
                onHover={setHoveredId}
                onLeave={() => setHoveredId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="relative z-10 flex items-center justify-between px-6 h-8 border-t border-border bg-surface/60 backdrop-blur-sm shrink-0">
        <div className="label-tag">SYS STATUS: NOMINAL</div>
        <div className="label-tag">DATA: NASA POWER API · NASA LRO DIVINER · PERSEVERANCE MEDA</div>
      </div>
    </div>
  )
}
