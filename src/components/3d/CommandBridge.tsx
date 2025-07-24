'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, Html, useGLTF, Loader } from '@react-three/drei'
import * as THREE from 'three'
import { useCommandCenter } from '../../providers/CommandCenterProvider'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppStore'
import { PerformanceMonitor } from './PerformanceMonitor'
import ExecutiveControls from '../ui/ExecutiveControls'
import NotificationControls from '../ui/NotificationControls'
import EmailControls from '../ui/EmailControls'
import CalendarControls from '../ui/CalendarControls'
import ApprovalInterface from '../ui/ApprovalInterface'
import HolographicNotifications from './HolographicNotifications'
import HolographicEmailDisplay from './HolographicEmailDisplay'
import ApprovalQueueVisualization from './ApprovalQueueVisualization'
import CalendarVisualization from './CalendarVisualization'
import AISchedulingVisualization from './AISchedulingVisualization'
import AISchedulingControls from '../ui/AISchedulingControls'
import { RevolutionaryEngineeringMonitor } from '../ui/RevolutionaryEngineeringMonitor'
import { ExecutiveState } from '../../types'
import { setExecutiveStates } from '../../store/slices/executiveSlice'
import { generateInitialExecutiveStates } from '../../data/executives'
import { executiveSimulator } from '../../utils/executiveSimulator'
import { useEmailComposition } from '../../hooks/useEmailComposition'
import { approveRequest, rejectRequest } from '../../store/slices/approvalSlice'
import { useHotwordVoiceApproval } from '../../hooks/useHotwordVoiceApproval'
import { ExecutiveScorecard } from './ExecutiveScorecard';
import { PredictiveInsights } from './PredictiveInsights';
import { AuditChainVisualization } from './AuditChainVisualization';
import { AdministrativeMonitor } from './AdministrativeMonitor';
import { KnowledgeGraphVisualization } from './KnowledgeGraphVisualization';
import { SystemIntegrationMonitor } from '../ui/SystemIntegrationMonitor';

interface CommandBridgeProps {
  className?: string
}

const CommandBridge: React.FC<CommandBridgeProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true)
  // Hotword voice approval hook
  const { isListening, isHotwordDetected, lastTranscript } = useHotwordVoiceApproval()
  
  // Get executive states from Redux
  const executiveStates = useAppSelector(state => state.executives?.states || [])
  
  // Handle loading state
  useEffect(() => {
    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Executive scorecard positions (semi-circle, elevated)
  const scorecardPositions: [number, number, number][] = [
    [-6, 2, -3], // CEO
    [-4, 2, -2], // CFO
    [-2, 2, -1], // CTO
    [0, 2, 0],   // CMO
    [2, 2, -1],  // COO
    [4, 2, -2],  // CHRO
    [6, 2, -3],  // CLO
    [0, 2, -4]   // CSO
  ];

  const executiveIds = [
    'executive-1', // CEO
    'executive-2', // CFO
    'executive-3', // CTO
    'executive-4', // CMO
    'executive-5', // COO
    'executive-6', // CHRO
    'executive-7', // CLO
    'executive-8'  // CSO
  ];
  
  return (
    <div className={`command-bridge-container ${className || ''}`} style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Microphone/Hotword Indicator Overlay */}
      <div style={{
        position: 'absolute',
        top: 24,
        right: 32,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: isHotwordDetected
            ? 'radial-gradient(circle, #00ff88 60%, #00ccff 100%)'
            : isListening
              ? 'radial-gradient(circle, #4d7cff 60%, #001133 100%)'
              : 'radial-gradient(circle, #333 60%, #111 100%)',
          boxShadow: isHotwordDetected
            ? '0 0 24px 8px #00ff88cc, 0 0 48px 16px #00ccff88'
            : isListening
              ? '0 0 16px 4px #4d7cff88'
              : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s, box-shadow 0.3s',
          border: isHotwordDetected ? '2px solid #00ff88' : '2px solid #4d7cff',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isHotwordDetected ? '#fff' : '#b3cfff'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="8" y1="22" x2="16" y2="22"/>
          </svg>
        </div>
        <div style={{
          marginTop: 8,
          color: isHotwordDetected ? '#00ff88' : isListening ? '#4d7cff' : '#888',
          fontWeight: 600,
          fontSize: 13,
          textShadow: '0 0 8px #001133',
          letterSpacing: 1,
          minHeight: 18,
          textAlign: 'center',
        }}>
          {isHotwordDetected ? 'Listening for command...' : isListening ? 'Say "Hey Sovren"' : 'Voice idle'}
        </div>
        {/* Debug transcript (optional, can remove in prod) */}
        {lastTranscript && (
          <div style={{
            marginTop: 4,
            color: '#b3cfff',
            fontSize: 11,
            opacity: 0.7,
            maxWidth: 180,
            textAlign: 'center',
            wordBreak: 'break-word',
          }}>{lastTranscript}</div>
        )}
      </div>
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: true, // Better depth precision
        }}
        camera={{ position: [0, 5, 10], fov: 60 }}
        shadows
        dpr={[1, 2]} // Responsive pixel ratio for better performance
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}
      >
        <SceneSetup />
        <CommandBridgeScene />
        
        {/* Executive Scorecards */}
        {executiveIds.map((executiveId, index) => (
          <ExecutiveScorecard
            key={`scorecard-${executiveId}`}
            executiveId={executiveId}
            position={scorecardPositions[index]}
            scale={0.8}
          />
        ))}

        {/* Predictive Insights */}
        <PredictiveInsights
          position={[0, 4, -2]}
          scale={0.9}
        />

        {/* Holographic notifications */}
        <HolographicNotifications executiveStates={executiveStates} />
        
        {/* Holographic email display */}
        <HolographicEmailDisplay position={[0, 3, -5]} rotation={[0, 0, 0]} />
        
        {/* Calendar visualization */}
        <CalendarVisualization 
          position={[-6, 2, -8]} 
          rotation={[0, 0.3, 0]}
          scale={0.9}
        />
        
        {/* AI Scheduling visualization */}
        <AISchedulingVisualization 
          position={[6, 2, -8]} 
          scale={[0.9, 0.9, 0.9]}
        />
        
        {/* Blockchain Audit Chain visualization */}
        <AuditChainVisualization 
          position={[0, 6, -4]} 
          scale={0.8}
        />
        
        {/* Performance Monitor visualization */}
        <PerformanceMonitor 
          position={[8, 4, -6] as [number, number, number]} 
          scale={0.7}
        />
        
        {/* Administrative Monitor visualization */}
        <AdministrativeMonitor 
          position={[-8, 4, -6] as [number, number, number]} 
          scale={0.7}
        />
        
        {/* Knowledge Graph visualization */}
        <KnowledgeGraphVisualization 
          position={[0, 8, -8] as [number, number, number]} 
          scale={0.8}
        />
      </Canvas>
      

      
      {/* Executive controls for testing */}
      <ExecutiveControls />
      
      {/* Notification controls for testing */}
      <NotificationControls />
      
      {/* Email controls for testing */}
      <EmailControls />
      
      {/* Calendar controls for testing */}
      <CalendarControls />
      
      {/* AI Scheduling controls for testing */}
      <AISchedulingControls />
      
      {/* Revolutionary Engineering Monitor */}
      <RevolutionaryEngineeringMonitor />
      
      {/* System Integration Monitor */}
      <SystemIntegrationMonitor />
      
      {/* Approval interface */}
      <ApprovalInterface />
      
      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(5, 5, 32, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#4d7cff',
          zIndex: 1000
        }}>
          <h2 style={{ marginBottom: '20px' }}>Initializing Command Bridge</h2>
          <Loader />
        </div>
      )}
    </div>
  )
}

const SceneSetup = () => {
  const { gl, scene, camera } = useThree()
  const { webGLRenderer, performanceManager, sceneManager } = useCommandCenter()
  const { qualitySettings } = useAppSelector(state => state.performance)
  
  useEffect(() => {
    // Configure renderer with high-quality settings
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.2
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    
    // Initialize post-processing for holographic effects
    webGLRenderer.initializePostProcessing(scene, camera)
    
    // Apply quality settings
    webGLRenderer.applyQualitySettings(qualitySettings)
    
    // Handle window resize
    const handleResize = () => {
      // Type guard to check if camera is PerspectiveCamera
      if ('aspect' in camera) {
        camera.aspect = window.innerWidth / window.innerHeight
      }
      camera.updateProjectionMatrix()
      gl.setSize(window.innerWidth, window.innerHeight)
      
      // Update composer size if using post-processing
      if (webGLRenderer.getComposer()) {
        webGLRenderer.getComposer()?.setSize(window.innerWidth, window.innerHeight)
      }
    }
    
    window.addEventListener('resize', handleResize)
    
    // Performance monitoring is handled internally by the PerformanceManager
    
    return () => {
      window.removeEventListener('resize', handleResize)
      // Performance monitoring cleanup is handled internally
    }
  }, [gl, scene, camera, webGLRenderer, performanceManager, qualitySettings])
  
  return null
}

const CommandBridgeScene = () => {
  const executiveStates = useAppSelector(state => state.executives.states)
  const { sceneManager } = useCommandCenter()
  const dispatch = useAppDispatch()
  
  // Initialize email composition hook
  useEmailComposition()
  
  // Approval handlers
  const handleApprove = (approvalId: string) => {
    dispatch(approveRequest(approvalId))
  }
  
  const handleReject = (approvalId: string) => {
    dispatch(rejectRequest(approvalId))
  }
  
  // Initialize executive states if empty
  useEffect(() => {
    if (executiveStates.length === 0) {
      const initialStates = generateInitialExecutiveStates()
      dispatch(setExecutiveStates(initialStates))
      
      // Start simulation for demo purposes
      setTimeout(() => {
        executiveSimulator.startSimulation(
          initialStates,
          (updatedStates) => {
            dispatch(setExecutiveStates(updatedStates))
          },
          8000 // Update every 8 seconds
        )
      }, 3000) // Start after 3 seconds
    }
    
    // Cleanup simulation on unmount
    return () => {
      executiveSimulator.stopSimulation()
    }
  }, [dispatch, executiveStates.length])
  
  // Use the SceneManager for rendering instead of direct Three.js components
  useEffect(() => {
    if (sceneManager && executiveStates.length > 0) {
      // Start the scene manager's render loop
      sceneManager.start()
      
      // Update executive states
      sceneManager.updateExecutives(executiveStates)
      
      return () => {
        sceneManager.stop()
      }
    }
  }, [sceneManager, executiveStates])
  
  return (
    <>
      {/* Environment map for realistic reflections */}
      <Environment preset="night" background={false} />
      
      {/* We're using SceneManager for most rendering, but we can add HTML overlays here */}
      {executiveStates.map((state) => (
        <ExecutiveLabels key={state.executive.id} state={state} />
      ))}
      
      {/* Holographic notifications */}
      <HolographicNotifications executiveStates={executiveStates} />
      
      {/* Holographic email display */}
      <HolographicEmailDisplay position={[0, 3, -5]} rotation={[0, 0, 0]} />
      
      {/* Approval queue visualization */}
      <ApprovalQueueVisualization 
        position={[6, 4, -2]} 
        rotation={[0, -0.3, 0]}
        scale={0.8}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      
      {/* Calendar visualization */}
      <CalendarVisualization 
        position={[-6, 2, -8]} 
        rotation={[0, 0.3, 0]}
        scale={0.9}
      />
      
      {/* AI Scheduling visualization */}
      <AISchedulingVisualization 
        position={[6, 2, -8]} 
        scale={[0.9, 0.9, 0.9]}
      />
    </>
  )
}

interface ExecutiveLabelsProps {
  state: ExecutiveState
}

const ExecutiveLabels: React.FC<ExecutiveLabelsProps> = ({ state }) => {
  const { executive, isActive } = state
  
  // Only render the HTML labels, the 3D models are handled by SceneManager
  return (
    <group position={[executive.avatar.position.x, executive.avatar.position.y, executive.avatar.position.z]}>
      {/* Executive name label */}
      <HtmlLabel position={[0, -0.5, 0]}>
        <div style={{ 
          color: 'white', 
          fontSize: '14px', 
          fontWeight: 'bold',
          textShadow: '0 0 5px rgba(77, 124, 255, 0.8)',
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}>
          {executive.name}
          <div style={{ fontSize: '12px', opacity: 0.8 }}>{executive.role}</div>
        </div>
      </HtmlLabel>
      
      {/* Activity indicator */}
      {isActive && (
        <HtmlLabel position={[0, 2.5, 0]}>
          <div style={{ 
            color: '#4d7cff', 
            fontSize: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '3px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 10px rgba(77, 124, 255, 0.5)'
          }}>
            {executive.currentActivity}
          </div>
        </HtmlLabel>
      )}
    </group>
  )
}

// HTML component for labels
const HtmlLabel: React.FC<{
  children: React.ReactNode
  position: [number, number, number]
}> = ({ children, position }) => {
  return (
    <Html position={position} center distanceFactor={15}>
      {children}
    </Html>
  )
}

export default CommandBridge