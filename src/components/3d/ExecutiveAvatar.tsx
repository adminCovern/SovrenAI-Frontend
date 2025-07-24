'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Text } from '@react-three/drei'
import * as THREE from 'three'

interface Executive {
  id: string
  name: string
  role: string
}

interface ExecutiveAvatarProps {
  executive: Executive
  position: [number, number, number]
}

export function ExecutiveAvatar({ executive, position }: ExecutiveAvatarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isActive, setIsActive] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState(0)

  // Breathing animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime()
      const breathing = Math.sin(time * 2) * 0.05 + 1
      meshRef.current.scale.setScalar(breathing)
      setBreathingPhase(time)
    }
  })

  const handleClick = () => {
    setIsActive(!isActive)
  }

  return (
    <group position={position}>
      {/* Avatar sphere with holographic material */}
      <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        onClick={handleClick}
        onPointerOver={() => setIsActive(true)}
        onPointerOut={() => setIsActive(false)}
      >
        <meshPhongMaterial
          color={isActive ? "#00ffff" : "#ffffff"}
          transparent
          opacity={0.8}
          emissive={isActive ? "#004444" : "#000000"}
          wireframe={false}
        />
      </Sphere>
      
      {/* Holographic glow effect */}
      {isActive && (
        <Sphere args={[0.7, 16, 16]}>
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </Sphere>
      )}
      
      {/* Executive name label */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.15}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        {executive.name}
      </Text>
      
      {/* Executive role label */}
      <Text
        position={[0, -1.0, 0]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {executive.role}
      </Text>
    </group>
  )
}