/**
 * ALTAIR — Global Application State Store
 * Manages mission context, map coordinates, analysis results, and UI state.
 */

import { create } from 'zustand'

const useStore = create((set, get) => ({
  // ── Mission context ────────────────────────────────────────────────────
  selectedTarget: null,       // Full planetary target object
  selectedHardware: 'Rover',  // "Rover" | "EVA Suit" | "Habitat"
  
  // ── Map state ──────────────────────────────────────────────────────────
  clickedCoords: null,        // { lat, lon } of map click
  
  // ── Analysis state ─────────────────────────────────────────────────────
  analysisResult: null,       // FidelityReport from backend
  isAnalyzing: false,
  analysisError: null,
  
  // ── Presets ────────────────────────────────────────────────────────────
  presets: [],
  presetsLoaded: false,

  // ── UI state ──────────────────────────────────────────────────────────
  appPhase: 'destination',    // "destination" | "command"

  // ── Actions ───────────────────────────────────────────────────────────
  setSelectedTarget: (target) => set({ selectedTarget: target }),
  
  setSelectedHardware: (hw) => {
    set({ selectedHardware: hw })
    // Re-run analysis if coords are already set
    const { clickedCoords, selectedTarget } = get()
    if (clickedCoords && selectedTarget) {
      get().triggerAnalysis(clickedCoords, selectedTarget, hw)
    }
  },
  
  setClickedCoords: (coords) => {
    set({ clickedCoords: coords })
  },
  
  setPresets: (presets) => set({ presets, presetsLoaded: true }),
  
  enterCommandCenter: (target) => {
    set({ selectedTarget: target, appPhase: 'command' })
  },
  
  setAnalysisResult: (result) => set({ analysisResult: result, analysisError: null }),
  setAnalysisError: (err) => set({ analysisError: err, isAnalyzing: false }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),

  triggerAnalysis: async (coords, target, hardware) => {
    const hw = hardware || get().selectedHardware
    const tgt = target || get().selectedTarget
    if (!coords || !tgt) return

    set({ isAnalyzing: true, analysisError: null, analysisResult: null })
    
    try {
      const { runAnalysis } = await import('../api/client.js')
      const result = await runAnalysis({
        lat: coords.lat,
        lon: coords.lon,
        target_id: tgt.id,
        hardware: hw,
      })
      set({ analysisResult: result, isAnalyzing: false })
    } catch (err) {
      const msg = err?.message || String(err) || 'Unknown error — check the backend server.'
      set({ analysisError: msg, isAnalyzing: false })
    }
  },
}))

export default useStore
