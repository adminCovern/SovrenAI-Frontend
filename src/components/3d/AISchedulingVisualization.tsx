import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html, Box, Sphere, Cylinder } from '@react-three/drei'
import * as THREE from 'three'
import { useAIScheduling } from '../../hooks/useAIScheduling'
import { SchedulingConflict, VideoCallSession, MeetingActionItem } from '../../types/scheduling'

interface AISchedulingVisualizationProps {
  position?: [number, number, number]
  scale?: [number, number, number]
}

/**
 * AI Scheduling Visualization Component
 * 3D visualization of AI scheduling functionality including conflict resolution,
 * video call sessions, and action item management
 * Requirements: 3.3, 3.5, 3.7
 */
export const AISchedulingVisualization: React.FC<AISchedulingVisualizationProps> = ({
  position = [0, 0, 0],
  scale = [1, 1, 1]
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const {
    activeConflicts,
    resolvedConflicts,
    activeVideoSessions,
    pendingActionItems,
    completedActionItems,
    analytics
  } = useAIScheduling()

  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation for visual appeal
      groupRef.current.rotation.y += 0.005
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* AI Scheduling Center */}
      <Box args={[2, 0.5, 2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#4a90e2" transparent opacity={0.8} />
      </Box>
      
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        AI Scheduling
      </Text>

      {/* Conflict Resolution Visualization */}
      <ConflictResolutionVisualization 
        conflicts={activeConflicts}
        resolved={resolvedConflicts}
        position={[-4, 0, 0]}
      />

      {/* Video Call Sessions */}
      <VideoCallSessionsVisualization
        sessions={activeVideoSessions}
        position={[4, 0, 0]}
      />

      {/* Action Items Management */}
      <ActionItemsVisualization
        pendingItems={pendingActionItems}
        completedItems={completedActionItems}
        position={[0, 0, 4]}
      />

      {/* Analytics Display */}
      <AnalyticsDisplay
        analytics={analytics}
        position={[0, 0, -4]}
      />
    </group>
  )
}

/**
 * Conflict Resolution Visualization Component
 * Shows active and resolved conflicts in 3D space
 * Requirement 3.3: WHEN scheduling conflicts arise THEN the AI SHALL resolve conflicts automatically
 */
const ConflictResolutionVisualization: React.FC<{
  conflicts: SchedulingConflict[]
  resolved: SchedulingConflict[]
  position: [number, number, number]
}> = ({ conflicts, resolved, position }) => {
  return (
    <group position={position}>
      <Text
        position={[0, 2, 0]}
        fontSize={0.2}
        color="#ff4444"
        anchorX="center"
        anchorY="middle"
      >
        Conflicts
      </Text>

      {/* Active Conflicts */}
      {conflicts.map((conflict, index) => (
        <ConflictOrb
          key={conflict.id}
          conflict={conflict}
          position={[index * 1.5 - (conflicts.length - 1) * 0.75, 1, 0]}
          isActive={true}
        />
      ))}

      {/* Resolved Conflicts */}
      {resolved.map((conflict, index) => (
        <ConflictOrb
          key={conflict.id}
          conflict={conflict}
          position={[index * 1.5 - (resolved.length - 1) * 0.75, -1, 0]}
          isActive={false}
        />
      ))}
    </group>
  )
}

/**
 * Individual Conflict Orb Component
 */
const ConflictOrb: React.FC<{
  conflict: SchedulingConflict
  position: [number, number, number]
  isActive: boolean
}> = ({ conflict, position, isActive }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current && isActive) {
      // Pulse animation for active conflicts
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      meshRef.current.scale.setScalar(scale)
    }
  })

  const getColor = () => {
    if (!isActive) return '#44ff44' // Green for resolved
    switch (conflict.severity) {
      case 'critical': return '#ff0000'
      case 'high': return '#ff4444'
      case 'medium': return '#ff8844'
      case 'low': return '#ffaa44'
      default: return '#ff4444'
    }
  }

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.3, 16, 16]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={getColor()} 
          transparent 
          opacity={isActive ? 0.8 : 0.5}
        />
      </Sphere>

      {hovered && (
        <Html position={[0, 0.5, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            <div><strong>{conflict.type}</strong></div>
            <div>{conflict.description}</div>
            <div>Severity: {conflict.severity}</div>
            <div>Status: {isActive ? 'Active' : 'Resolved'}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * Video Call Sessions Visualization Component
 * Shows active video call sessions with executives
 * Requirement 3.5: IF executives join video calls THEN they SHALL do so autonomously
 */
const VideoCallSessionsVisualization: React.FC<{
  sessions: VideoCallSession[]
  position: [number, number, number]
}> = ({ sessions, position }) => {
  return (
    <group position={position}>
      <Text
        position={[0, 2, 0]}
        fontSize={0.2}
        color="#44aaff"
        anchorX="center"
        anchorY="middle"
      >
        Video Calls
      </Text>

      {sessions.map((session, index) => (
        <VideoCallSessionOrb
          key={session.id}
          session={session}
          position={[index * 2 - (sessions.length - 1), 0, 0]}
        />
      ))}

      {sessions.length === 0 && (
        <Text
          position={[0, 0, 0]}
          fontSize={0.15}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          No Active Calls
        </Text>
      )}
    </group>
  )
}

/**
 * Individual Video Call Session Orb Component
 */
const VideoCallSessionOrb: React.FC<{
  session: VideoCallSession
  position: [number, number, number]
}> = ({ session, position }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Rotating animation for active calls
      meshRef.current.rotation.y += 0.02
    }
  })

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.4, 16, 16]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color="#44aaff" 
          transparent 
          opacity={0.7}
        />
      </Sphere>

      {/* Platform indicator */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {session.platform}
      </Text>

      {hovered && (
        <Html position={[0, 0.8, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            <div><strong>{session.platform}</strong></div>
            <div>Status: {session.status}</div>
            <div>Executives: {session.executives.length}</div>
            {session.notes && <div>Notes: Available</div>}
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * Action Items Visualization Component
 * Shows pending and completed action items
 * Requirement 3.7: WHEN meetings conclude THEN executives SHALL handle automatic follow-ups and action item extraction
 */
const ActionItemsVisualization: React.FC<{
  pendingItems: MeetingActionItem[]
  completedItems: MeetingActionItem[]
  position: [number, number, number]
}> = ({ pendingItems, completedItems, position }) => {
  return (
    <group position={position}>
      <Text
        position={[0, 2, 0]}
        fontSize={0.2}
        color="#44ff44"
        anchorX="center"
        anchorY="middle"
      >
        Action Items
      </Text>

      {/* Pending Items */}
      <Text
        position={[-2, 1.5, 0]}
        fontSize={0.15}
        color="#ffaa44"
        anchorX="center"
        anchorY="middle"
      >
        Pending
      </Text>

      {pendingItems.map((item, index) => (
        <ActionItemCube
          key={item.id}
          item={item}
          position={[index * 0.8 - (pendingItems.length - 1) * 0.4, 0.5, 0]}
          isCompleted={false}
        />
      ))}

      {/* Completed Items */}
      <Text
        position={[2, 1.5, 0]}
        fontSize={0.15}
        color="#44ff44"
        anchorX="center"
        anchorY="middle"
      >
        Completed
      </Text>

      {completedItems.map((item, index) => (
        <ActionItemCube
          key={item.id}
          item={item}
          position={[index * 0.8 - (completedItems.length - 1) * 0.4, -0.5, 0]}
          isCompleted={true}
        />
      ))}
    </group>
  )
}

/**
 * Individual Action Item Cube Component
 */
const ActionItemCube: React.FC<{
  item: MeetingActionItem
  position: [number, number, number]
  isCompleted: boolean
}> = ({ item, position, isCompleted }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const getColor = () => {
    if (isCompleted) return '#44ff44'
    switch (item.priority) {
      case 'urgent': return '#ff0000'
      case 'high': return '#ff4444'
      case 'medium': return '#ff8844'
      case 'low': return '#ffaa44'
      default: return '#ffaa44'
    }
  }

  return (
    <group position={position}>
      <Box
        ref={meshRef}
        args={[0.3, 0.3, 0.3]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={getColor()} 
          transparent 
          opacity={isCompleted ? 0.5 : 0.8}
        />
      </Box>

      {hovered && (
        <Html position={[0, 0.4, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            <div><strong>{item.title}</strong></div>
            <div>Priority: {item.priority}</div>
            <div>Status: {item.status}</div>
            <div>Assigned: {item.assignedTo}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * Analytics Display Component
 * Shows AI scheduling performance metrics
 */
const AnalyticsDisplay: React.FC<{
  analytics: any
  position: [number, number, number]
}> = ({ analytics, position }) => {
  return (
    <group position={position}>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        AI Analytics
      </Text>

      {/* Conflicts Resolved */}
      <Text
        position={[-1, 0.5, 0]}
        fontSize={0.15}
        color="#44ff44"
        anchorX="center"
        anchorY="middle"
      >
        Conflicts: {analytics.conflictsResolved}
      </Text>

      {/* AI Accuracy */}
      <Text
        position={[1, 0.5, 0]}
        fontSize={0.15}
        color="#44aaff"
        anchorX="center"
        anchorY="middle"
      >
        Accuracy: {(analytics.aiAccuracy * 100).toFixed(1)}%
      </Text>

      {/* User Satisfaction */}
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.15}
        color="#ffaa44"
        anchorX="center"
        anchorY="middle"
      >
        Satisfaction: {(analytics.userSatisfaction * 100).toFixed(1)}%
      </Text>
    </group>
  )
}

export default AISchedulingVisualization 