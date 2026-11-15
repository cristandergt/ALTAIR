/**
 * ALTAIR — Command Center View
 * Three-panel mission operations layout:
 * [Left: Analogs & Hardware] [Center: Leaflet Map] [Right: Telemetry & Fidelity]
 */

import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import useStore from '../store/useStore'
import { fetchPresets } from '../api/client'

import TopBar from '../components/TopBar'
import AnalogPanel from '../components/AnalogPanel'
import MapPanel from '../components/MapPanel'
import TelemetryPanel from '../components/TelemetryPanel'

export default function CommandCenter() {
  const { setPresets, presetsLoaded, selectedTarget, enterCommandCenter: _, appPhase: __ } = useStore()
  const setAppPhase = useStore((s) => () => s)

  useEffect(() => {
    if (!presetsLoaded) {
      fetchPresets().then((data) => useStore.getState().setPresets(data)).catch(() => {})
    }
  }, [presetsLoaded])

  return (
    <div className="h-full flex flex-col bg-void overflow-hidden animate-fade-in">
      <TopBar />

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 flex flex-col border-r border-border overflow-hidden">
          <AnalogPanel />
        </div>

        {/* Center: map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MapPanel />
        </div>

        {/* Right panel */}
        <div className="w-80 shrink-0 flex flex-col border-l border-border overflow-hidden">
          <TelemetryPanel />
        </div>
      </div>
    </div>
  )
}
