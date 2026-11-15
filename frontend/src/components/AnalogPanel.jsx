/**
 * ALTAIR — AnalogPanel Component
 * Left panel: Preset analog sites + hardware selectors.
 */

import { MapPin, Cpu, User, Home, ChevronRight } from 'lucide-react'
import useStore from '../store/useStore'

const HARDWARE_OPTIONS = [
  { id: 'Rover', label: 'Rover', icon: Cpu, desc: 'Surface mobility vehicle' },
  { id: 'EVA Suit', label: 'EVA Suit', icon: User, desc: 'Extravehicular activity' },
  { id: 'Habitat', label: 'Habitat', icon: Home, desc: 'Pressurized surface module' },
]

function HardwareButton({ option, isSelected, onClick, accentColor }) {
  const Icon = option.icon
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all duration-150 text-left
        ${isSelected
          ? 'bg-elevated text-text-primary'
          : 'border-transparent text-text-secondary hover:bg-elevated/50 hover:text-text-primary'
        }
      `}
      style={isSelected ? { borderColor: `${accentColor}40`, background: `${accentColor}08` } : {}}
    >
      <div
        className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0"
        style={{ background: isSelected ? `${accentColor}18` : 'transparent' }}
      >
        <Icon size={13} style={{ color: isSelected ? accentColor : undefined }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium">{option.label}</div>
        <div className="text-2xs text-text-dim truncate">{option.desc}</div>
      </div>
      {isSelected && (
        <div
          className="ml-auto w-1 h-1 rounded-full shrink-0"
          style={{ background: accentColor }}
        />
      )}
    </button>
  )
}

function PresetCard({ preset, onSelect, accentColor }) {
  const analogTypes = preset.analog_type || []
  return (
    <button
      onClick={() => onSelect(preset)}
      className="w-full text-left px-3 py-2.5 border border-border hover:border-muted rounded-sm bg-panel 
                 hover:bg-elevated transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MapPin size={10} style={{ color: accentColor }} className="shrink-0 mt-px" />
            <span className="text-xs font-medium text-text-primary truncate">{preset.name}</span>
          </div>
          <div className="text-2xs text-text-dim truncate">{preset.country}</div>
          <div className="text-2xs text-text-dim mt-1 leading-relaxed line-clamp-2">{preset.description}</div>
        </div>
        <ChevronRight
          size={12}
          className="shrink-0 mt-1 text-text-dim group-hover:text-text-secondary transition-colors"
        />
      </div>
    </button>
  )
}

export default function AnalogPanel() {
  const selectedTarget = useStore((s) => s.selectedTarget)
  const selectedHardware = useStore((s) => s.selectedHardware)
  const setSelectedHardware = useStore((s) => s.setSelectedHardware)
  const presets = useStore((s) => s.presets)
  const setClickedCoords = useStore((s) => s.setClickedCoords)
  const triggerAnalysis = useStore((s) => s.triggerAnalysis)

  const isMoon = selectedTarget?.id === 'lunar_south_pole'
  const accentColor = isMoon ? '#29B6F6' : '#EF4444'

  const handlePresetSelect = (preset) => {
    const coords = { lat: preset.lat, lon: preset.lon }
    setClickedCoords(coords)
    triggerAnalysis(coords, selectedTarget, selectedHardware)
    // Also emit a custom event to pan the map
    window.dispatchEvent(new CustomEvent('altair:panTo', { detail: coords }))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      {/* Hardware selection */}
      <div className="shrink-0">
        <div className="panel-header">
          <div className="label-tag">Mission Hardware</div>
        </div>
        <div className="p-2 space-y-0.5">
          {HARDWARE_OPTIONS.map((opt) => (
            <HardwareButton
              key={opt.id}
              option={opt}
              isSelected={selectedHardware === opt.id}
              onClick={() => setSelectedHardware(opt.id)}
              accentColor={accentColor}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border shrink-0" />

      {/* Preset analog sites */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="panel-header shrink-0">
          <div className="label-tag">Verified Analog Sites</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {presets.length === 0 && (
            <div className="text-text-dim text-xs text-center py-4">Loading presets…</div>
          )}
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onSelect={handlePresetSelect}
              accentColor={accentColor}
            />
          ))}
        </div>
      </div>

      {/* Target info footer */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="label-tag mb-1">Active Target</div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
          <span className="text-xs font-medium text-text-primary truncate">
            {selectedTarget?.name}
          </span>
        </div>
      </div>
    </div>
  )
}
