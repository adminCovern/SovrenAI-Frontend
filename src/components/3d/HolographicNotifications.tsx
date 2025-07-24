'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useCommandCenter } from '../../providers/CommandCenterProvider'
import { useAppSelector } from '../../hooks/useAppStore'
import { Notification, NotificationPriority } from '../../types/notifications'
import { RippleEffect } from './RippleEffect';

interface HolographicNotificationsProps {
  executiveStates: any[]
}

const HolographicNotifications: React.FC<HolographicNotificationsProps> = ({ executiveStates }) => {
  const { sceneManager } = useCommandCenter()
  const notificationManager = sceneManager?.getNotificationManager()
  
  // Get active notifications from the notification manager
  const activeNotifications = useMemo(() => {
    return notificationManager?.getActiveNotifications() || []
  }, [notificationManager])

  return (
    <group name="holographic-notifications">
      {activeNotifications.map((notification) => (
        <HolographicNotification
          key={notification.id}
          notification={notification}
          executiveStates={executiveStates}
        />
      ))}
      <CentralActivityDisplay />
    </group>
  )
}

interface HolographicNotificationProps {
  notification: Notification
  executiveStates: any[]
}

const HolographicNotification: React.FC<HolographicNotificationProps> = ({ 
  notification, 
  executiveStates 
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const frameRef = useRef<THREE.Mesh>(null)
  const urgentRef = useRef<THREE.Mesh>(null)
  const { sceneManager } = useCommandCenter()
  const particleEffectsManager = useMemo(() => {
    return sceneManager?.getNotificationManager()?.getParticleEffectsManager()
  }, [sceneManager])
  
  // Find the executive this notification belongs to
  const executive = useMemo(() => {
    const state = executiveStates.find(s => s.executive.id === notification.executiveId)
    return state?.executive
  }, [executiveStates, notification.executiveId])
  
  // Calculate position near executive with better spacing
  const position = useMemo(() => {
    if (!executive) return [0, 3, 0] as [number, number, number]
    
    const execPos = executive.avatar.position
    
    // Find how many notifications this executive already has
    const executiveNotifications = executiveStates
      .filter(s => s.executive.id === notification.executiveId)
      .length
    
    // Calculate position with better spacing and slight randomization
    return [
      execPos.x + 1.5 + (Math.random() * 0.2 - 0.1),
      execPos.y + 2.5 + (executiveNotifications * 0.9),
      execPos.z + (Math.random() * 0.2 - 0.1)
    ] as [number, number, number]
  }, [executive, executiveStates, notification.executiveId])
  
  // Get enhanced visual config based on notification type and priority
  const visualConfig = useMemo(() => {
    return getNotificationVisualConfig(notification)
  }, [notification])
  
  // Create data stream effect when notification appears
  useEffect(() => {
    if (!particleEffectsManager || !executive) return
    
    // Create data stream from executive to notification
    const execPos = new THREE.Vector3(
      executive.avatar.position.x,
      executive.avatar.position.y + 1.5,
      executive.avatar.position.z
    )
    
    const notifPos = new THREE.Vector3(position[0], position[1], position[2])
    
    particleEffectsManager.createDataStream(
      execPos,
      notifPos,
      visualConfig.color,
      notification.priority === 'urgent' ? 1.5 : 1.0
    )
    
    // Create interference pattern for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      setTimeout(() => {
        particleEffectsManager?.createInterferencePattern(
          notifPos,
          1.2,
          visualConfig.color,
          notification.priority === 'urgent' ? 1.0 : 0.7
        )
      }, 300)
    }
    
    // Create explosion effect for urgent notifications
    if (notification.priority === 'urgent') {
      setTimeout(() => {
        particleEffectsManager?.createExplosionEffect(
          notifPos,
          0xff4444,
          1.0
        )
      }, 500)
    }
  }, [particleEffectsManager, executive, position, visualConfig.color, notification.priority])
  
  // Enhanced animation frame with more dynamic effects
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Enhanced floating animation with multi-frequency oscillation
    meshRef.current.position.y = position[1] + 
      Math.sin(time * visualConfig.pulseRate) * visualConfig.floatHeight +
      Math.sin(time * visualConfig.pulseRate * 0.5) * (visualConfig.floatHeight * 0.3)
    
    // Gentle rotation with slight wobble
    meshRef.current.rotation.y += visualConfig.rotationSpeed * 0.01
    meshRef.current.rotation.x = Math.sin(time * 0.7) * 0.03
    
    // Enhanced pulse effect for urgent notifications
    if (notification.priority === 'urgent') {
      const pulseScale = 1 + Math.sin(time * 3) * 0.15
      meshRef.current.scale.setScalar(pulseScale)
      
      // Pulse color for urgent notifications
      if (urgentRef.current && urgentRef.current.material instanceof THREE.MeshBasicMaterial) {
        urgentRef.current.material.opacity = 0.6 + Math.sin(time * 4) * 0.3
      }
    }
    
    // Animate glow effect
    if (glowRef.current && glowRef.current.material instanceof THREE.MeshBasicMaterial) {
      glowRef.current.material.opacity = 
        visualConfig.opacity * 0.1 + Math.sin(time * visualConfig.pulseRate * 1.5) * 0.05
      
      // Slowly rotate glow
      glowRef.current.rotation.z += 0.001
    }
    
    // Animate frame
    if (frameRef.current && frameRef.current.material instanceof THREE.MeshBasicMaterial) {
      frameRef.current.material.opacity = 
        visualConfig.opacity * 0.8 + Math.sin(time * visualConfig.pulseRate) * 0.1
      
      // Pulse scale for high priority
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        const frameScale = 1 + Math.sin(time * 2) * 0.05
        frameRef.current.scale.set(frameScale, frameScale, 1)
      }
    }
  })
  
  return (
    <group ref={meshRef} position={position}>
      {/* Enhanced main notification panel with better materials */}
      <mesh>
        <planeGeometry args={[1.5, 0.8]} />
        <meshPhysicalMaterial
          color={visualConfig.color}
          transparent
          opacity={visualConfig.opacity * 0.3}
          metalness={0.2}
          roughness={0.1}
          transmission={0.85}
          thickness={0.2}
          envMapIntensity={1.0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Secondary background layer for depth */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.4, 0.7]} />
        <meshPhysicalMaterial
          color={new THREE.Color(visualConfig.color).multiplyScalar(0.5).getHex()}
          transparent
          opacity={visualConfig.opacity * 0.2}
          metalness={0.3}
          roughness={0.2}
          transmission={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Enhanced glow effect with larger size */}
      <mesh ref={glowRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[2.2, 1.4]} />
        <meshBasicMaterial
          color={visualConfig.color}
          transparent
          opacity={visualConfig.opacity * 0.1}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Enhanced border frame */}
      <mesh ref={frameRef} position={[0, 0, 0.01]}>
        <ringGeometry args={[0.9, 1.0, 48]} /> {/* Increased segments for smoother look */}
        <meshBasicMaterial
          color={visualConfig.color}
          transparent
          opacity={visualConfig.opacity * 0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Corner indicators for sci-fi look */}
      {[[-0.7, -0.35], [0.7, -0.35], [0.7, 0.35], [-0.7, 0.35]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], 0.01]}>
          <boxGeometry args={[0.05, 0.05, 0.01]} />
          <meshBasicMaterial 
            color={visualConfig.color} 
            transparent 
            opacity={0.7} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      
      {/* Enhanced priority indicator for urgent notifications */}
      {notification.priority === 'urgent' && (
        <mesh ref={urgentRef} position={[0, 0, 0.02]}>
          <ringGeometry args={[1.1, 1.2, 48]} />
          <meshBasicMaterial
            color={0xff4444}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      
      {/* High priority indicator */}
      {notification.priority === 'high' && (
        <mesh position={[0, 0, 0.015]}>
          <ringGeometry args={[1.05, 1.1, 48]} />
          <meshBasicMaterial
            color={0xffaa00}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      
      {/* Enhanced particle effects */}
      <NotificationParticles config={visualConfig} />
      
      {/* Enhanced HTML content overlay */}
      <Html
        position={[0, 0, 0.1]}
        center
        distanceFactor={15}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: `0 0 5px ${getColorString(visualConfig.color)}`,
          maxWidth: '140px',
          padding: '10px',
          backgroundColor: 'rgba(0, 10, 30, 0.7)',
          borderRadius: '4px',
          border: `1px solid ${getColorString(visualConfig.color)}80`,
          boxShadow: `0 0 15px ${getColorString(visualConfig.color)}40, inset 0 0 8px ${getColorString(visualConfig.color)}30`
        }}>
          <div style={{ 
            fontSize: '10px', 
            opacity: 0.9, 
            marginBottom: '5px',
            color: getColorString(visualConfig.color),
            letterSpacing: '1px'
          }}>
            {notification.type.replace(/_/g, ' ').toUpperCase()}
          </div>
          <div style={{ 
            marginBottom: '4px',
            fontSize: '13px',
            textShadow: `0 0 8px ${getColorString(visualConfig.color)}`
          }}>
            {notification.title}
          </div>
          <div style={{ 
            fontSize: '10px', 
            opacity: 0.95,
            lineHeight: '1.3'
          }}>
            {notification.message}
          </div>
          
          {/* Priority indicator */}
          {(notification.priority === 'high' || notification.priority === 'urgent') && (
            <div style={{
              marginTop: '5px',
              fontSize: '9px',
              color: notification.priority === 'urgent' ? '#ff4444' : '#ffaa00',
              fontWeight: 'bold'
            }}>
              {notification.priority.toUpperCase()} PRIORITY
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

interface NotificationParticlesProps {
  config: any
}

const NotificationParticles: React.FC<NotificationParticlesProps> = ({ config }) => {
  const particlesRef = useRef<THREE.Points>(null)
  const textureRef = useRef<THREE.Texture | null>(null)
  
  // Create particle texture for better visual quality
  useEffect(() => {
    // Create a canvas-based particle texture
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    // Create a radial gradient for the particle
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
  
  // Create enhanced particle geometry with more particles and attributes
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const particleCount = 30 // Increased from 20 to 30
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const lifetimes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Random position within spread with more variation
      positions[i3] = (Math.random() - 0.5) * 0.4
      positions[i3 + 1] = (Math.random() - 0.5) * 0.4
      positions[i3 + 2] = (Math.random() - 0.5) * 0.4
      
      // Random velocity with more dynamic movement
      velocities[i3] = (Math.random() - 0.5) * 0.15
      velocities[i3 + 1] = Math.random() * 0.15 + 0.05
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.15
      
      // Random sizes for more visual interest
      sizes[i] = 0.03 + Math.random() * 0.04
      
      // Random lifetimes for continuous regeneration
      lifetimes[i] = Math.random() * 2.0
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))
    
    return geometry
  }, [])
  
  // Animate particles with more complex behavior
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array
    const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array
    const lifetimes = particlesRef.current.geometry.attributes.lifetime.array as Float32Array
    
    const time = state.clock.getElapsedTime()
    
    for (let i = 0; i < positions.length; i += 3) {
      const particleIndex = i / 3
      
      // Update position with time-based variation
      positions[i] += velocities[i] * delta
      positions[i + 1] += velocities[i + 1] * delta + Math.sin(time * 2 + particleIndex) * 0.001
      positions[i + 2] += velocities[i + 2] * delta
      
      // Update lifetime
      lifetimes[particleIndex] -= delta
      
      // Pulse size based on lifetime
      const lifetimeRatio = lifetimes[particleIndex] / 2.0
      sizes[particleIndex] = (0.03 + Math.random() * 0.02) * (0.5 + lifetimeRatio * 0.5)
      
      // Reset particle if lifetime expired or it goes too far
      if (lifetimes[particleIndex] <= 0 || 
          Math.abs(positions[i]) > 1 || 
          Math.abs(positions[i + 1]) > 1 || 
          Math.abs(positions[i + 2]) > 1) {
        
        // Reset position with slight offset from center
        positions[i] = (Math.random() - 0.5) * 0.4
        positions[i + 1] = (Math.random() - 0.5) * 0.4
        positions[i + 2] = (Math.random() - 0.5) * 0.4
        
        // Reset velocity with some variation
        velocities[i] = (Math.random() - 0.5) * 0.15
        velocities[i + 1] = Math.random() * 0.15 + 0.05
        velocities[i + 2] = (Math.random() - 0.5) * 0.15
        
        // Reset lifetime
        lifetimes[particleIndex] = Math.random() * 2.0 + 1.0
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.geometry.attributes.size.needsUpdate = true
    particlesRef.current.geometry.attributes.lifetime.needsUpdate = true
  })
  
  return (
    <points ref={particlesRef} geometry={particleGeometry}>
      <pointsMaterial
        color={config.color}
        size={0.05}
        transparent
        opacity={0.7} // Increased from 0.6 to 0.7
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        map={textureRef.current}
        alphaTest={0.1} // Added alphaTest for better particle edges
      />
    </points>
  )
}

const CentralActivityDisplay: React.FC = () => {
  const displayRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const innerRingRef = useRef<THREE.Mesh>(null)
  const { sceneManager } = useCommandCenter()
  const notificationManager = sceneManager?.getNotificationManager()
  // Filtering state
  const [filter, setFilter] = useState<{ executiveId: string | null, type: string | null, impact: string | null }>({ executiveId: null, type: null, impact: null })
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null)
  // Get activity stream
  const activityStream = useMemo(() => {
    let stream = notificationManager?.getActivityStream() || []
    if (filter.executiveId) stream = stream.filter(a => a.executiveId === filter.executiveId)
    if (filter.type) stream = stream.filter(a => a.activity === filter.type)
    if (filter.impact) stream = stream.filter(a => a.impact === filter.impact)
    return stream
  }, [notificationManager, filter])
  
  // Ripple state
  const [ripples, setRipples] = useState<Array<{ id: string, position: [number, number, number], color: string }>>([]);
  // Track last activity to trigger ripple
  const lastActivityId = useRef<string | null>(null);

  // Effect: trigger ripple on new significant/major activity
  useEffect(() => {
    if (activityStream.length === 0) return;
    const latest = activityStream[0];
    if (latest.id !== lastActivityId.current && (latest.impact === 'significant' || latest.impact === 'major')) {
      lastActivityId.current = latest.id;
      // Color by impact
      const color = latest.impact === 'major' ? '#ff2222' : '#ffaa22';
      // Position: center of display (could be executive position if available)
      setRipples(ripples => [...ripples, { id: latest.id, position: [0, 0, 0], color }]);
    }
  }, [activityStream]);
  
  // Create particle system for holographic effect
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const particleCount = 100
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const angle = Math.random() * Math.PI * 2
      const radius = 1.5 + Math.random() * 1.0
      
      // Position particles in a disk around the display
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = (Math.random() - 0.5) * 1.5
      positions[i3 + 2] = Math.sin(angle) * radius
      
      // Color gradient from center (blue) to edge (cyan)
      const distanceRatio = Math.min(radius / 2.5, 1)
      colors[i3] = 0.3 - distanceRatio * 0.3     // R: decrease toward edge
      colors[i3 + 1] = 0.5 + distanceRatio * 0.3 // G: increase toward edge
      colors[i3 + 2] = 1.0                       // B: always high
      
      // Size based on distance from center
      sizes[i] = 0.03 + (1 - distanceRatio) * 0.05
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return geometry
  }, [])
  
  // Animation with more complex behavior
  useFrame((state) => {
    if (!displayRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Enhanced rotation with slight wobble
    displayRef.current.rotation.y += 0.002
    displayRef.current.rotation.x = Math.sin(time * 0.3) * 0.03
    
    // Enhanced floating with multi-frequency oscillation
    displayRef.current.position.y = 4 + Math.sin(time * 0.5) * 0.1 + Math.sin(time * 0.2) * 0.05
    
    // Animate particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        const particleIndex = i / 3
        
        // Rotate particles around the display
        const x = positions[i]
        const z = positions[i + 2]
        const angle = Math.atan2(z, x) + 0.002
        const radius = Math.sqrt(x * x + z * z)
        
        positions[i] = Math.cos(angle) * radius
        positions[i + 2] = Math.sin(angle) * radius
        
        // Oscillate y position
        positions[i + 1] += Math.sin(time * 2 + particleIndex) * 0.002
        
        // Keep within bounds
        if (positions[i + 1] > 1.5) positions[i + 1] = 1.5
        if (positions[i + 1] < -1.5) positions[i + 1] = -1.5
        
        // Pulse size
        sizes[particleIndex] = (0.03 + (Math.sin(time * 3 + particleIndex * 0.2) + 1) * 0.02)
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.size.needsUpdate = true
    }
    
    // Animate rings
    if (ringRef.current && ringRef.current.material instanceof THREE.Material) {
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(time * 1.5) * 0.2
    }
    
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += 0.005
    }
  })
  
  return (
    <group ref={displayRef} position={[0, 4, 0]}>
      {/* Enhanced main display screen with better materials */}
      <mesh>
        <planeGeometry args={[3.5, 2.2]} />
        <meshPhysicalMaterial
          color={0x001122}
          transparent
          opacity={0.3}
          metalness={0.3}
          roughness={0.1}
          transmission={0.9}
          thickness={0.2}
          envMapIntensity={1.0}
        />
      </mesh>
      
      {/* Secondary background layer for depth */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[3.3, 2.0]} />
        <meshPhysicalMaterial
          color={0x002244}
          transparent
          opacity={0.2}
          metalness={0.5}
          roughness={0.2}
          transmission={0.8}
        />
      </mesh>
      
      {/* Outer display frame with animation */}
      <mesh ref={ringRef}>
        <ringGeometry args={[1.9, 2.0, 64]} />
        <meshBasicMaterial
          color={0x4d7cff}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner rotating ring */}
      <mesh ref={innerRingRef}>
        <ringGeometry args={[1.7, 1.8, 64]} />
        <meshBasicMaterial
          color={0x00ffff}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Corner indicators for sci-fi look */}
      {[[-1.7, -1.1], [1.7, -1.1], [1.7, 1.1], [-1.7, 1.1]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], 0.01]}>
          <boxGeometry args={[0.1, 0.1, 0.01]} />
          <meshBasicMaterial color={0x00ffff} transparent opacity={0.8} />
        </mesh>
      ))}
      
      {/* Data flow indicators */}
      <mesh position={[0, 0, -0.02]} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[2.1, 2.15, 64, 4, 0, Math.PI * 0.5]} />
        <meshBasicMaterial
          color={0x00ffff}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Particle system for holographic effect */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          vertexColors
          size={0.05}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      
      {/* Enhanced activity stream content */}
      <Html
        position={[0, 0, 0.1]}
        center
        distanceFactor={20}
        style={{ pointerEvents: 'auto' }}
      >
        <div style={{
          color: '#4d7cff',
          fontSize: '10px',
          fontFamily: 'monospace',
          textAlign: 'center',
          width: '240px',
          height: '180px',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 10, 30, 0.7)',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #4d7cff60',
          boxShadow: '0 0 15px #4d7cff40, inset 0 0 8px #4d7cff30',
          position: 'relative',
        }}>
          {/* Filtering UI */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
            {/* Executive filter */}
            <FilterPill
              label="All Execs"
              active={!filter.executiveId}
              onClick={() => setFilter(f => ({ ...f, executiveId: null }))}
            />
            {[...new Set((notificationManager?.getActivityStream() || []).map(a => a.executiveRole))].map(role => (
              <FilterPill
                key={role}
                label={role}
                active={filter.executiveId === role}
                onClick={() => setFilter(f => ({ ...f, executiveId: role }))}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
            {/* Type filter */}
            <FilterPill label="All Types" active={!filter.type} onClick={() => setFilter(f => ({ ...f, type: null }))} />
            {[...new Set((notificationManager?.getActivityStream() || []).map(a => a.activity))].map(type => (
              <FilterPill
                key={type}
                label={type}
                active={filter.type === type}
                onClick={() => setFilter(f => ({ ...f, type }))}
              />
            ))}
            {/* Impact filter */}
            <FilterPill label="All Impact" active={!filter.impact} onClick={() => setFilter(f => ({ ...f, impact: null }))} />
            {[...new Set((notificationManager?.getActivityStream() || []).map(a => a.impact))].map(impact => (
              <FilterPill
                key={impact}
                label={impact}
                active={filter.impact === impact}
                onClick={() => setFilter(f => ({ ...f, impact }))}
              />
            ))}
          </div>
          <div style={{ 
            marginBottom: '10px', 
            fontWeight: 'bold',
            fontSize: '12px',
            textShadow: '0 0 5px #4d7cff'
          }}>
            UNIFIED ACTIVITY STREAM
          </div>
          {activityStream.length === 0 ? (
            <div style={{ 
              color: '#4d7cff80', 
              fontStyle: 'italic',
              marginTop: '20px'
            }}>
              Awaiting executive activity...
            </div>
          ) : (
            activityStream.slice(0, 10).map((item, index) => (
              <div
                key={item.id}
                style={{ 
                  marginBottom: '3px', 
                  opacity: 1 - (index * 0.08),
                  fontSize: '9px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: index < 9 ? '1px solid #4d7cff20' : 'none',
                  paddingBottom: '2px',
                  color: getActivityColor(item.impact, index),
                  cursor: 'pointer',
                  background: selectedActivity && selectedActivity.id === item.id ? 'rgba(77,124,255,0.15)' : 'none',
                  borderRadius: '3px',
                  transition: 'background 0.2s',
                }}
                onClick={() => setSelectedActivity(item)}
                tabIndex={0}
                aria-label={`View details for ${item.executiveRole} ${item.activity}`}
              >
                <span style={{ fontWeight: 'bold', marginRight: '5px' }}>{item.executiveRole}:</span>
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.description.substring(0, 28)}
                  {item.description.length > 28 ? '...' : ''}
                </span>
              </div>
            ))
          )}
          {/* Drill-down modal overlay */}
          {selectedActivity && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,16,32,0.96)',
                color: '#fff',
                zIndex: 10,
                borderRadius: '4px',
                boxShadow: '0 0 24px #4d7cff80',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
                animation: 'fadeIn 0.2s',
              }}
              tabIndex={0}
              aria-modal="true"
              role="dialog"
              onClick={() => setSelectedActivity(null)}
            >
              <div style={{
                background: 'rgba(0, 10, 30, 0.95)',
                border: '1px solid #4d7cff',
                borderRadius: '6px',
                padding: '18px 16px',
                minWidth: '220px',
                maxWidth: '90%',
                boxShadow: '0 0 24px #4d7cff80',
                position: 'relative',
                zIndex: 11,
                textAlign: 'left',
              }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ fontWeight: 'bold', color: '#00ffff', marginBottom: 6, fontSize: 13 }}>{selectedActivity.executiveRole} — {selectedActivity.activity}</div>
                <div style={{ color: '#4d7cff', fontSize: 11, marginBottom: 8 }}>Impact: <b>{selectedActivity.impact}</b></div>
                <div style={{ color: '#fff', fontSize: 12, marginBottom: 8 }}><b>Description:</b> {selectedActivity.description}</div>
                <div style={{ color: '#b3cfff', fontSize: 10, marginBottom: 8 }}><b>Timestamp:</b> {new Date(selectedActivity.timestamp).toLocaleString()}</div>
                {selectedActivity.metadata && (
                  <div style={{ color: '#b3cfff', fontSize: 10, marginBottom: 8 }}>
                    <b>Metadata:</b> <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{JSON.stringify(selectedActivity.metadata, null, 2)}</pre>
                  </div>
                )}
                <button
                  style={{
                    marginTop: 8,
                    background: 'linear-gradient(90deg, #4d7cff 0%, #00ffff 100%)',
                    color: '#001133',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '6px 18px',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 0 8px #00ffff60',
                  }}
                  onClick={() => setSelectedActivity(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Html>
      {/* Ripple effects for high/critical impact */}
      {ripples.map(ripple => (
        <RippleEffect
          key={ripple.id}
          position={ripple.position}
          color={ripple.color}
          duration={1.2}
          maxScale={4}
          onComplete={() => setRipples(ripples => ripples.filter(r => r.id !== ripple.id))}
        />
      ))}
    </group>
  )
}

// Helper function to get color based on impact and position in list
function getActivityColor(impact: string, index: number): string {
  const baseColor = {
    'major': '#ff4444',
    'significant': '#ffaa00',
    'moderate': '#4d7cff',
    'minimal': '#00ccff'
  }[impact] || '#4d7cff'
  
  // Fade to blue for older entries
  if (index > 5) {
    return '#4d7cff'
  }
  
  return baseColor
}

// Helper functions
function getNotificationVisualConfig(notification: Notification) {
  const baseConfig = {
    scale: { x: 1, y: 1, z: 1 },
    opacity: 0.8,
    glowIntensity: 1.0,
    pulseRate: 1.0,
    floatHeight: 0.2,
    rotationSpeed: 0.1
  }
  
  switch (notification.type) {
    case 'approval_required':
      return {
        ...baseConfig,
        color: 0xff4444,
        glowIntensity: 1.5,
        pulseRate: 2.0,
        scale: { x: 1.2, y: 1.2, z: 1.2 }
      }
    case 'activity_update':
      return {
        ...baseConfig,
        color: 0x4d7cff,
        glowIntensity: 0.8,
        pulseRate: 0.8
      }
    case 'integration_alert':
      return {
        ...baseConfig,
        color: 0xffaa00,
        glowIntensity: 1.2,
        pulseRate: 1.5
      }
    case 'performance_warning':
      return {
        ...baseConfig,
        color: 0xff6600,
        glowIntensity: 1.3,
        pulseRate: 1.8
      }
    case 'system_message':
      return {
        ...baseConfig,
        color: 0x00ccff,
        glowIntensity: 0.9,
        pulseRate: 0.6
      }
    default:
      return {
        ...baseConfig,
        color: 0x88ccff
      }
  }
}

function getColorString(colorNumber: number): string {
  return `#${colorNumber.toString(16).padStart(6, '0')}`
}

export default HolographicNotifications

function FilterPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      style={{
        background: active ? 'linear-gradient(90deg, #4d7cff 0%, #00ffff 100%)' : 'rgba(0, 10, 30, 0.5)',
        color: active ? '#001133' : '#4d7cff',
        border: active ? '1px solid #00ffff' : '1px solid #4d7cff60',
        borderRadius: '12px',
        padding: '2px 10px',
        fontSize: 10,
        fontWeight: 600,
        margin: 0,
        cursor: 'pointer',
        outline: active ? '2px solid #00ffff' : 'none',
        boxShadow: active ? '0 0 8px #00ffff60' : 'none',
        transition: 'all 0.2s',
      }}
      onClick={onClick}
      tabIndex={0}
    >
      {label}
    </button>
  )
}