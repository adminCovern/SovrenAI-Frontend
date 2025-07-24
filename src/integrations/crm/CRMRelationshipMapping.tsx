import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { RevolutionaryCRMContact, Interaction, InteractionType } from './CRMService'

interface CRMRelationshipMappingProps {
  contacts: RevolutionaryCRMContact[]
  onContactSelect?: (contact: RevolutionaryCRMContact) => void
  onInteractionSelect?: (interaction: Interaction) => void
}

interface ContactNode {
  contact: RevolutionaryCRMContact
  position: THREE.Vector3
  velocity: THREE.Vector3
  connections: string[]
  executiveAssignment: string
  relationshipStrength: number
}

interface Connection {
  from: string
  to: string
  strength: number
  type: InteractionType
  lastInteraction: Date
}

interface NetworkGraph {
  nodes: ContactNode[]
  connections: Connection[]
  executiveAssignments: Map<string, string[]>
}

export const CRMRelationshipMapping: React.FC<CRMRelationshipMappingProps> = ({
  contacts,
  onContactSelect,
  onInteractionSelect
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const animationRef = useRef<number>()
  
  const [networkGraph, setNetworkGraph] = useState<NetworkGraph>({ nodes: [], connections: [], executiveAssignments: new Map() })
  const [selectedContact, setSelectedContact] = useState<RevolutionaryCRMContact | null>(null)
  const [hoveredContact, setHoveredContact] = useState<RevolutionaryCRMContact | null>(null)
  const [selectedExecutive, setSelectedExecutive] = useState<string | null>(null)

  // Initialize 3D scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 50)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Create network graph
    createNetworkGraph(contacts, scene)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      updateNetworkGraph()
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [contacts])

  const createNetworkGraph = (contacts: RevolutionaryCRMContact[], scene: THREE.Scene) => {
    const nodes: ContactNode[] = []
    const connections: Connection[] = []
    const executiveAssignments = new Map<string, string[]>()

    // Create contact nodes
    contacts.forEach((contact, index) => {
      // Position nodes in a circular pattern
      const angle = (index / contacts.length) * Math.PI * 2
      const radius = 20
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      )

      // Create node geometry
      const nodeGeometry = new THREE.SphereGeometry(1, 16, 16)
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: getContactColor(contact.relationshipStrength),
        transparent: true,
        opacity: 0.8
      })
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial)
      nodeMesh.position.copy(position)
      nodeMesh.castShadow = true
      nodeMesh.receiveShadow = true
      nodeMesh.userData = { contact, nodeIndex: index }
      scene.add(nodeMesh)

      // Add contact label
      const textGeometry = new THREE.PlaneGeometry(4, 1)
      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      })
      const textMesh = new THREE.Mesh(textGeometry, textMaterial)
      textMesh.position.set(0, 2, 0)
      nodeMesh.add(textMesh)

      nodes.push({
        contact,
        position: position.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        connections: [],
        executiveAssignment: getExecutiveAssignment(contact),
        relationshipStrength: contact.relationshipStrength
      })

      // Track executive assignments
      const executive = getExecutiveAssignment(contact)
      if (!executiveAssignments.has(executive)) {
        executiveAssignments.set(executive, [])
      }
      executiveAssignments.get(executive)!.push(contact.id)
    })

    // Create connections based on interaction history
    contacts.forEach((contact, index) => {
      contact.interactionHistory.forEach((interaction) => {
        if (interaction.type === 'email' || interaction.type === 'meeting') {
          const targetContact = contacts.find(c => c.id === interaction.executive)
          if (targetContact) {
            const connection: Connection = {
              from: contact.id,
              to: targetContact.id,
              strength: interaction.outcome === 'positive' ? 1.0 : 0.5,
              type: interaction.type,
              lastInteraction: interaction.timestamp
            }
            connections.push(connection)

            // Create connection line
            const fromNode = nodes.find(n => n.contact.id === contact.id)
            const toNode = nodes.find(n => n.contact.id === targetContact.id)
            
            if (fromNode && toNode) {
              const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                fromNode.position,
                toNode.position
              ])
              const lineMaterial = new THREE.LineBasicMaterial({
                color: getConnectionColor(interaction.type),
                transparent: true,
                opacity: connection.strength
              })
              const line = new THREE.Line(lineGeometry, lineMaterial)
              scene.add(line)
            }
          }
        }
      })
    })

    setNetworkGraph({ nodes, connections, executiveAssignments })
  }

  const updateNetworkGraph = () => {
    networkGraph.nodes.forEach((node, index) => {
      // Apply force-based layout
      const repulsionForce = new THREE.Vector3(0, 0, 0)
      const attractionForce = new THREE.Vector3(0, 0, 0)

      // Repulsion from other nodes
      networkGraph.nodes.forEach((otherNode, otherIndex) => {
        if (index !== otherIndex) {
          const distance = node.position.distanceTo(otherNode.position)
          if (distance < 5) {
            const repulsion = node.position.clone().sub(otherNode.position).normalize()
            repulsion.multiplyScalar(0.1 / distance)
            repulsionForce.add(repulsion)
          }
        }
      })

      // Attraction to connected nodes
      node.connections.forEach(connectionId => {
        const connectedNode = networkGraph.nodes.find(n => n.contact.id === connectionId)
        if (connectedNode) {
          const distance = node.position.distanceTo(connectedNode.position)
          const attraction = connectedNode.position.clone().sub(node.position).normalize()
          attraction.multiplyScalar(0.01 * distance)
          attractionForce.add(attraction)
        }
      })

      // Apply forces
      node.velocity.add(repulsionForce)
      node.velocity.add(attractionForce)
      node.velocity.multiplyScalar(0.95) // Damping
      node.position.add(node.velocity)

      // Keep nodes within bounds
      const maxDistance = 30
      const distance = node.position.length()
      if (distance > maxDistance) {
        node.position.normalize().multiplyScalar(maxDistance)
      }
    })
  }

  const getContactColor = (relationshipStrength: number): number => {
    if (relationshipStrength >= 0.8) return 0x00ff00 // Green for strong relationships
    if (relationshipStrength >= 0.5) return 0xffff00 // Yellow for medium relationships
    return 0xff0000 // Red for weak relationships
  }

  const getConnectionColor = (type: InteractionType): number => {
    switch (type) {
      case 'email': return 0x0066cc
      case 'meeting': return 0xcc6600
      case 'call': return 0xcc0066
      case 'social': return 0x66cc00
      case 'referral': return 0xcc00cc
      default: return 0x666666
    }
  }

  const getExecutiveAssignment = (contact: RevolutionaryCRMContact): string => {
    const executives = ['Marcus', 'Sarah', 'David', 'Emily', 'James', 'Lisa', 'Michael', 'Rachel']
    return executives[contact.id.charCodeAt(0) % executives.length]
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!cameraRef.current || !rendererRef.current) return

    const mouse = new THREE.Vector2()
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)

    const intersects = raycaster.intersectObjects(sceneRef.current?.children || [])
    
    if (intersects.length > 0) {
      const object = intersects[0].object
      if (object.userData?.contact) {
        setHoveredContact(object.userData.contact)
      }
    } else {
      setHoveredContact(null)
    }
  }

  const handleClick = (event: React.MouseEvent) => {
    if (!cameraRef.current || !rendererRef.current) return

    const mouse = new THREE.Vector2()
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)

    const intersects = raycaster.intersectObjects(sceneRef.current?.children || [])
    
    if (intersects.length > 0) {
      const object = intersects[0].object
      if (object.userData?.contact) {
        setSelectedContact(object.userData.contact)
        onContactSelect?.(object.userData.contact)
      }
    }
  }

  return (
    <div 
      ref={mountRef} 
      style={{ width: '100%', height: '100%' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Executive Assignment Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        <h3>Executive Assignments</h3>
        {Array.from(networkGraph.executiveAssignments.entries()).map(([executive, contactIds]) => (
          <div key={executive} style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', color: getExecutiveColor(executive) }}>
              {executive}: {contactIds.length} contacts
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {contactIds.slice(0, 3).join(', ')}
              {contactIds.length > 3 && '...'}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Details Panel */}
      {selectedContact && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <h3>Contact Details</h3>
          <div><strong>Name:</strong> {selectedContact.name}</div>
          <div><strong>Company:</strong> {selectedContact.company}</div>
          <div><strong>Email:</strong> {selectedContact.email}</div>
          <div><strong>Phone:</strong> {selectedContact.phone}</div>
          <div><strong>Relationship Strength:</strong> {(selectedContact.relationshipStrength * 100).toFixed(1)}%</div>
          <div><strong>Executive:</strong> {getExecutiveAssignment(selectedContact)}</div>
          <div><strong>Interactions:</strong> {selectedContact.interactionHistory.length}</div>
          
          <h4 style={{ marginTop: '15px' }}>Recent Interactions</h4>
          {selectedContact.interactionHistory.slice(-3).map((interaction, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '5px' }}>
              <div>{interaction.type} - {interaction.outcome}</div>
              <div style={{ opacity: 0.7 }}>{interaction.timestamp.toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Network Statistics */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        <h3>Network Statistics</h3>
        <div>Total Contacts: {contacts.length}</div>
        <div>Total Connections: {networkGraph.connections.length}</div>
        <div>Average Relationship Strength: {(contacts.reduce((sum, c) => sum + c.relationshipStrength, 0) / contacts.length * 100).toFixed(1)}%</div>
        <div>Active Executives: {networkGraph.executiveAssignments.size}</div>
      </div>

      {/* Hover Tooltip */}
      {hoveredContact && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          zIndex: 1001,
          pointerEvents: 'none'
        }}>
          <div><strong>{hoveredContact.name}</strong></div>
          <div>{hoveredContact.company}</div>
          <div>{(hoveredContact.relationshipStrength * 100).toFixed(1)}% strength</div>
        </div>
      )}
    </div>
  )
}

const getExecutiveColor = (executive: string): string => {
  const colors = {
    'Marcus': '#ff6b6b',
    'Sarah': '#4ecdc4',
    'David': '#45b7d1',
    'Emily': '#96ceb4',
    'James': '#feca57',
    'Lisa': '#ff9ff3',
    'Michael': '#54a0ff',
    'Rachel': '#5f27cd'
  }
  return colors[executive as keyof typeof colors] || '#ffffff'
}

export default CRMRelationshipMapping 