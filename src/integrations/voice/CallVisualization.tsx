import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { CallData, RevolutionaryVoiceSystemService } from './VoiceSystemService'

interface CallVisualizationProps {
  voiceService: RevolutionaryVoiceSystemService
  onCallSelect?: (call: CallData) => void
  onCallTransfer?: (callId: string, toExecutive: string) => void
}

interface CallOrb {
  call: CallData
  position: THREE.Vector3
  velocity: THREE.Vector3
  size: number
  color: THREE.Color
  waveform: number[]
  transcription: string
}

interface Constellation {
  center: THREE.Vector3
  radius: number
  callOrbs: CallOrb[]
  connectionLines: THREE.Line[]
}

export const CallVisualization: React.FC<CallVisualizationProps> = ({
  voiceService,
  onCallSelect,
  onCallTransfer
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const animationRef = useRef<number>()
  
  const [callOrbs, setCallOrbs] = useState<CallOrb[]>([])
  const [constellation, setConstellation] = useState<Constellation | null>(null)
  const [selectedCall, setSelectedCall] = useState<CallData | null>(null)
  const [hoveredCall, setHoveredCall] = useState<CallData | null>(null)

  // Initialize 3D scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 50)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Create constellation
    createCallConstellation(scene)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      updateCallOrbs()
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Update call orbs when active calls change
  useEffect(() => {
    const updateCalls = () => {
      const activeCalls = voiceService.getActiveCalls()
      createCallOrbs(activeCalls)
    }

    // Update immediately
    updateCalls()

    // Set up interval to update calls
    const interval = setInterval(updateCalls, 1000)

    return () => clearInterval(interval)
  }, [voiceService])

  const createCallConstellation = (scene: THREE.Scene) => {
    const constellation: Constellation = {
      center: new THREE.Vector3(0, 0, 0),
      radius: 30,
      callOrbs: [],
      connectionLines: []
    }

    // Create constellation background
    const constellationGeometry = new THREE.SphereGeometry(constellation.radius, 32, 32)
    const constellationMaterial = new THREE.MeshPhongMaterial({
      color: 0x0066cc,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    })
    const constellationMesh = new THREE.Mesh(constellationGeometry, constellationMaterial)
    scene.add(constellationMesh)

    setConstellation(constellation)
  }

  const createCallOrbs = (calls: CallData[]) => {
    if (!sceneRef.current || !constellation) return

    // Remove existing call orbs
    callOrbs.forEach(orb => {
      if (orb.call.id) {
        const existingOrb = sceneRef.current!.getObjectByName(`call_orb_${orb.call.id}`)
        if (existingOrb) {
          sceneRef.current!.remove(existingOrb)
        }
      }
    })

    const newCallOrbs: CallOrb[] = []

    calls.forEach((call, index) => {
      // Position orbs in constellation pattern
      const angle = (index / calls.length) * Math.PI * 2
      const radius = constellation.radius * 0.7
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      )

      // Create call orb geometry
      const orbGeometry = new THREE.SphereGeometry(2, 16, 16)
      const orbMaterial = new THREE.MeshPhongMaterial({
        color: getCallColor(call.status.state),
        transparent: true,
        opacity: 0.8
      })
      const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial)
      orbMesh.position.copy(position)
      orbMesh.castShadow = true
      orbMesh.receiveShadow = true
      orbMesh.name = `call_orb_${call.id}`
      orbMesh.userData = { call, orbIndex: index }
      sceneRef.current!.add(orbMesh)

      // Add voice waveform visualization
      const waveformGeometry = new THREE.BufferGeometry()
      const waveformPoints: THREE.Vector3[] = []
      const waveformSize = 50
      
      for (let i = 0; i < waveformSize; i++) {
        const angle = (i / waveformSize) * Math.PI * 2
        const amplitude = Math.sin(angle * 10 + Date.now() * 0.01) * 0.5
        waveformPoints.push(new THREE.Vector3(
          Math.cos(angle) * (2 + amplitude),
          Math.sin(angle) * (2 + amplitude),
          0
        ))
      }
      
      waveformGeometry.setFromPoints(waveformPoints)
      const waveformMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6
      })
      const waveformLine = new THREE.Line(waveformGeometry, waveformMaterial)
      waveformLine.position.copy(position)
      sceneRef.current!.add(waveformLine)

      // Add call information text
      const textGeometry = new THREE.PlaneGeometry(6, 2)
      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      })
      const textMesh = new THREE.Mesh(textGeometry, textMaterial)
      textMesh.position.set(0, 4, 0)
      orbMesh.add(textMesh)

      newCallOrbs.push({
        call,
        position: position.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        size: 2,
        color: new THREE.Color(getCallColor(call.status.state)),
        waveform: generateWaveform(),
        transcription: call.transcription || 'Transcribing...'
      })
    })

    setCallOrbs(newCallOrbs)
  }

  const updateCallOrbs = () => {
    callOrbs.forEach((orb, index) => {
      // Update orb position with gentle floating motion
      const time = Date.now() * 0.001
      orb.position.y += Math.sin(time + index) * 0.01
      orb.position.x += Math.cos(time + index) * 0.01

      // Update waveform animation
      orb.waveform = generateWaveform()
    })
  }

  const getCallColor = (state: string): number => {
    switch (state) {
      case 'incoming': return 0xff6600 // Orange
      case 'ringing': return 0xffff00 // Yellow
      case 'answered': return 0x00ff00 // Green
      case 'in-progress': return 0x00ff88 // Bright green
      case 'on-hold': return 0xff0066 // Pink
      case 'transferred': return 0x0066ff // Blue
      case 'ended': return 0x666666 // Gray
      default: return 0xffffff // White
    }
  }

  const generateWaveform = (): number[] => {
    const waveform: number[] = []
    for (let i = 0; i < 100; i++) {
      waveform.push(Math.random() * 0.5 + 0.5)
    }
    return waveform
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!cameraRef.current || !rendererRef.current) return

    const mouse = new THREE.Vector2()
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)

    const intersects = raycaster.intersectObjects(sceneRef.current?.children || [])
    
    if (intersects.length > 0) {
      const object = intersects[0].object
      if (object.userData?.call) {
        setHoveredCall(object.userData.call)
      }
    } else {
      setHoveredCall(null)
    }
  }

  const handleClick = (event: React.MouseEvent) => {
    if (!cameraRef.current || !rendererRef.current) return

    const mouse = new THREE.Vector2()
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)

    const intersects = raycaster.intersectObjects(sceneRef.current?.children || [])
    
    if (intersects.length > 0) {
      const object = intersects[0].object
      if (object.userData?.call) {
        setSelectedCall(object.userData.call)
        onCallSelect?.(object.userData.call)
      }
    }
  }

  const handleTransferCall = (callId: string, toExecutive: string) => {
    voiceService.transferCall(callId, toExecutive)
    onCallTransfer?.(callId, toExecutive)
  }

  const handleEndCall = (callId: string) => {
    voiceService.endCall(callId)
  }

  return (
    <div 
      ref={mountRef} 
      style={{ width: '100%', height: '100%' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Call Statistics Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        <h3>Call Statistics</h3>
        <div>Active Calls: {callOrbs.length}</div>
        <div>Incoming: {callOrbs.filter(orb => orb.call.status.state === 'incoming').length}</div>
        <div>In Progress: {callOrbs.filter(orb => orb.call.status.state === 'in-progress').length}</div>
        <div>On Hold: {callOrbs.filter(orb => orb.call.status.state === 'on-hold').length}</div>
      </div>

      {/* Call Details Panel */}
      {selectedCall && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          <h3>Call Details</h3>
          <div><strong>From:</strong> {selectedCall.from}</div>
          <div><strong>To:</strong> {selectedCall.to}</div>
          <div><strong>Executive:</strong> {selectedCall.executive}</div>
          <div><strong>Status:</strong> {selectedCall.status.state}</div>
          <div><strong>Duration:</strong> {Math.floor(selectedCall.duration / 1000)}s</div>
          <div><strong>Confidence:</strong> {(selectedCall.neuralPrediction.confidence * 100).toFixed(1)}%</div>
          
          <h4 style={{ marginTop: '15px' }}>Neural Prediction</h4>
          <div>Next Action: {selectedCall.neuralPrediction.nextAction}</div>
          <div>Time to Close: {selectedCall.neuralPrediction.timeToClose}s</div>
          <div>Revenue Impact: ${selectedCall.neuralPrediction.revenueImpact.toLocaleString()}</div>
          <div>Risk: {selectedCall.neuralPrediction.riskAssessment}</div>
          
          <h4 style={{ marginTop: '15px' }}>Transcription</h4>
          <div style={{ fontSize: '12px', opacity: 0.8, maxHeight: '100px', overflowY: 'auto' }}>
            {selectedCall.transcription || 'Transcribing...'}
          </div>
          
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={() => handleTransferCall(selectedCall.id, 'Marcus')}
              style={{
                background: '#0066cc',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                marginRight: '10px',
                cursor: 'pointer'
              }}
            >
              Transfer to Marcus
            </button>
            <button
              onClick={() => handleEndCall(selectedCall.id)}
              style={{
                background: '#cc0066',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Voice Waveform Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        <h3>Voice Waveform</h3>
        <div style={{ width: '200px', height: '60px', background: '#1a1a1a', borderRadius: '4px', padding: '10px' }}>
          {callOrbs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '2px' }}>
              {callOrbs[0].waveform.slice(0, 20).map((amplitude, index) => (
                <div
                  key={index}
                  style={{
                    width: '8px',
                    height: `${amplitude * 40}px`,
                    background: '#00ff88',
                    borderRadius: '2px',
                    transition: 'height 0.1s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredCall && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          zIndex: 1001,
          pointerEvents: 'none'
        }}>
          <div><strong>{hoveredCall.from}</strong></div>
          <div>Executive: {hoveredCall.executive}</div>
          <div>Status: {hoveredCall.status.state}</div>
          <div>Duration: {Math.floor(hoveredCall.duration / 1000)}s</div>
        </div>
      )}
    </div>
  )
}

export default CallVisualization 