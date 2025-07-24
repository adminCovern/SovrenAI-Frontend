'use client'

import React from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppStore'
import { setExecutiveStates } from '../../store/slices/executiveSlice'
import { executiveSimulator } from '../../utils/executiveSimulator'

interface ExecutiveControlsProps {
  className?: string
}

const ExecutiveControls: React.FC<ExecutiveControlsProps> = ({ className }) => {
  const executiveStates = useAppSelector(state => state.executives.states)
  const dispatch = useAppDispatch()

  const handleScenario = (scenarioName: string) => {
    const updatedStates = executiveSimulator.createScenario(executiveStates, scenarioName)
    dispatch(setExecutiveStates(updatedStates))
  }

  const handleResetToIdle = () => {
    const idleStates = executiveStates.map(state => ({
      ...state,
      isActive: false,
      executive: {
        ...state.executive,
        currentActivity: 'idle' as const
      },
      animation: {
        ...state.animation,
        current: 'breathing',
        speed: 1.0
      }
    }))
    dispatch(setExecutiveStates(idleStates))
  }

  return (
    <div className={`executive-controls ${className || ''}`} style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#4d7cff' }}>Executive Controls</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Active Executives:</strong> {executiveStates.filter(s => s.isActive).length}/{executiveStates.length}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => handleScenario('board_meeting')}
          style={{
            background: '#4d7cff',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Board Meeting
        </button>
        
        <button
          onClick={() => handleScenario('crisis_response')}
          style={{
            background: '#ff4d4d',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Crisis Response
        </button>
        
        <button
          onClick={() => handleScenario('quarterly_review')}
          style={{
            background: '#00cc88',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Quarterly Review
        </button>
        
        <button
          onClick={handleResetToIdle}
          style={{
            background: '#666666',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reset to Idle
        </button>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '11px', opacity: 0.7 }}>
        <div>• Blue glow = Active executive</div>
        <div>• Icons show current activity</div>
        <div>• Breathing animations always active</div>
      </div>
    </div>
  )
}

export default ExecutiveControls