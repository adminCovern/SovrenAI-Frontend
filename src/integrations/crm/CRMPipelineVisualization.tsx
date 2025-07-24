import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { RevolutionaryCRMPipeline, RevolutionaryCRMDeal, PipelineStage } from './CRMService'

interface CRMPipelineVisualizationProps {
  pipelines: RevolutionaryCRMPipeline[]
  onDealSelect?: (deal: RevolutionaryCRMDeal) => void
  onStageSelect?: (stage: PipelineStage) => void
}

interface DealCard {
  deal: RevolutionaryCRMDeal
  position: THREE.Vector3
  velocity: THREE.Vector3
  targetStage: PipelineStage
  executiveGuidance: string
  revenueImpact: number
}

interface RiverFlow {
  path: THREE.CurvePath<THREE.Vector3>
  width: number
  depth: number
  flowSpeed: number
  turbulence: number
}

export const CRMPipelineVisualization: React.FC<CRMPipelineVisualizationProps> = ({
  pipelines,
  onDealSelect,
  onStageSelect
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const animationRef = useRef<number>()
  
  const [dealCards, setDealCards] = useState<DealCard[]>([])
  const [riverFlows, setRiverFlows] = useState<RiverFlow[]>([])
  const [selectedDeal, setSelectedDeal] = useState<RevolutionaryCRMDeal | null>(null)
  const [hoveredDeal, setHoveredDeal] = useState<RevolutionaryCRMDeal | null>(null)

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
    camera.position.set(0, 15, 20)
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
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Create river flows for each pipeline
    createRiverFlows(pipelines, scene)

    // Create deal cards
    createDealCards(pipelines, scene)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      updateDealCards()
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
  }, [pipelines])

  const createRiverFlows = (pipelines: RevolutionaryCRMPipeline[], scene: THREE.Scene) => {
    const flows: RiverFlow[] = []

    pipelines.forEach((pipeline, pipelineIndex) => {
      // Create curved path for river flow
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(-20, 0, -10),
        new THREE.Vector3(-10, 2, -5),
        new THREE.Vector3(10, 2, 5),
        new THREE.Vector3(20, 0, 10)
      )

      const path = new THREE.CurvePath<THREE.Vector3>()
      path.add(curve)

      // Create river geometry
      const riverGeometry = new THREE.TubeGeometry(curve, 64, 2, 8, false)
      const riverMaterial = new THREE.MeshPhongMaterial({
        color: 0x0066cc,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      })
      const riverMesh = new THREE.Mesh(riverGeometry, riverMaterial)
      riverMesh.castShadow = true
      riverMesh.receiveShadow = true
      scene.add(riverMesh)

      // Add flow particles
      const particleCount = 100
      const particles = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)

      for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount
        const point = curve.getPoint(t)
        positions[i * 3] = point.x
        positions[i * 3 + 1] = point.y + 0.5
        positions[i * 3 + 2] = point.z

        colors[i * 3] = 0.2 + Math.random() * 0.8
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.5
        colors[i * 3 + 2] = 1.0
      }

      particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      particles.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const particleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      })

      const particleSystem = new THREE.Points(particles, particleMaterial)
      scene.add(particleSystem)

      flows.push({
        path,
        width: 2,
        depth: 1,
        flowSpeed: 0.02,
        turbulence: 0.1
      })
    })

    setRiverFlows(flows)
  }

  const createDealCards = (pipelines: RevolutionaryCRMPipeline[], scene: THREE.Scene) => {
    const cards: DealCard[] = []

    pipelines.forEach((pipeline, pipelineIndex) => {
      pipeline.deals.forEach((deal, dealIndex) => {
        // Create deal card geometry
        const cardGeometry = new THREE.BoxGeometry(3, 2, 0.2)
        const cardMaterial = new THREE.MeshPhongMaterial({
          color: getDealColor(deal.value),
          transparent: true,
          opacity: 0.9
        })
        const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial)
        cardMesh.castShadow = true
        cardMesh.receiveShadow = true

        // Position card along river path
        const t = dealIndex / pipeline.deals.length
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(-20, 0, -10),
          new THREE.Vector3(-10, 2, -5),
          new THREE.Vector3(10, 2, 5),
          new THREE.Vector3(20, 0, 10)
        )
        const position = curve.getPoint(t)
        cardMesh.position.copy(position)
        cardMesh.position.y += 1

        // Add deal information text
        const textGeometry = new THREE.PlaneGeometry(2.5, 1.5)
        const textMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8
        })
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.position.set(0, 0, 0.11)
        cardMesh.add(textMesh)

        scene.add(cardMesh)

        // Store card data
        cards.push({
          deal,
          position: cardMesh.position.clone(),
          velocity: new THREE.Vector3(0.01, 0, 0),
          targetStage: deal.stage,
          executiveGuidance: generateExecutiveGuidance(deal),
          revenueImpact: calculateRevenueImpact(deal)
        })

        // Add click handler
        cardMesh.userData = { deal, cardIndex: cards.length - 1 }
        // Note: Click handling will be done through raycasting in the main component
      })
    })

    setDealCards(cards)
  }

  const updateDealCards = () => {
    dealCards.forEach((card, index) => {
      // Update card position based on river flow
      const time = Date.now() * 0.001
      const flowSpeed = 0.02
      const turbulence = 0.1

      card.position.x += flowSpeed
      card.position.y += Math.sin(time + index) * turbulence * 0.1
      card.position.z += Math.cos(time + index) * turbulence * 0.1

      // Wrap around when reaching end
      if (card.position.x > 20) {
        card.position.x = -20
      }
    })
  }

  const getDealColor = (value: number): number => {
    if (value >= 1000000) return 0xff0000 // Red for high value
    if (value >= 500000) return 0xff6600 // Orange for medium-high
    if (value >= 100000) return 0xffff00 // Yellow for medium
    return 0x00ff00 // Green for low value
  }

  const generateExecutiveGuidance = (deal: RevolutionaryCRMDeal): string => {
    const guidance = [
      'Focus on relationship building',
      'Prepare detailed proposal',
      'Schedule executive meeting',
      'Address technical concerns',
      'Negotiate pricing strategy',
      'Close the deal'
    ]
    return guidance[Math.floor(Math.random() * guidance.length)]
  }

  const calculateRevenueImpact = (deal: RevolutionaryCRMDeal): number => {
    return deal.value * deal.probability
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
      if (object.userData?.deal) {
        setHoveredDeal(object.userData.deal)
      }
    } else {
      setHoveredDeal(null)
    }
  }

  return (
    <div 
      ref={mountRef} 
      style={{ width: '100%', height: '100%' }}
      onMouseMove={handleMouseMove}
    >
      {/* Revenue Forecasting Overlay */}
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
        <h3>Revenue Forecast</h3>
        <div>Total Pipeline Value: ${pipelines.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}</div>
        <div>Deals in Progress: {pipelines.reduce((sum, p) => sum + p.deals.length, 0)}</div>
        <div>Average Deal Size: ${(pipelines.reduce((sum, p) => sum + p.revenue, 0) / pipelines.reduce((sum, p) => sum + p.deals.length, 1)).toLocaleString()}</div>
      </div>

      {/* Executive Guidance Panel */}
      {selectedDeal && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <h3>Executive Guidance</h3>
          <div><strong>Deal:</strong> {selectedDeal.name}</div>
          <div><strong>Value:</strong> ${selectedDeal.value.toLocaleString()}</div>
          <div><strong>Stage:</strong> {selectedDeal.stage.name}</div>
          <div><strong>Probability:</strong> {(selectedDeal.probability * 100).toFixed(1)}%</div>
          <div><strong>Guidance:</strong> {generateExecutiveGuidance(selectedDeal)}</div>
        </div>
      )}

             {/* Hover Tooltip */}
       {hoveredDeal && (
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
          <div><strong>{hoveredDeal.name}</strong></div>
          <div>${hoveredDeal.value.toLocaleString()}</div>
          <div>{hoveredDeal.stage.name}</div>
        </div>
      )}
    </div>
  )
}

export default CRMPipelineVisualization 