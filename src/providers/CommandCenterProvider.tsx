'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { WebGLRenderer } from '../services/WebGLRenderer'
import { PerformanceManager, PerformanceMetrics } from '../services/PerformanceManager'
import { ExecutiveStateManager } from '../services/ExecutiveStateManager'
import { SceneManager } from '../services/SceneManager'
import { ExecutiveState } from '../types'
import { StateProvider, raftManager } from './StateProvider'
import { store, wsManager } from '../store'
import { setExecutiveStates } from '../store/slices/executiveSlice'
import { setActivities, addActivity } from '../store/slices/activitySlice'
import { updateMetrics, setQualitySettings } from '../store/slices/performanceSlice'

interface CommandCenterContextType {
  webGLRenderer: WebGLRenderer
  performanceManager: PerformanceManager
  executiveStateManager: ExecutiveStateManager
  sceneManager: SceneManager | null
  isInitialized: boolean
}

const CommandCenterContext = createContext<CommandCenterContextType | null>(null)

export const useCommandCenter = () => {
  const context = useContext(CommandCenterContext)
  if (!context) {
    throw new Error('useCommandCenter must be used within a CommandCenterProvider')
  }
  return context
}

interface CommandCenterProviderProps {
  children: React.ReactNode
}

export const CommandCenterProvider: React.FC<CommandCenterProviderProps> = ({ children }) => {
  const [webGLRenderer] = useState(() => new WebGLRenderer())
  const [performanceManager] = useState(() => new PerformanceManager(120))
  const [executiveStateManager] = useState(() => new ExecutiveStateManager())
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      // Create scene manager when in browser environment
      if (typeof window !== 'undefined') {
        const manager = new SceneManager(webGLRenderer, performanceManager)
        setSceneManager(manager)
      }
      
      // Get initial executive states
      const initialStates = executiveStateManager.getExecutiveStates()
      store.dispatch(setExecutiveStates(initialStates))
      
      // Get initial activity history
      const initialActivities = executiveStateManager.getActivityHistory()
      store.dispatch(setActivities(initialActivities))
      
      // Subscribe to state changes
      const handleStateChange = (states: ExecutiveState[]) => {
        store.dispatch(setExecutiveStates([...states]))
        
        // Update scene if available
        if (sceneManager) {
          sceneManager.updateExecutives(states)
        }
      }
      
      executiveStateManager.onStateChange(handleStateChange)
      
      // Subscribe to performance updates
      const handlePerformanceUpdate = (metrics: PerformanceMetrics) => {
        store.dispatch(updateMetrics(metrics))
        
        // Apply quality settings based on performance
        if (metrics.fps < metrics.targetFPS * 0.8) {
          const recommendedQuality = performanceManager.getRecommendedQuality()
          store.dispatch(setQualitySettings(recommendedQuality))
          webGLRenderer.applyQualitySettings(recommendedQuality)
        }
        
        // Optimize memory if needed
        if (performanceManager.shouldOptimizeMemory()) {
          webGLRenderer.optimizeMemory()
        }
      }
      
      performanceManager.onPerformanceUpdate(handlePerformanceUpdate)
      
      // Subscribe to WebSocket messages using our Redux middleware
      wsManager.onMessage('executive_update', (payload) => {
        if (payload.executiveId) {
          executiveStateManager.updateExecutiveState(payload.executiveId, payload)
        }
      })
      
      wsManager.onMessage('activity_event', (payload) => {
        if (payload.executiveId) {
          executiveStateManager.updateExecutiveActivity(payload.executiveId, payload)
        }
      })
      
      // Mark as initialized
      setIsInitialized(true)
      
      return () => {
        executiveStateManager.removeStateChangeCallback(handleStateChange)
        performanceManager.removePerformanceCallback(handlePerformanceUpdate)
        webGLRenderer.dispose()
        executiveStateManager.dispose()
        
        if (sceneManager) {
          sceneManager.dispose()
        }
      }
    }
    
    initializeServices()
  }, [webGLRenderer, performanceManager, executiveStateManager, sceneManager])

  const value = {
    webGLRenderer,
    performanceManager,
    executiveStateManager,
    sceneManager,
    isInitialized
  }

  return (
    <CommandCenterContext.Provider value={value}>
      <StateProvider>
        {children}
      </StateProvider>
    </CommandCenterContext.Provider>
  )
}

export default CommandCenterProvider