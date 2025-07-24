'use client'

import React from 'react'
import { useAppSelector } from '../../hooks/useAppStore'

interface PerformanceMonitorProps {
  className?: string
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className }) => {
  const { metrics } = useAppSelector(state => state.performance)
  
  return (
    <div className={`performance-monitor ${className || ''}`}>
      <div className="stats">
        <div className="stat">
          <span className="label">FPS:</span>
          <span className={`value ${metrics.fps < metrics.targetFPS * 0.8 ? 'text-amber-500' : 'text-green-500'}`}>
            {metrics.fps}
          </span>
        </div>
        <div className="stat">
          <span className="label">Memory:</span>
          <span className="value">
            {Math.round(metrics.memory.used / 1024 / 1024)} MB
          </span>
        </div>
      </div>
      
      <style jsx>{`
        .performance-monitor {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          z-index: 1000;
        }
        
        .stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .stat {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        
        .label {
          font-weight: bold;
        }
        
        .text-amber-500 {
          color: #f59e0b;
        }
        
        .text-green-500 {
          color: #10b981;
        }
      `}</style>
    </div>
  )
}

export default PerformanceMonitor