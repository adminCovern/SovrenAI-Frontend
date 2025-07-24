import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppSelector } from '../../hooks/useAppStore';
import { Executive, ExecutiveRole } from '../../types';

interface ExecutiveScorecardProps {
  executiveId: string;
  position: [number, number, number];
  scale?: number;
}

interface ScorecardMetrics {
  roi: number;
  decisionAccuracy: number;
  responseTime: number;
  activityVolume: number;
  approvalRate: number;
  lastUpdated: Date;
}

export const ExecutiveScorecard: React.FC<ExecutiveScorecardProps> = ({
  executiveId,
  position,
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [metrics, setMetrics] = useState<ScorecardMetrics>({
    roi: 0,
    decisionAccuracy: 0,
    responseTime: 0,
    activityVolume: 0,
    approvalRate: 0,
    lastUpdated: new Date()
  });
  const [isVisible, setIsVisible] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.3);

  const executiveStates = useAppSelector(state => state.executives?.states || []);
  const executiveState = executiveStates.find((state: any) => state.executive.id === executiveId);
  const executive = executiveState?.executive;

  // Simulate real-time metrics updates
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics({
        roi: Math.random() * 500 + 100, // $100-$600 ROI
        decisionAccuracy: Math.random() * 20 + 80, // 80-100% accuracy
        responseTime: Math.random() * 200 + 50, // 50-250ms response
        activityVolume: Math.random() * 50 + 10, // 10-60 activities
        approvalRate: Math.random() * 15 + 85, // 85-100% approval rate
        lastUpdated: new Date()
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [executiveId]);

  // Animate the scorecard
  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating animation
    const time = state.clock.elapsedTime;
    groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.1;

    // Rotate slowly
    groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;

    // Pulse glow based on performance
    const performanceScore = (metrics.roi / 600 + metrics.decisionAccuracy / 100) / 2;
    setGlowIntensity(0.3 + performanceScore * 0.4);
  });

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!executive) return null;

  const getPerformanceColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.8) return '#00ff88';
    if (ratio >= 0.6) return '#ffaa22';
    return '#ff4444';
  };

  const getRoleColor = (role: ExecutiveRole) => {
    const colors: Record<ExecutiveRole, string> = {
      'CEO': '#ff6b6b',
      'CFO': '#4ecdc4',
      'CTO': '#45b7d1',
      'CMO': '#96ceb4',
      'COO': '#feca57',
      'CHRO': '#ff9ff3',
      'CLO': '#54a0ff',
      'CSO': '#5f27cd'
    };
    return colors[role] || '#ffffff';
  };

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Holographic card background */}
      <mesh>
        <planeGeometry args={[2.5, 3.5]} />
        <meshBasicMaterial
          color={getRoleColor(executive.role)}
          transparent
          opacity={isVisible ? 0.15 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow effect */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.6, 3.6]} />
        <meshBasicMaterial
          color={getRoleColor(executive.role)}
          transparent
          opacity={isVisible ? glowIntensity * 0.3 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Scorecard content */}
      <Html
        position={[0, 0, 0.1]}
        center
        distanceFactor={15}
        transform
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          pointerEvents: 'none'
        }}
      >
        <div style={{
          width: '250px',
          height: '350px',
          background: 'rgba(0, 0, 0, 0.8)',
          border: `2px solid ${getRoleColor(executive.role)}`,
          borderRadius: '12px',
          padding: '16px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 0 20px ${getRoleColor(executive.role)}40`
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '12px',
            borderBottom: `1px solid ${getRoleColor(executive.role)}`,
            paddingBottom: '8px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: getRoleColor(executive.role)
            }}>
              {executive.role}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              {executive.name}
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* ROI */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ROI:</span>
              <span style={{ color: getPerformanceColor(metrics.roi, 600) }}>
                ${metrics.roi.toFixed(0)}K
              </span>
            </div>

            {/* Decision Accuracy */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Accuracy:</span>
              <span style={{ color: getPerformanceColor(metrics.decisionAccuracy, 100) }}>
                {metrics.decisionAccuracy.toFixed(1)}%
              </span>
            </div>

            {/* Response Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Response:</span>
              <span style={{ color: getPerformanceColor(300 - metrics.responseTime, 250) }}>
                {metrics.responseTime.toFixed(0)}ms
              </span>
            </div>

            {/* Activity Volume */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Activity:</span>
              <span style={{ color: getPerformanceColor(metrics.activityVolume, 60) }}>
                {metrics.activityVolume.toFixed(0)}
              </span>
            </div>

            {/* Approval Rate */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Approval:</span>
              <span style={{ color: getPerformanceColor(metrics.approvalRate, 100) }}>
                {metrics.approvalRate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Performance indicator */}
          <div style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '10px',
            opacity: 0.6
          }}>
            Last updated: {metrics.lastUpdated.toLocaleTimeString()}
          </div>

          {/* Status indicator */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#00ff88',
            boxShadow: '0 0 8px #00ff88'
          }} />
        </div>
      </Html>
    </group>
  );
}; 