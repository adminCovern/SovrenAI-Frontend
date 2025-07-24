import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { knowledgeGraphService, KnowledgeNode, Relationship } from '../../services/KnowledgeGraphService';

interface KnowledgeGraphVisualizationProps {
  position: [number, number, number];
  scale?: number;
}

interface Node3D {
  id: string;
  position: THREE.Vector3;
  node: KnowledgeNode;
  meshRef: React.RefObject<THREE.Mesh>;
}

interface Relationship3D {
  id: string;
  relationship: Relationship;
  lineRef: React.RefObject<any>;
  sourcePosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
}

export const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  position,
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [nodes, setNodes] = useState<Node3D[]>([]);
  const [relationships, setRelationships] = useState<Relationship3D[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [graphMetrics, setGraphMetrics] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [queryFilters, setQueryFilters] = useState<any>({});

  useEffect(() => {
    const updateGraph = () => {
      const { nodes: graphNodes, relationships: graphRelationships } = knowledgeGraphService.queryGraph({
        ...queryFilters,
        limit: isExpanded ? 50 : 20
      });

      // Create 3D positions for nodes in a spherical layout
      const node3Ds: Node3D[] = graphNodes.map((node, index) => {
        const angle = (index / graphNodes.length) * Math.PI * 2;
        const radius = 3;
        const height = Math.sin(angle) * 2;
        
        return {
          id: node.id,
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
          ),
          node,
          meshRef: React.createRef<THREE.Mesh>()
        };
      });

      // Create 3D relationships
      const relationship3Ds: Relationship3D[] = graphRelationships.map(rel => {
        const sourceNode = node3Ds.find(n => n.id === rel.sourceNodeId);
        const targetNode = node3Ds.find(n => n.id === rel.targetNodeId);
        
        if (!sourceNode || !targetNode) return null;
        
        return {
          id: rel.id,
          relationship: rel,
          lineRef: React.createRef<THREE.Line>(),
          sourcePosition: sourceNode.position.clone(),
          targetPosition: targetNode.position.clone()
        };
      }).filter(Boolean) as Relationship3D[];

      setNodes(node3Ds);
      setRelationships(relationship3Ds);
      setGraphMetrics(knowledgeGraphService.getGraphMetrics());
    };

    updateGraph();
    const interval = setInterval(updateGraph, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [queryFilters, isExpanded]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
    }

    // Animate nodes
    nodes.forEach((node3D, index) => {
      if (node3D.meshRef.current) {
        const time = state.clock.elapsedTime;
        const floatOffset = Math.sin(time * 2 + index * 0.5) * 0.1;
        node3D.meshRef.current.position.y = node3D.position.y + floatOffset;
        
        // Pulse effect for selected node
        if (selectedNode === node3D.id) {
          const scale = 1 + Math.sin(time * 4) * 0.2;
          node3D.meshRef.current.scale.setScalar(scale);
        }
      }
    });

    // Animate relationships
    relationships.forEach((rel3D, index) => {
      if (rel3D.lineRef.current) {
        const time = state.clock.elapsedTime;
        const pulseOffset = Math.sin(time * 3 + index * 0.3) * 0.1;
        
        // Create flowing effect along the line
        const points = [];
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const point = new THREE.Vector3().lerpVectors(
            rel3D.sourcePosition,
            rel3D.targetPosition,
            t
          );
          
          // Add wave effect
          const waveOffset = Math.sin(time * 2 + t * Math.PI * 2) * 0.1;
          point.y += waveOffset;
          
          points.push(point);
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        rel3D.lineRef.current.geometry = geometry;
      }
    });
  });

  const getNodeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'executive': return '#4d7cff';
      case 'contact': return '#ff6b6b';
      case 'deal': return '#51cf66';
      case 'meeting': return '#ffd43b';
      case 'email': return '#ae8fff';
      case 'decision': return '#ff922b';
      case 'company': return '#20c997';
      case 'opportunity': return '#f783ac';
      default: return '#868e96';
    }
  };

  const getRelationshipColor = (relType: string) => {
    switch (relType) {
      case 'reports_to': return '#ff6b6b';
      case 'collaborates_with': return '#51cf66';
      case 'manages': return '#4d7cff';
      case 'influences': return '#ffd43b';
      case 'depends_on': return '#ff922b';
      case 'competes_with': return '#ff6b6b';
      case 'partners_with': return '#20c997';
      case 'owns': return '#ae8fff';
      case 'advises': return '#f783ac';
      case 'mentors': return '#51cf66';
      default: return '#868e96';
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const handleExpandGraph = () => {
    setIsExpanded(!isExpanded);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setQueryFilters((prev: any) => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Central graph sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial 
          color="#333333"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Knowledge graph nodes */}
      {nodes.map((node3D) => (
        <group key={node3D.id} position={node3D.position}>
          <mesh
            ref={node3D.meshRef}
            onClick={() => handleNodeClick(node3D.id)}
            onPointerOver={(e) => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial 
              color={getNodeColor(node3D.node.type)}
              emissive={getNodeColor(node3D.node.type)}
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Node label */}
          <Html position={[0, 0.4, 0]} center>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              border: selectedNode === node3D.id ? '2px solid #4d7cff' : 'none'
            }}>
              {node3D.node.label}
            </div>
          </Html>
        </group>
      ))}

      {/* Knowledge graph relationships */}
      {relationships.map((rel3D) => (
        <group key={rel3D.id}>
          <line ref={rel3D.lineRef}>
            <bufferGeometry />
            <lineBasicMaterial 
              color={getRelationshipColor(rel3D.relationship.type)}
              transparent
              opacity={0.6}
              linewidth={2}
            />
          </line>
          
          {/* Relationship strength indicator */}
          <mesh position={rel3D.sourcePosition.clone().lerp(rel3D.targetPosition, 0.5)}>
            <sphereGeometry args={[rel3D.relationship.strength * 0.1, 8, 8]} />
            <meshStandardMaterial 
              color={getRelationshipColor(rel3D.relationship.type)}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* Main holographic display */}
      <Html position={[0, 4, 0]} center>
        <div className="knowledge-graph-display" style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid #4d7cff',
          borderRadius: '10px',
          padding: '20px',
          minWidth: '400px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(77, 124, 255, 0.5)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#4d7cff', textAlign: 'center' }}>
            Knowledge Graph
          </h3>

          {/* Graph Metrics */}
          {graphMetrics && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#4d7cff', margin: '0 0 10px 0' }}>Graph Metrics</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <div>Nodes: {graphMetrics.totalNodes}</div>
                <div>Relationships: {graphMetrics.totalRelationships}</div>
                <div>Density: {graphMetrics.density.toFixed(3)}</div>
                <div>Avg Degree: {graphMetrics.averageDegree.toFixed(2)}</div>
                <div>Components: {graphMetrics.connectedComponents}</div>
                <div>Avg Path: {graphMetrics.averagePathLength.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Node Type Distribution */}
          {graphMetrics?.nodeTypes && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#51cf66', margin: '0 0 10px 0' }}>Node Types</h4>
              <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                 {Object.entries(graphMetrics.nodeTypes).map(([type, count]) => (
                   <div key={type} style={{ 
                     display: 'flex', 
                     justifyContent: 'space-between',
                     marginBottom: '2px'
                   }}>
                     <span>{type}:</span>
                     <span>{String(count)}</span>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* Relationship Type Distribution */}
          {graphMetrics?.relationshipTypes && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#ffd43b', margin: '0 0 10px 0' }}>Relationship Types</h4>
              <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                 {Object.entries(graphMetrics.relationshipTypes).map(([type, count]) => (
                   <div key={type} style={{ 
                     display: 'flex', 
                     justifyContent: 'space-between',
                     marginBottom: '2px'
                   }}>
                     <span>{type}:</span>
                     <span>{String(count)}</span>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* Selected Node Details */}
          {selectedNode && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#ff6b6b', margin: '0 0 10px 0' }}>Selected Node</h4>
              <div style={{ fontSize: '10px' }}>
                {(() => {
                  const node = nodes.find(n => n.id === selectedNode);
                  if (!node) return <div>Node not found</div>;
                  
                  return (
                    <div>
                      <div><strong>ID:</strong> {node.node.id}</div>
                      <div><strong>Type:</strong> {node.node.type}</div>
                      <div><strong>Label:</strong> {node.node.label}</div>
                      <div><strong>Relationships:</strong> {node.node.relationships.length}</div>
                      <div><strong>Version:</strong> {node.node.metadata.version}</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Graph Controls */}
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button
              onClick={handleExpandGraph}
              style={{
                background: isExpanded ? '#ff6b6b' : '#51cf66',
                color: '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                marginRight: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isExpanded ? 'Collapse' : 'Expand'} Graph
            </button>
            
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                background: '#868e96',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Clear Selection
            </button>
          </div>

          {/* Filter Controls */}
          <div style={{ marginTop: '10px', fontSize: '10px' }}>
            <div style={{ marginBottom: '5px' }}>
              <label>
                Node Type:
                <select 
                  onChange={(e) => handleFilterChange('nodeTypes', e.target.value ? [e.target.value] : undefined)}
                  style={{ marginLeft: '5px', background: '#333', color: '#fff', border: '1px solid #555' }}
                >
                  <option value="">All Types</option>
                  <option value="executive">Executive</option>
                  <option value="contact">Contact</option>
                  <option value="deal">Deal</option>
                  <option value="meeting">Meeting</option>
                  <option value="email">Email</option>
                  <option value="decision">Decision</option>
                  <option value="company">Company</option>
                  <option value="opportunity">Opportunity</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </Html>

      {/* Floating metrics orbs */}
      {graphMetrics && (
        <>
          <mesh position={[3, 2, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial 
              color="#4d7cff"
              emissive="#4d7cff"
              emissiveIntensity={0.5}
            />
          </mesh>
          <Html position={[3.5, 2, 0]}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              padding: '5px',
              borderRadius: '3px',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              {graphMetrics.totalNodes} Nodes
            </div>
          </Html>
        </>
      )}

      {graphMetrics && (
        <>
          <mesh position={[-3, -2, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial 
              color="#51cf66"
              emissive="#51cf66"
              emissiveIntensity={0.5}
            />
          </mesh>
          <Html position={[-3.5, -2, 0]}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              padding: '5px',
              borderRadius: '3px',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              {graphMetrics.totalRelationships} Relationships
            </div>
          </Html>
        </>
      )}
    </group>
  );
}; 