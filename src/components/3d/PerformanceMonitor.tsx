import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { gpuMemoryManager } from '../../services/GPUMemoryManager';
import { zeroDowntimeUpdateSystem } from '../../services/ZeroDowntimeUpdateSystem';
import { edgeDeploymentSystem } from '../../services/EdgeDeploymentSystem';

interface PerformanceMonitorProps {
  position: [number, number, number];
  scale?: number;
}

interface PerformanceData {
  gpuMemory: any;
  updateSystem: any;
  edgeDeployment: any;
  timestamp: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  position,
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('gpu');
  const [optimizationMode, setOptimizationMode] = useState<'performance' | 'quality' | 'balanced'>('balanced');

  // Update performance data periodically
  useEffect(() => {
    const updatePerformanceData = () => {
      const data: PerformanceData = {
        gpuMemory: gpuMemoryManager.getMemoryStats(),
        updateSystem: zeroDowntimeUpdateSystem.getUpdateStatus(),
        edgeDeployment: edgeDeploymentSystem.getDeploymentStats(),
        timestamp: Date.now()
      };
      setPerformanceData(data);
    };

    updatePerformanceData();
    const interval = setInterval(updatePerformanceData, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Animate the visualization
  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Gentle floating animation
    groupRef.current.position.y = position[1] + Math.sin(time * 0.15) * 0.03;
    
    // Rotate slowly
    groupRef.current.rotation.y = Math.sin(time * 0.08) * 0.05;
  });

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value < threshold * 0.7) return '#00ff88'; // Green
    if (value < threshold) return '#ffaa22'; // Yellow
    return '#ff4444'; // Red
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLatency = (ms: number) => {
    if (ms < 100) return `${ms.toFixed(0)}ms`;
    if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handleOptimizationModeChange = (mode: 'performance' | 'quality' | 'balanced') => {
    setOptimizationMode(mode);
    
    if (mode === 'performance') {
      gpuMemoryManager.optimizeForPerformance();
    } else if (mode === 'quality') {
      gpuMemoryManager.optimizeForQuality();
    }
    
    console.log(`🎯 Optimization mode changed to: ${mode}`);
  };

  const handleDefragmentation = async () => {
    console.log('🔧 Starting manual defragmentation...');
    await gpuMemoryManager.defragmentMemory();
  };

  const handleSystemUpdate = async () => {
    console.log('🔄 Starting system update...');
    const updateInfo = await zeroDowntimeUpdateSystem.checkForUpdates();
    if (updateInfo.available) {
      await zeroDowntimeUpdateSystem.performSystemUpdate(updateInfo.latestVersion);
    }
  };

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Performance visualization orbs */}
      {performanceData && (
        <>
          {/* GPU Memory Orb */}
          <mesh
            position={[-2, 0, 0]}
            onClick={() => setSelectedMetric('gpu')}
            onPointerOver={(e) => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshBasicMaterial
              color={getPerformanceColor(
                performanceData.gpuMemory.metrics.usedMemory / performanceData.gpuMemory.metrics.totalMemory * 100,
                80
              )}
              transparent
              opacity={isVisible ? 0.8 : 0}
            />
          </mesh>

          {/* Update System Orb */}
          <mesh
            position={[0, 0, 0]}
            onClick={() => setSelectedMetric('update')}
            onPointerOver={(e) => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshBasicMaterial
              color={performanceData.updateSystem.status === 'complete' ? '#00ff88' : '#ffaa22'}
              transparent
              opacity={isVisible ? 0.8 : 0}
            />
          </mesh>

          {/* Edge Deployment Orb */}
          <mesh
            position={[2, 0, 0]}
            onClick={() => setSelectedMetric('edge')}
            onPointerOver={(e) => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshBasicMaterial
              color={getPerformanceColor(
                performanceData.edgeDeployment.averageLatency,
                200
              )}
              transparent
              opacity={isVisible ? 0.8 : 0}
            />
          </mesh>
        </>
      )}

      {/* Main holographic display */}
      <Html
        position={[0, 0, 0.1]}
        center
        distanceFactor={30}
        transform
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
          pointerEvents: 'auto'
        }}
      >
        <div style={{
          width: '500px',
          height: '700px',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid #00ccff',
          borderRadius: '16px',
          padding: '20px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          backdropFilter: 'blur(15px)',
          boxShadow: '0 0 30px #00ccff40',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #00ccff',
            paddingBottom: '12px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#00ccff',
              marginBottom: '4px'
            }}>
              ⚡ PERFORMANCE MONITOR
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              Real-time System Optimization
            </div>
          </div>

          {/* Optimization Mode Selector */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', color: '#00ccff', fontWeight: 'bold' }}>
              Optimization Mode:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['performance', 'balanced', 'quality'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => handleOptimizationModeChange(mode)}
                  style={{
                    padding: '6px 12px',
                    background: optimizationMode === mode ? '#00ccff' : 'rgba(0, 204, 255, 0.2)',
                    border: '1px solid #00ccff',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Data Display */}
          {performanceData && (
            <>
              {/* GPU Memory Metrics */}
              {selectedMetric === 'gpu' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ccff' }}>
                    🎮 GPU Memory Management
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Total Memory:</span>
                    <span style={{ color: '#00ccff' }}>
                      {formatBytes(performanceData.gpuMemory.metrics.totalMemory)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Used Memory:</span>
                    <span style={{ color: '#ffaa22' }}>
                      {formatBytes(performanceData.gpuMemory.metrics.usedMemory)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Texture Memory:</span>
                    <span style={{ color: '#00ff88' }}>
                      {formatBytes(performanceData.gpuMemory.metrics.textureMemory)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Fragmentation:</span>
                    <span style={{ color: getPerformanceColor(performanceData.gpuMemory.metrics.fragmentationLevel * 100, 30) }}>
                      {(performanceData.gpuMemory.metrics.fragmentationLevel * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>FPS:</span>
                    <span style={{ color: '#00ff88' }}>
                      {performanceData.gpuMemory.performance.fps}
                    </span>
                  </div>
                  <button
                    onClick={handleDefragmentation}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      background: 'rgba(0, 204, 255, 0.2)',
                      border: '1px solid #00ccff',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    🔧 Defragment Memory
                  </button>
                </div>
              )}

              {/* Update System Metrics */}
              {selectedMetric === 'update' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ccff' }}>
                    🔄 Zero-Downtime Updates
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Current Version:</span>
                    <span style={{ color: '#00ccff' }}>
                      {performanceData.updateSystem.currentVersion}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Status:</span>
                    <span style={{ color: getPerformanceColor(performanceData.updateSystem.status === 'complete' ? 0 : 100, 50) }}>
                      {performanceData.updateSystem.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Progress:</span>
                    <span style={{ color: '#ffaa22' }}>
                      {performanceData.updateSystem.progress}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Active Modules:</span>
                    <span style={{ color: '#00ff88' }}>
                      {performanceData.gpuMemory.assetCounts.textures + performanceData.gpuMemory.assetCounts.geometries}
                    </span>
                  </div>
                  <button
                    onClick={handleSystemUpdate}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      background: 'rgba(0, 204, 255, 0.2)',
                      border: '1px solid #00ccff',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Check for Updates
                  </button>
                </div>
              )}

              {/* Edge Deployment Metrics */}
              {selectedMetric === 'edge' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ccff' }}>
                    🌍 Edge Deployment
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Current Region:</span>
                    <span style={{ color: '#00ccff' }}>
                      {performanceData.edgeDeployment.currentRegion}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Average Latency:</span>
                    <span style={{ color: getPerformanceColor(performanceData.edgeDeployment.averageLatency, 200) }}>
                      {formatLatency(performanceData.edgeDeployment.averageLatency)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Active Regions:</span>
                    <span style={{ color: '#00ff88' }}>
                      {performanceData.edgeDeployment.activeRegions}/{performanceData.edgeDeployment.totalRegions}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Total Failovers:</span>
                    <span style={{ color: '#ffaa22' }}>
                      {performanceData.edgeDeployment.totalFailovers}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Down Regions:</span>
                    <span style={{ color: '#ff4444' }}>
                      {performanceData.edgeDeployment.downRegions}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* System Health Summary */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(0, 204, 255, 0.1)',
            border: '1px solid #00ccff',
            borderRadius: '8px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ccff' }}>
              📊 System Health Summary
            </div>
            {performanceData && (
              <div style={{ fontSize: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>GPU Memory Usage:</span>
                  <span style={{ color: getPerformanceColor(
                    performanceData.gpuMemory.metrics.usedMemory / performanceData.gpuMemory.metrics.totalMemory * 100,
                    80
                  ) }}>
                    {((performanceData.gpuMemory.metrics.usedMemory / performanceData.gpuMemory.metrics.totalMemory) * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Update System:</span>
                  <span style={{ color: performanceData.updateSystem.status === 'complete' ? '#00ff88' : '#ffaa22' }}>
                    {performanceData.updateSystem.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Edge Latency:</span>
                  <span style={{ color: getPerformanceColor(performanceData.edgeDeployment.averageLatency, 200) }}>
                    {formatLatency(performanceData.edgeDeployment.averageLatency)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Last Updated:</span>
                  <span style={{ color: '#888' }}>
                    {new Date(performanceData.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '10px',
            opacity: 0.6,
            borderTop: '1px solid #00ccff40',
            paddingTop: '8px'
          }}>
            Click orbs to view detailed metrics • Updates every 2 seconds
          </div>
        </div>
      </Html>
    </group>
  );
}; 