'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppStore'
import { useCalendar } from '../../hooks/useCalendar'
import { CalendarEvent, Calendar, CalendarProvider } from '../../types/calendar'
import { ExecutiveState } from '../../types'
import { ParticleEffectsManager } from '../../utils/particleEffects'

interface CalendarVisualizationProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

const CalendarVisualization: React.FC<CalendarVisualizationProps> = ({
  position = [0, 2, -8],
  rotation = [0, 0, 0],
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // Get calendar data from the hook
  const {
    calendars,
    events,
    availability,
    isLoading,
    error,
    loadEvents,
    getTodayEvents,
    getThisWeekEvents,
    getThisMonthEvents,
    hasConflicts
  } = useCalendar('user-1') // TODO: Get actual user ID

  // Get executive states
  const executiveStates = useAppSelector(state => state.executives.states)

  // Load events for the current month
  useEffect(() => {
    const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    loadEvents(startDate, endDate)
  }, [selectedDate, loadEvents])

  // Animation
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Gentle floating animation
    groupRef.current.position.y = position[1] + Math.sin(time * 0.3) * 0.05
    
    // Subtle rotation
    groupRef.current.rotation.y = rotation[1] + Math.sin(time * 0.1) * 0.02
  })

  // Group events by day for Tetris-like layout
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}
    
    events.forEach(event => {
      const dayKey = event.startTime.toISOString().split('T')[0]
      if (!grouped[dayKey]) {
        grouped[dayKey] = []
      }
      grouped[dayKey].push(event)
    })
    
    return grouped
  }, [events])

  // Calculate Tetris-like layout positions
  const getEventPosition = (event: CalendarEvent, index: number, totalEvents: number) => {
    const dayStart = new Date(event.startTime)
    dayStart.setHours(0, 0, 0, 0)
    
    const timeOffset = (event.startTime.getTime() - dayStart.getTime()) / (24 * 60 * 60 * 1000)
    const dayOfMonth = event.startTime.getDate()
    
    // Tetris-like positioning
    const x = (dayOfMonth - 1) * 0.8 - 12 // Spread across month
    const y = timeOffset * 4 - 2 // Time-based height
    const z = index * 0.1 // Stack events on same time
    
    return [x, y, z] as [number, number, number]
  }

  // Get event color based on priority and executive
  const getEventColor = (event: CalendarEvent) => {
    if (event.priority === 'critical') return '#ff4444'
    if (event.priority === 'high') return '#ff8844'
    if (event.priority === 'medium') return '#44ff44'
    return '#4444ff'
  }

  // Get event size based on duration
  const getEventSize = (event: CalendarEvent) => {
    const duration = event.endTime.getTime() - event.startTime.getTime()
    const hours = duration / (1000 * 60 * 60)
    
    if (hours > 4) return 1.5
    if (hours > 2) return 1.2
    if (hours > 1) return 1.0
    return 0.8
  }

  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
    >
      {/* Calendar Grid Background */}
      <CalendarGrid selectedDate={selectedDate} />
      
      {/* Tetris-like Calendar Blocks */}
      <CalendarBlocks 
        eventsByDay={eventsByDay}
        getEventPosition={getEventPosition}
        getEventColor={getEventColor}
        getEventSize={getEventSize}
        onEventHover={setHoveredEvent}
        hoveredEvent={hoveredEvent}
      />
      
      {/* Floating Meeting Orbs */}
      <FloatingMeetingOrbs 
        events={events}
        executiveStates={executiveStates}
      />
      
      {/* Executive Availability Indicators */}
      <ExecutiveAvailabilityIndicators 
        availability={availability}
        executiveStates={executiveStates}
      />
      
      {/* Calendar Navigation Controls */}
      <CalendarNavigation 
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      
      {/* Conflict Indicators */}
      {hasConflicts() && (
        <ConflictIndicators events={events} />
      )}
      
      {/* Loading State */}
      {isLoading && (
        <LoadingIndicator />
      )}
      
      {/* Error State */}
      {error && (
        <ErrorIndicator error={error} />
      )}
    </group>
  )
}

// Calendar Grid Component
interface CalendarGridProps {
  selectedDate: Date
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ selectedDate }) => {
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay()
  
  return (
    <group position={[0, -3, 0]}>
      {/* Month header */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.5}
        color="#4d7cff"
        anchorX="center"
        anchorY="middle"
      >
        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>
      
      {/* Day labels */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
        <Text
          key={day}
          position={[index * 1.2 - 3.6, 1.8, 0]}
          fontSize={0.2}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          {day}
        </Text>
      ))}
      
      {/* Calendar grid */}
      {Array.from({ length: 42 }, (_, index) => {
        const dayNumber = index - firstDayOfMonth + 1
        const row = Math.floor(index / 7)
        const col = index % 7
        
        if (dayNumber < 1 || dayNumber > daysInMonth) {
          return null
        }
        
        return (
          <group key={index} position={[col * 1.2 - 3.6, 1.5 - row * 1.2, 0]}>
            {/* Grid cell */}
            <mesh>
              <boxGeometry args={[1, 1, 0.05]} />
              <meshStandardMaterial 
                color="#1a1a2e" 
                transparent 
                opacity={0.3}
              />
            </mesh>
            
            {/* Day number */}
            <Text
              position={[0, 0, 0.03]}
              fontSize={0.15}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {dayNumber.toString()}
            </Text>
          </group>
        )
      })}
    </group>
  )
}

// Calendar Blocks Component (Tetris-like)
interface CalendarBlocksProps {
  eventsByDay: Record<string, CalendarEvent[]>
  getEventPosition: (event: CalendarEvent, index: number, totalEvents: number) => [number, number, number]
  getEventColor: (event: CalendarEvent) => string
  getEventSize: (event: CalendarEvent) => number
  onEventHover: (eventId: string | null) => void
  hoveredEvent: string | null
}

const CalendarBlocks: React.FC<CalendarBlocksProps> = ({
  eventsByDay,
  getEventPosition,
  getEventColor,
  getEventSize,
  onEventHover,
  hoveredEvent
}) => {
  return (
    <group position={[0, 0, 0]}>
      {Object.entries(eventsByDay).map(([dayKey, dayEvents]) => (
        <group key={dayKey}>
          {dayEvents.map((event, index) => {
            const [x, y, z] = getEventPosition(event, index, dayEvents.length)
            const color = getEventColor(event)
            const size = getEventSize(event)
            const isHovered = hoveredEvent === event.id
            
            return (
              <group key={event.id} position={[x, y, z]}>
                {/* Tetris-like block */}
                <mesh
                  onPointerOver={() => onEventHover(event.id)}
                  onPointerOut={() => onEventHover(null)}
                  scale={isHovered ? 1.2 : 1}
                >
                  <boxGeometry args={[0.8 * size, 0.6 * size, 0.4]} />
                  <meshStandardMaterial 
                    color={color}
                    transparent
                    opacity={0.8}
                    emissive={color}
                    emissiveIntensity={isHovered ? 0.3 : 0.1}
                  />
                </mesh>
                
                {/* Event title */}
                <Text
                  position={[0, 0.4 * size, 0.25]}
                  fontSize={0.1}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="middle"
                  maxWidth={0.6}
                >
                  {event.title}
                </Text>
                
                {/* Time indicator */}
                <Text
                  position={[0, -0.4 * size, 0.25]}
                  fontSize={0.08}
                  color="#cccccc"
                  anchorX="center"
                  anchorY="middle"
                >
                  {event.startTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                
                {/* Hover tooltip */}
                {isHovered && (
                  <Html position={[0, 0.8 * size, 0]} center>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none'
                    }}>
                      <div><strong>{event.title}</strong></div>
                      <div>{event.startTime.toLocaleString()}</div>
                      <div>{event.endTime.toLocaleString()}</div>
                      {event.location && <div>📍 {event.location}</div>}
                      {event.attendees.length > 0 && (
                        <div>👥 {event.attendees.length} attendees</div>
                      )}
                    </div>
                  </Html>
                )}
              </group>
            )
          })}
        </group>
      ))}
    </group>
  )
}

// Floating Meeting Orbs Component
interface FloatingMeetingOrbsProps {
  events: CalendarEvent[]
  executiveStates: ExecutiveState[]
}

const FloatingMeetingOrbs: React.FC<FloatingMeetingOrbsProps> = ({ 
  events, 
  executiveStates 
}) => {
  const now = new Date()
  const upcomingEvents = events.filter(event => event.startTime > now)
  
  return (
    <group position={[0, 4, 0]}>
      {upcomingEvents.slice(0, 5).map((event, index) => {
        const timeUntil = event.startTime.getTime() - now.getTime()
        const hoursUntil = timeUntil / (1000 * 60 * 60)
        
        // Position orbs in a circle
        const angle = (index / upcomingEvents.length) * Math.PI * 2
        const radius = 3
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        
        // Size based on urgency
        const size = hoursUntil < 1 ? 1.5 : hoursUntil < 24 ? 1.2 : 1.0
        
        // Color based on priority
        const color = event.priority === 'critical' ? '#ff4444' : 
                     event.priority === 'high' ? '#ff8844' : 
                     event.priority === 'medium' ? '#44ff44' : '#4444ff'
        
        return (
          <group key={event.id} position={[x, 0, z]}>
            {/* Orb */}
            <mesh scale={[size, size, size]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial 
                color={color}
                transparent
                opacity={0.7}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </mesh>
            
            {/* Pulse effect */}
            <PulseEffect color={color} />
            
            {/* Meeting info */}
            <Text
              position={[0, 0.8, 0]}
              fontSize={0.15}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              maxWidth={1.5}
            >
              {event.title}
            </Text>
            
            {/* Time until */}
            <Text
              position={[0, -0.8, 0]}
              fontSize={0.1}
              color="#cccccc"
              anchorX="center"
              anchorY="middle"
            >
              {hoursUntil < 1 ? `${Math.round(timeUntil / (1000 * 60))}m` :
               hoursUntil < 24 ? `${Math.round(hoursUntil)}h` :
               `${Math.round(hoursUntil / 24)}d`}
            </Text>
            
            {/* Executive indicator */}
            {event.executiveId && (
              <ExecutiveIndicator 
                executiveId={event.executiveId}
                executiveStates={executiveStates}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}

// Pulse Effect Component
interface PulseEffectProps {
  color: string
}

const PulseEffect: React.FC<PulseEffectProps> = ({ color }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    const scale = 1 + Math.sin(time * 2) * 0.2
    meshRef.current.scale.setScalar(scale)
    
    const opacity = 0.3 + Math.sin(time * 2) * 0.2
    ;(meshRef.current.material as THREE.MeshStandardMaterial).opacity = opacity
  })
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.6, 16, 16]} />
      <meshStandardMaterial 
        color={color}
        transparent
        opacity={0.3}
      />
    </mesh>
  )
}

// Executive Indicator Component
interface ExecutiveIndicatorProps {
  executiveId: string
  executiveStates: ExecutiveState[]
}

const ExecutiveIndicator: React.FC<ExecutiveIndicatorProps> = ({ 
  executiveId, 
  executiveStates 
}) => {
  const executive = executiveStates.find(state => state.executive.id === executiveId)
  
  if (!executive) return null
  
  return (
    <group position={[0, -1.2, 0]}>
      <Text
        fontSize={0.08}
        color="#4d7cff"
        anchorX="center"
        anchorY="middle"
      >
        {executive.executive.role}
      </Text>
    </group>
  )
}

// Executive Availability Indicators Component
interface ExecutiveAvailabilityIndicatorsProps {
  availability: any[]
  executiveStates: ExecutiveState[]
}

const ExecutiveAvailabilityIndicators: React.FC<ExecutiveAvailabilityIndicatorsProps> = ({
  availability,
  executiveStates
}) => {
  return (
    <group position={[8, 0, 0]}>
      {executiveStates.map((state, index) => {
        const angle = (index / executiveStates.length) * Math.PI * 2
        const radius = 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        
        const isAvailable = state.isActive && state.executive.currentActivity === 'idle'
        const color = isAvailable ? '#44ff44' : '#ff4444'
        
        return (
          <group key={state.executive.id} position={[x, 0, z]}>
            {/* Availability indicator */}
            <mesh>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
              />
            </mesh>
            
            {/* Executive name */}
            <Text
              position={[0, 0.5, 0]}
              fontSize={0.12}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {state.executive.role}
            </Text>
            
            {/* Status */}
            <Text
              position={[0, -0.5, 0]}
              fontSize={0.08}
              color={isAvailable ? "#44ff44" : "#ff4444"}
              anchorX="center"
              anchorY="middle"
            >
              {isAvailable ? "Available" : "Busy"}
            </Text>
          </group>
        )
      })}
    </group>
  )
}

// Calendar Navigation Component
interface CalendarNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  selectedDate,
  onDateChange
}) => {
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() - 1)
    onDateChange(newDate)
  }
  
  const handleNextMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() + 1)
    onDateChange(newDate)
  }
  
  return (
    <group position={[0, -5, 0]}>
      {/* Previous month button */}
      <Html position={[-2, 0, 0]} center>
        <button
          onClick={handlePreviousMonth}
          style={{
            background: '#4d7cff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Previous
        </button>
      </Html>
      
      {/* Next month button */}
      <Html position={[2, 0, 0]} center>
        <button
          onClick={handleNextMonth}
          style={{
            background: '#4d7cff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Next →
        </button>
      </Html>
    </group>
  )
}

// Conflict Indicators Component
interface ConflictIndicatorsProps {
  events: CalendarEvent[]
}

const ConflictIndicators: React.FC<ConflictIndicatorsProps> = ({ events }) => {
  const conflicts = events.filter((event, index) => {
    for (let j = index + 1; j < events.length; j++) {
      const otherEvent = events[j]
      if (event.startTime < otherEvent.endTime && otherEvent.startTime < event.endTime) {
        return true
      }
    }
    return false
  })
  
  return (
    <group position={[0, 3, 0]}>
      {conflicts.map((event, index) => (
        <group key={event.id} position={[index * 0.5 - conflicts.length * 0.25, 0, 0]}>
          {/* Conflict warning */}
          <mesh>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial 
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={0.8}
            />
          </mesh>
          
          <Text
            position={[0, 0.4, 0]}
            fontSize={0.1}
            color="#ff0000"
            anchorX="center"
            anchorY="middle"
          >
            ⚠️
          </Text>
        </group>
      ))}
    </group>
  )
}

// Loading Indicator Component
const LoadingIndicator: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    meshRef.current.rotation.y = time * 2
  })
  
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <torusGeometry args={[1, 0.1, 8, 16]} />
        <meshStandardMaterial 
          color="#4d7cff"
          emissive="#4d7cff"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.2}
        color="#4d7cff"
        anchorX="center"
        anchorY="middle"
      >
        Loading Calendar...
      </Text>
    </group>
  )
}

// Error Indicator Component
interface ErrorIndicatorProps {
  error: string
}

const ErrorIndicator: React.FC<ErrorIndicatorProps> = ({ error }) => {
  return (
    <group position={[0, 0, 0]}>
      <Text
        position={[0, 0, 0]}
        fontSize={0.2}
        color="#ff4444"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
      >
        Error: {error}
      </Text>
    </group>
  )
}

export default CalendarVisualization 