'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppStore'
import { useCommandCenter } from '../../providers/CommandCenterProvider'
import { Email, EmailDraft, ExecutiveState } from '../../types'
import { setFilteredExecutiveId } from '../../store/slices/emailSlice'
import { ParticleEffectsManager } from '../../utils/particleEffects'

interface HolographicEmailDisplayProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

const HolographicEmailDisplay: React.FC<HolographicEmailDisplayProps> = ({
  position = [0, 3, -5],
  rotation = [0, 0, 0],
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const { sceneManager } = useCommandCenter()
  const dispatch = useAppDispatch()
  
  // Get emails and active composition from Redux store
  const emails = useAppSelector(state => state.email.emails)
  const activeComposition = useAppSelector(state => state.email.activeComposition)
  const filteredExecutiveId = useAppSelector(state => state.email.filteredExecutiveId)
  const executiveStates = useAppSelector(state => state.executives.states)
  
  // Filter emails by executive if needed
  const filteredEmails = useMemo(() => {
    if (!filteredExecutiveId) return emails
    return emails.filter(email => email.executiveHandler === filteredExecutiveId)
  }, [emails, filteredExecutiveId])
  
  // Get particle effects manager
  const particleEffectsManager = useMemo(() => {
    return sceneManager?.getNotificationManager()?.getParticleEffectsManager()
  }, [sceneManager])
  
  // Create data streams between executives and email display
  useEffect(() => {
    if (!particleEffectsManager || !groupRef.current) return
    
    // Only create streams occasionally
    if (Math.random() > 0.1) return
    
    // Find an active executive
    const activeExecutives = executiveStates.filter(state => state.isActive)
    if (activeExecutives.length === 0) return
    
    const randomExecutive = activeExecutives[Math.floor(Math.random() * activeExecutives.length)]
    const { executive } = randomExecutive
    
    // Create data stream from executive to email display
    const execPos = new THREE.Vector3(
      executive.avatar.position.x,
      executive.avatar.position.y + 1.5,
      executive.avatar.position.z
    )
    
    const displayPos = new THREE.Vector3(position[0], position[1], position[2])
    
    // Get color based on executive role
    const color = getExecutiveColor(executive.role)
    
    particleEffectsManager.createDataStream(
      execPos,
      displayPos,
      color,
      1.0
    )
  }, [particleEffectsManager, executiveStates, position])
  
  // Animation
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Gentle floating animation
    groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.1
    
    // Subtle rotation
    groupRef.current.rotation.y = rotation[1] + Math.sin(time * 0.2) * 0.05
  })
  
  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
    >
      {/* Main holographic panel */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[6, 3.5]} />
        <meshPhysicalMaterial
          color={0x001133}
          transparent
          opacity={0.3}
          metalness={0.3}
          roughness={0.1}
          transmission={0.9}
          thickness={0.2}
          envMapIntensity={1.0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Secondary background layer for depth */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[5.8, 3.3]} />
        <meshPhysicalMaterial
          color={0x002244}
          transparent
          opacity={0.2}
          metalness={0.5}
          roughness={0.2}
          transmission={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Border frame */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[2.9, 3.0, 64]} />
        <meshBasicMaterial
          color={0x4d7cff}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Corner indicators for sci-fi look */}
      {[[-2.9, -1.7], [2.9, -1.7], [2.9, 1.7], [-2.9, 1.7]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], 0.01]}>
          <boxGeometry args={[0.1, 0.1, 0.01]} />
          <meshBasicMaterial color={0x00ffff} transparent opacity={0.8} />
        </mesh>
      ))}
      
      {/* Email content */}
      <Html
        position={[0, 0, 0.1]}
        center
        distanceFactor={10}
        transform
        sprite
      >
        <div style={{
          width: '600px',
          height: '350px',
          backgroundColor: 'rgba(0, 10, 30, 0.7)',
          borderRadius: '8px',
          border: '1px solid #4d7cff60',
          boxShadow: '0 0 15px #4d7cff40, inset 0 0 8px #4d7cff30',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 15px',
            borderBottom: '1px solid #4d7cff60',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ 
              margin: 0, 
              color: '#4d7cff', 
              fontSize: '16px',
              textShadow: '0 0 5px rgba(77, 124, 255, 0.5)'
            }}>
              UNIFIED INBOX
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Executive filter buttons */}
              <ExecutiveFilterButtons 
                executiveStates={executiveStates}
                filteredExecutiveId={filteredExecutiveId}
                onFilterChange={(executiveId) => dispatch(setFilteredExecutiveId(executiveId))}
              />
            </div>
          </div>
          
          {/* Email list and active composition split view */}
          <div style={{ 
            display: 'flex', 
            height: '100%',
            position: 'relative'
          }}>
            {/* Email list */}
            <div style={{ 
              flex: '1', 
              overflowY: 'auto',
              padding: '10px',
              borderRight: activeComposition ? '1px solid #4d7cff40' : 'none'
            }}>
              {filteredEmails.length === 0 ? (
                <div style={{ 
                  color: '#4d7cff80', 
                  fontStyle: 'italic',
                  textAlign: 'center',
                  marginTop: '20px'
                }}>
                  No emails found
                </div>
              ) : (
                filteredEmails.map(email => (
                  <EmailListItem key={email.id} email={email} />
                ))
              )}
            </div>
            
            {/* Active composition */}
            {activeComposition && (
              <div style={{ 
                flex: '1', 
                padding: '10px',
                position: 'relative'
              }}>
                <EmailCompositionView draft={activeComposition} />
              </div>
            )}
          </div>
        </div>
      </Html>
      
      {/* Particle effects */}
      <EmailDisplayParticles />
    </group>
  )
}

interface ExecutiveFilterButtonsProps {
  executiveStates: ExecutiveState[]
  filteredExecutiveId: string | null
  onFilterChange: (executiveId: string | null) => void
}

const ExecutiveFilterButtons: React.FC<ExecutiveFilterButtonsProps> = ({
  executiveStates,
  filteredExecutiveId,
  onFilterChange
}) => {
  return (
    <>
      <button
        onClick={() => onFilterChange(null)}
        style={{
          backgroundColor: !filteredExecutiveId ? '#4d7cff' : 'rgba(77, 124, 255, 0.2)',
          color: '#ffffff',
          border: '1px solid #4d7cff60',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        All
      </button>
      
      {executiveStates.map(state => (
        <button
          key={state.executive.id}
          onClick={() => onFilterChange(state.executive.id)}
          style={{
            backgroundColor: filteredExecutiveId === state.executive.id 
              ? getExecutiveColorString(state.executive.role) 
              : 'rgba(77, 124, 255, 0.2)',
            color: '#ffffff',
            border: `1px solid ${getExecutiveColorString(state.executive.role)}60`,
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {state.executive.name.split(' ')[0]}
        </button>
      ))}
    </>
  )
}

interface EmailListItemProps {
  email: Email
}

const EmailListItem: React.FC<EmailListItemProps> = ({ email }) => {
  // Format timestamp
  const formattedTime = new Date(email.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  return (
    <div style={{
      padding: '8px',
      borderBottom: '1px solid #4d7cff30',
      cursor: 'pointer',
      backgroundColor: email.isHighStakes ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
      borderLeft: `3px solid ${getExecutiveColorString(email.executiveHandler)}`,
      marginBottom: '5px',
      borderRadius: '4px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3px'
      }}>
        <span style={{ 
          fontWeight: 'bold', 
          fontSize: '13px',
          color: email.isHighStakes ? '#ff4444' : '#ffffff'
        }}>
          {email.subject}
        </span>
        <span style={{ 
          fontSize: '11px', 
          color: '#4d7cff80'
        }}>
          {formattedTime}
        </span>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#cccccc'
      }}>
        <span>
          {email.from.split('@')[0]}
        </span>
        <span style={{ 
          color: '#4d7cff', 
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          {email.executiveHandler.toUpperCase()}
        </span>
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#aaaaaa',
        marginTop: '3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {email.body.substring(0, 60)}
        {email.body.length > 60 ? '...' : ''}
      </div>
      
      {email.requiresApproval && (
        <div style={{
          fontSize: '10px',
          color: '#ff4444',
          fontWeight: 'bold',
          marginTop: '3px'
        }}>
          REQUIRES APPROVAL
        </div>
      )}
    </div>
  )
}

interface EmailCompositionViewProps {
  draft: EmailDraft
}

const EmailCompositionView: React.FC<EmailCompositionViewProps> = ({ draft }) => {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '5px 0',
        borderBottom: '1px solid #4d7cff40',
        marginBottom: '5px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: '#4d7cff'
        }}>
          {draft.subject || 'New Message'}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#aaaaaa',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>From: {draft.from}</span>
          <span style={{ 
            color: getExecutiveColorString(draft.executiveId),
            fontWeight: 'bold'
          }}>
            {draft.executiveId.toUpperCase()}
          </span>
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#aaaaaa'
        }}>
          To: {draft.to.join(', ')}
        </div>
      </div>
      
      <div style={{
        flex: 1,
        fontSize: '12px',
        color: '#ffffff',
        lineHeight: '1.4',
        overflow: 'auto',
        padding: '5px 0'
      }}>
        {draft.body || <span style={{ color: '#4d7cff80', fontStyle: 'italic' }}>Composing message...</span>}
      </div>
      
      {/* Typing indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: getExecutiveColorString(draft.executiveId),
          animation: 'pulse 1s infinite'
        }} />
        <span style={{ 
          fontSize: '11px', 
          color: '#aaaaaa'
        }}>
          {draft.executiveId} is typing...
        </span>
      </div>
      
      {/* Status indicators */}
      {draft.isHighStakes && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 68, 68, 0.2)',
          color: '#ff4444',
          fontSize: '10px',
          fontWeight: 'bold',
          padding: '3px 6px',
          borderRadius: '4px',
          border: '1px solid #ff444460'
        }}>
          HIGH STAKES
        </div>
      )}
      
      {draft.requiresApproval && (
        <div style={{
          position: 'absolute',
          top: draft.isHighStakes ? '35px' : '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 170, 0, 0.2)',
          color: '#ffaa00',
          fontSize: '10px',
          fontWeight: 'bold',
          padding: '3px 6px',
          borderRadius: '4px',
          border: '1px solid #ffaa0060'
        }}>
          REQUIRES APPROVAL
        </div>
      )}
    </div>
  )
}

const EmailDisplayParticles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null)
  const textureRef = useRef<THREE.Texture | null>(null)
  
  // Create particle texture
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
    
    textureRef.current = new THREE.CanvasTexture(canvas)
    
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
      }
    }
  }, [])
  
  // Create particle geometry
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const particleCount = 50
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Position particles around the email display
      const theta = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 0.5
      const height = (Math.random() - 0.5) * 3
      
      positions[i3] = Math.cos(theta) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(theta) * radius
      
      // Random velocity
      velocities[i3] = (Math.random() - 0.5) * 0.01
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01
      
      // Blue to cyan color gradient
      const blueAmount = 0.5 + Math.random() * 0.5
      colors[i3] = 0.1 + Math.random() * 0.2 // R
      colors[i3 + 1] = 0.3 + Math.random() * 0.4 // G
      colors[i3 + 2] = blueAmount // B
      
      // Random sizes
      sizes[i] = 0.02 + Math.random() * 0.03
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return geometry
  }, [])
  
  // Animate particles
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const time = state.clock.getElapsedTime()
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array
    const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array
    
    for (let i = 0; i < positions.length; i += 3) {
      const particleIndex = i / 3
      
      // Update position with time-based variation
      positions[i] += velocities[i] * delta * 10
      positions[i + 1] += velocities[i + 1] * delta * 10 + Math.sin(time + particleIndex) * 0.001
      positions[i + 2] += velocities[i + 2] * delta * 10
      
      // Keep particles within bounds
      const distance = Math.sqrt(
        positions[i] * positions[i] + 
        positions[i + 2] * positions[i + 2]
      )
      
      if (distance < 2.8 || distance > 3.5) {
        // Reset position
        const theta = Math.random() * Math.PI * 2
        const radius = 3 + Math.random() * 0.5
        
        positions[i] = Math.cos(theta) * radius
        positions[i + 2] = Math.sin(theta) * radius
        
        // Randomize velocity
        velocities[i] = (Math.random() - 0.5) * 0.01
        velocities[i + 2] = (Math.random() - 0.5) * 0.01
      }
      
      // Keep height within bounds
      if (Math.abs(positions[i + 1]) > 1.8) {
        velocities[i + 1] = -velocities[i + 1]
      }
      
      // Pulse size
      sizes[particleIndex] = 0.02 + Math.sin(time * 2 + particleIndex) * 0.01
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.geometry.attributes.size.needsUpdate = true
  })
  
  return (
    <points ref={particlesRef} geometry={particleGeometry}>
      <pointsMaterial
        size={0.05}
        transparent
        opacity={0.6}
        vertexColors
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        map={textureRef.current}
        alphaTest={0.1}
      />
    </points>
  )
}

// Helper functions
function getExecutiveColor(role: string): number {
  switch (role.toLowerCase()) {
    case 'ceo': return 0xffd700 // Gold
    case 'cfo': return 0x00ff00 // Green
    case 'cto': return 0x0088ff // Blue
    case 'cmo': return 0xff00ff // Magenta
    case 'coo': return 0xff8800 // Orange
    case 'chro': return 0x88ff00 // Lime
    case 'clo': return 0x8800ff // Purple
    case 'cso': return 0x00ffff // Cyan
    default: return 0x4d7cff // Default blue
  }
}

function getExecutiveColorString(role: string): string {
  const color = getExecutiveColor(role)
  return `#${color.toString(16).padStart(6, '0')}`
}

export default HolographicEmailDisplay