'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Text } from '@react-three/drei'
import * as THREE from 'three'

interface HolographicDisplayProps {
  position: [number, number, number]
}

export function HolographicDisplay({ position }: HolographicDisplayProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Rotation animation for holographic effect
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Main holographic panel */}
      <Plane args={[3, 2]} rotation={[0, 0, 0]}>
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </Plane>
      
      {/* Holographic border */}
      <Plane args={[3.1, 2.1]} rotation={[0, 0, 0]}>
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          wireframe
        />
      </Plane>
      
      {/* Activity stream title */}
      <Text
        position={[0, 0.7, 0.01]}
        fontSize={0.2}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        UNIFIED ACTIVITY STREAM
      </Text>
      
      {/* Sample activity items */}
      <Text
        position={[0, 0.3, 0.01]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        • Marcus: Reviewing Q4 financial reports
      </Text>
      
      <Text
        position={[0, 0.1, 0.01]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        • Sarah: Scheduling board meeting
      </Text>
      
      <Text
        position={[0, -0.1, 0.01]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        • David: Analyzing system performance
      </Text>
      
      <Text
        position={[0, -0.3, 0.01]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        • Emily: Preparing marketing campaign
      </Text>
    </group>
  )
}