import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PerformanceMetrics, QualitySettings } from '../../services/PerformanceManager'

interface PerformanceSliceState {
  metrics: PerformanceMetrics
  qualitySettings: QualitySettings
  autoQuality: boolean
}

const initialState: PerformanceSliceState = {
  metrics: {
    fps: 0,
    targetFPS: 120,
    isPerformant: true,
    memory: {
      used: 0,
      total: 0,
      limit: 0
    },
    timestamp: Date.now()
  },
  qualitySettings: {
    particleCount: 'high',
    shadowQuality: 'high',
    antialiasing: true,
    postProcessing: true
  },
  autoQuality: true
}

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    updateMetrics: (state, action: PayloadAction<PerformanceMetrics>) => {
      state.metrics = action.payload
    },
    setQualitySettings: (state, action: PayloadAction<QualitySettings>) => {
      state.qualitySettings = action.payload
    },
    setAutoQuality: (state, action: PayloadAction<boolean>) => {
      state.autoQuality = action.payload
    },
    setParticleCount: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.qualitySettings.particleCount = action.payload
    },
    setShadowQuality: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.qualitySettings.shadowQuality = action.payload
    },
    setAntialiasing: (state, action: PayloadAction<boolean>) => {
      state.qualitySettings.antialiasing = action.payload
    },
    setPostProcessing: (state, action: PayloadAction<boolean>) => {
      state.qualitySettings.postProcessing = action.payload
    }
  }
})

export const {
  updateMetrics,
  setQualitySettings,
  setAutoQuality,
  setParticleCount,
  setShadowQuality,
  setAntialiasing,
  setPostProcessing
} = performanceSlice.actions

export default performanceSlice.reducer