'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import { ExecutiveAvatar } from './ExecutiveAvatar'
import { HolographicDisplay } from './HolographicDisplay'

interface Executive {
  id: string
  name: string
  role: string
  position: [number, number, number]
}

const executives: Executive[] = [
  { id: '1', name: 'Marcus Chen', role: 'CEO', position: [-3, 0, 2] },
  { id: '2', name: 'Sarah Williams', role: 'CFO', position: [-2, 0, 3] },
  { id: '3', name: 'David Rodriguez', role: 'CTO', position: [-1, 0, 3.5] },
  { id: '4', name: 'Emily Johnson', role: 'CMO', position: [0, 0, 4] },
  { id: '5', name: 'Michael Brown', role: 'COO', position: [1, 0, 3.5] },
  { id: '6', name: 'Lisa Davis', role: 'CHRO', position: [2, 0, 3] },
  { id: '7', name: 'James Wilson', role: 'CLO', position: [3, 0, 2] },
  { id: '8', name: 'Anna Martinez', role: 'CSO', position: [0, 0, 1] }
]

export function ExecutiveCommandBridge() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting setup for holographic effects */}
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 10, 0]} intensity={0.8} color="#00ffff" />
          <pointLight position={[-5, 5, 5]} intensity={0.6} color="#ff00ff" />
          <pointLight position={[5, 5, 5]} intensity={0.6} color="#ffff00" />
          
          {/* Environment for reflections */}
          <Environment preset="night" />
          
          {/* Executive avatars in semi-circle formation */}
          {executives.map((executive) => (
            <ExecutiveAvatar
              key={executive.id}
              executive={executive}
              position={executive.position}
            />
          ))}
          
          {/* Central holographic display */}
          <HolographicDisplay position={[0, 1, 0]} />
          
          {/* Camera controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}