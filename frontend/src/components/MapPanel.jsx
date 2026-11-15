/**
 * ALTAIR — MapPanel Component
 * Center panel: Interactive Leaflet map with dark tiles and NASA GIBS layer toggle.
 * Users click anywhere to trigger fidelity analysis.
 */

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Layers, Crosshair } from 'lucide-react'
import useStore from '../store/useStore'

// ── Custom map click marker icon ──────────────────────────────────────────────
const createAnalogIcon = (color) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:8px;height:8px;border-radius:50%;background:${color};
          box-shadow:0 0 0 2px ${color}44, 0 0 10px ${color}66;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:20px;height:20px;border-radius:50%;border:1px solid ${color}66;
          animation:markerPulse 2s ease-in-out infinite;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

// ── Tile layer definitions ────────────────────────────────────────────────────
const TILE_LAYERS = {
  dark: {
    label: 'Dark Basemap',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org">OSM</a> © <a href="https://carto.com">CARTO</a>',
    maxZoom: 19,
  },
  nasa_true: {
    label: 'NASA GIBS True Color',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    attribution: '© <a href="https://earthdata.nasa.gov">NASA EARTHDATA/GIBS</a>',
    maxZoom: 9,
  },
  nasa_night: {
    label: 'NASA Night Lights',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2024-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    attribution: '© <a href="https://earthdata.nasa.gov">NASA EARTHDATA/GIBS</a>',
    maxZoom: 8,
  },
}

// ── Map click handler component ───────────────────────────────────────────────
function ClickHandler({ accentColor }) {
  const { setClickedCoords, triggerAnalysis } = useStore.getState()

  useMapEvents({
    click(e) {
      const coords = { lat: parseFloat(e.latlng.lat.toFixed(5)), lon: parseFloat(e.latlng.lng.toFixed(5)) }
      setClickedCoords(coords)
      triggerAnalysis(coords)
    },
  })
  return null
}

// ── External pan listener ─────────────────────────────────────────────────────
function PanListener() {
  const map = useMap()
  useEffect(() => {
    const handler = (e) => {
      const { lat, lon } = e.detail
      map.flyTo([lat, lon], Math.max(map.getZoom(), 6), { duration: 1.2 })
    }
    window.addEventListener('altair:panTo', handler)
    return () => window.removeEventListener('altair:panTo', handler)
  }, [map])
  return null
}

// ── Layer switcher overlay ────────────────────────────────────────────────────
function LayerControl({ activeLayer, setActiveLayer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface/90 border border-border rounded-sm 
                   text-text-secondary hover:text-text-primary hover:border-muted transition-all text-xs"
      >
        <Layers size={12} />
        <span className="label-tag">LAYERS</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-44 bg-surface border border-border rounded-sm shadow-panel overflow-hidden">
          {Object.entries(TILE_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => { setActiveLayer(key); setOpen(false) }}
              className={`
                w-full text-left px-3 py-2 text-xs transition-colors
                ${activeLayer === key
                  ? 'bg-elevated text-text-primary'
                  : 'text-text-secondary hover:bg-elevated/50 hover:text-text-primary'
                }
              `}
            >
              {layer.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main MapPanel ─────────────────────────────────────────────────────────────
export default function MapPanel() {
  const selectedTarget = useStore((s) => s.selectedTarget)
  const clickedCoords = useStore((s) => s.clickedCoords)
  const isAnalyzing = useStore((s) => s.isAnalyzing)
  const [activeLayer, setActiveLayer] = useState('dark')

  const isMoon = selectedTarget?.id === 'lunar_south_pole'
  const accentColor = isMoon ? '#29B6F6' : '#EF4444'

  const tileConfig = TILE_LAYERS[activeLayer]

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Map header */}
      <div
        className="shrink-0 flex items-center justify-between px-3 h-8 border-b bg-surface/80"
        style={{ borderColor: '#1E2D40' }}
      >
        <div className="flex items-center gap-2">
          <Crosshair size={11} style={{ color: accentColor }} />
          <span className="label-tag">EARTH ANALOG SELECTION — CLICK MAP TO ANALYZE</span>
        </div>
        {clickedCoords && (
          <div className="font-mono text-2xs text-text-secondary">
            {clickedCoords.lat.toFixed(4)}°{clickedCoords.lat >= 0 ? 'N' : 'S'}&nbsp;
            {Math.abs(clickedCoords.lon).toFixed(4)}°{clickedCoords.lon >= 0 ? 'E' : 'W'}
          </div>
        )}
      </div>

      {/* Leaflet map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[20, 0]}
          zoom={3}
          className="h-full w-full"
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer
            key={activeLayer}
            url={tileConfig.url}
            attribution={tileConfig.attribution}
            maxZoom={tileConfig.maxZoom}
          />

          <ClickHandler accentColor={accentColor} />
          <PanListener />

          {clickedCoords && (
            <Marker
              position={[clickedCoords.lat, clickedCoords.lon]}
              icon={createAnalogIcon(accentColor)}
            >
              <Popup className="altair-popup">
                <div className="bg-panel border border-border rounded-sm p-2 text-xs text-text-primary font-mono">
                  <div className="label-tag mb-1">Analog Site</div>
                  <div>{clickedCoords.lat.toFixed(5)}°, {clickedCoords.lon.toFixed(5)}°</div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Layer switcher overlay */}
        <LayerControl activeLayer={activeLayer} setActiveLayer={setActiveLayer} />

        {/* Analysis loading overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-void/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 bg-surface border border-border rounded-sm px-5 py-3 shadow-panel">
              <div className="w-2 h-2 rounded-full animate-ping" style={{ background: accentColor }} />
              <div className="text-xs font-mono text-text-primary">
                Fetching NASA POWER telemetry…
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom coordinate bar */}
      <div className="shrink-0 flex items-center gap-4 px-3 h-7 border-t border-border bg-surface/60">
        <span className="label-tag">TILE: {tileConfig.label.toUpperCase()}</span>
        <span className="text-border">|</span>
        <span className="label-tag">SOURCE: {tileConfig.attribution.replace(/<[^>]*>/g, '')}</span>
      </div>
    </div>
  )
}
