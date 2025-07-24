import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RippleEffectProps {
  position: [number, number, number];
  color?: string | number;
  duration?: number; // seconds
  maxScale?: number;
  onComplete?: () => void;
}

/**
 * RippleEffect: Expanding, fading ring for impact visualization
 */
export const RippleEffect: React.FC<RippleEffectProps> = ({
  position,
  color = '#00ffff',
  duration = 1.2,
  maxScale = 4,
  onComplete,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [startTime] = useState(() => performance.now() / 1000);
  const [visible, setVisible] = useState(true);

  useFrame(() => {
    if (!meshRef.current) return;
    const now = performance.now() / 1000;
    const elapsed = now - startTime;
    if (elapsed > duration) {
      setVisible(false);
      if (onComplete) onComplete();
      return;
    }
    // Animate scale and opacity
    const t = elapsed / duration;
    const scale = 1 + t * (maxScale - 1);
    meshRef.current.scale.set(scale, scale, scale);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    if (mat) mat.opacity = 0.35 * (1 - t);
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={position}>
      <ringGeometry args={[0.7, 0.9, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}; 