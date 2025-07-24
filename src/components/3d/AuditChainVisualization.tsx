import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { blockchainAuditChain, AuditBlock, AuditRecord } from '../../services/BlockchainAuditChain';
import { useAppSelector } from '../../hooks/useAppStore';

interface AuditChainVisualizationProps {
  position: [number, number, number];
  scale?: number;
}

interface BlockVisualization {
  block: AuditBlock;
  position: [number, number, number];
  color: string;
  isSelected: boolean;
}

export const AuditChainVisualization: React.FC<AuditChainVisualizationProps> = ({
  position,
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [blocks, setBlocks] = useState<BlockVisualization[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<AuditBlock | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [chainStats, setChainStats] = useState(blockchainAuditChain.getChainStats());
  const [verificationStatus, setVerificationStatus] = useState(blockchainAuditChain.verifyChain());

  const executiveStates = useAppSelector(state => state.executives?.states || []);

  // Update chain data periodically
  useEffect(() => {
    const updateChainData = () => {
      const chain = blockchainAuditChain as any;
      const chainBlocks = chain.chain || [];
      
      const blockVisualizations: BlockVisualization[] = chainBlocks.map((block: AuditBlock, index: number) => {
        const x = (index % 5) * 2 - 4; // 5 blocks per row
        const y = Math.floor(index / 5) * 2;
        const z = 0;
        
        // Color based on verification status
        let color = '#4d7cff'; // Default blue
        if (block.data.verificationStatus === 'verified') {
          color = '#00ff88'; // Green for verified
        } else if (block.data.verificationStatus === 'failed') {
          color = '#ff4444'; // Red for failed
        }
        
        return {
          block,
          position: [x, y, z] as [number, number, number],
          color,
          isSelected: false
        };
      });
      
      setBlocks(blockVisualizations);
      setChainStats(blockchainAuditChain.getChainStats());
      setVerificationStatus(blockchainAuditChain.verifyChain());
    };

    updateChainData();
    const interval = setInterval(updateChainData, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Animate the visualization
  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Gentle floating animation
    groupRef.current.position.y = position[1] + Math.sin(time * 0.2) * 0.05;
    
    // Rotate slowly
    groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.1;
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#00ff88';
      case 'medium': return '#ffaa22';
      case 'high': return '#ff4444';
      case 'critical': return '#ff0066';
      default: return '#4d7cff';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Chain blocks visualization */}
      {blocks.map((blockVis, index) => (
        <group key={blockVis.block.index} position={blockVis.position}>
          {/* Block cube */}
          <mesh
            onClick={() => setSelectedBlock(selectedBlock?.index === blockVis.block.index ? null : blockVis.block)}
            onPointerOver={(e) => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              document.body.style.cursor = 'default';
            }}
          >
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshBasicMaterial
              color={blockVis.color}
              transparent
              opacity={isVisible ? 0.8 : 0}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Glow effect */}
          <mesh position={[0, 0, -0.01]}>
            <boxGeometry args={[1.6, 1.6, 1.6]} />
            <meshBasicMaterial
              color={blockVis.color}
              transparent
              opacity={isVisible ? 0.3 : 0}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Block index label */}
          <Html position={[0, 0, 1]} center distanceFactor={20}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              border: `1px solid ${blockVis.color}`,
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}>
              #{blockVis.block.index}
            </div>
          </Html>

          {/* Connection line to next block */}
          {index < blocks.length - 1 && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    blockVis.position[0] + 0.75, blockVis.position[1], blockVis.position[2],
                    blocks[index + 1].position[0] - 0.75, blocks[index + 1].position[1], blocks[index + 1].position[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={blockVis.color}
                transparent
                opacity={isVisible ? 0.5 : 0}
              />
            </line>
          )}
        </group>
      ))}

      {/* Main holographic display */}
      <Html
        position={[0, 0, 0.1]}
        center
        distanceFactor={25}
        transform
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
          pointerEvents: 'auto'
        }}
      >
        <div style={{
          width: '450px',
          height: '600px',
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
              🔗 BLOCKCHAIN AUDIT CHAIN
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              Immutable Executive Decision Records
            </div>
          </div>

          {/* Chain Statistics */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Total Blocks:</span>
              <span style={{ color: '#00ccff' }}>{chainStats.totalBlocks}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Total Records:</span>
              <span style={{ color: '#00ccff' }}>{chainStats.totalRecords}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Chain Integrity:</span>
              <span style={{ color: verificationStatus.isValid ? '#00ff88' : '#ff4444' }}>
                {verificationStatus.isValid ? 'VALID' : 'INVALID'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Verified Records:</span>
              <span style={{ color: '#00ff88' }}>{chainStats.verificationStatus.verified}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Pending Records:</span>
              <span style={{ color: '#ffaa22' }}>{chainStats.verificationStatus.pending}</span>
            </div>
          </div>

          {/* Selected Block Details */}
          {selectedBlock && (
            <div style={{
              background: 'rgba(0, 204, 255, 0.1)',
              border: '1px solid #00ccff',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ccff' }}>
                Block #{selectedBlock.index}
              </div>
              
              <div style={{ marginBottom: '6px' }}>
                <span>Timestamp:</span>
                <span style={{ color: '#ffaa22', marginLeft: '8px' }}>
                  {formatTimestamp(selectedBlock.timestamp)}
                </span>
              </div>
              
              <div style={{ marginBottom: '6px' }}>
                <span>Hash:</span>
                <span style={{ color: '#888', marginLeft: '8px', fontSize: '10px' }}>
                  {selectedBlock.hash.substring(0, 16)}...
                </span>
              </div>
              
              <div style={{ marginBottom: '6px' }}>
                <span>Previous Hash:</span>
                <span style={{ color: '#888', marginLeft: '8px', fontSize: '10px' }}>
                  {selectedBlock.previousHash.substring(0, 16)}...
                </span>
              </div>
              
              <div style={{ marginBottom: '6px' }}>
                <span>Nonce:</span>
                <span style={{ color: '#00ccff', marginLeft: '8px' }}>
                  {selectedBlock.nonce}
                </span>
              </div>

              {/* Block Data */}
              {selectedBlock.data.context?.records && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ccff' }}>
                    Audit Records ({selectedBlock.data.context.records.length})
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {(selectedBlock.data.context.records as AuditRecord[]).map((record, index) => (
                      <div key={record.id} style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: `1px solid ${getRiskColor(record.riskLevel)}`,
                        borderRadius: '4px',
                        padding: '8px',
                        marginBottom: '6px',
                        fontSize: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#00ccff' }}>{record.executiveName}</span>
                          <span style={{ color: getRiskColor(record.riskLevel) }}>
                            {record.verificationStatus.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <span>{record.actionType}:</span>
                          <span style={{ color: '#ffaa22', marginLeft: '4px' }}>
                            {record.description}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Value:</span>
                          <span style={{ color: '#00ff88' }}>
                            {formatValue(record.value)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Risk:</span>
                          <span style={{ color: getRiskColor(record.riskLevel) }}>
                            {record.riskLevel.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '10px',
            opacity: 0.6,
            borderTop: '1px solid #00ccff40',
            paddingTop: '8px'
          }}>
            Click on blocks to view details • Chain updates every 3 seconds
          </div>
        </div>
      </Html>
    </group>
  );
}; 