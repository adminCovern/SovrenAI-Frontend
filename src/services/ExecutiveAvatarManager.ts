import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Executive, ExecutiveState, AnimationState, ExecutiveRole } from '../types'

/**
 * Service responsible for managing executive avatars in the 3D scene
 * Handles loading models, animations, and positioning in semi-circle formation
 */
export class ExecutiveAvatarManager {
  private scene: THREE.Scene
  private executiveModels: Map<string, THREE.Group> = new Map()
  private mixers: Map<string, THREE.AnimationMixer> = new Map()
  private animations: Map<string, Map<string, THREE.AnimationClip>> = new Map()
  private loader: GLTFLoader
  private clock: THREE.Clock
  private isLoading: boolean = false
  private loadingPromises: Map<string, Promise<THREE.Group>> = new Map()
  
  // Default avatar paths for each executive role
  private readonly DEFAULT_AVATARS = {
    'CEO': '/models/executives/ceo.glb',
    'CFO': '/models/executives/cfo.glb',
    'CTO': '/models/executives/cto.glb',
    'CMO': '/models/executives/cmo.glb',
    'COO': '/models/executives/coo.glb',
    'CHRO': '/models/executives/chro.glb',
    'CLO': '/models/executives/clo.glb',
    'CSO': '/models/executives/cso.glb'
  }
  
  // Placeholder colors for each executive role (used for temporary models)
  private readonly ROLE_COLORS = {
    'CEO': 0x4d7cff, // Blue
    'CFO': 0x00cc88, // Green
    'CTO': 0xff6600, // Orange
    'CMO': 0xcc44ff, // Purple
    'COO': 0xffcc00, // Yellow
    'CHRO': 0xff4477, // Pink
    'CLO': 0x00ccff, // Cyan
    'CSO': 0x88cc00  // Lime
  }

  constructor(scene: THREE.Scene, clock: THREE.Clock) {
    this.scene = scene
    this.clock = clock
    this.loader = new GLTFLoader()
  }

  /**
   * Updates all executive avatars based on their current states
   */
  public updateExecutives(executiveStates: ExecutiveState[]): void {
    // Position executives in semi-circle formation
    this.positionExecutivesInSemiCircle(executiveStates)
    
    // Update each executive model
    executiveStates.forEach(state => {
      this.updateExecutive(state)
    })
  }

  /**
   * Updates a single executive avatar based on its state
   */
  private async updateExecutive(state: ExecutiveState): Promise<void> {
    const { executive, isActive, animation } = state
    
    // Get or create executive model
    let model = this.executiveModels.get(executive.id)
    
    if (!model) {
      // Start loading the actual model
      this.loadExecutiveModel(executive)
      
      // Create temporary placeholder model while loading
      model = this.createPlaceholderModel(executive)
      this.executiveModels.set(executive.id, model)
      this.scene.add(model)
    }
    
    // Update model position
    model.position.set(
      executive.avatar.position.x,
      executive.avatar.position.y,
      executive.avatar.position.z
    )
    
    // Update animations based on activity state
    this.updateExecutiveAnimation(executive.id, isActive, animation)
    
    // Update visual effects based on activity
    this.updateVisualEffects(model, executive, isActive)
  }

  /**
   * Creates a temporary placeholder model for an executive
   */
  private createPlaceholderModel(executive: Executive): THREE.Group {
    const group = new THREE.Group()
    group.name = `executive-${executive.id}`
    
    // Create more detailed body with suit-like appearance
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.6, 8, 16)
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: this.ROLE_COLORS[executive.role] || 0x4d7cff,
      metalness: 0.3,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    })
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    body.receiveShadow = true
    body.position.y = 1.3
    body.name = 'body'
    
    // Create head with more realistic proportions
    const headGeometry = new THREE.SphereGeometry(0.32, 20, 20)
    const headMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5d5b5, // More realistic skin tone
      metalness: 0.0,
      roughness: 0.6,
      clearcoat: 0.1,
      transmission: 0.1 // Use transmission instead of subsurface
    })
    
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.castShadow = true
    head.receiveShadow = true
    head.position.y = 2.4
    head.name = 'head'
    
    // Add arms
    const armGeometry = new THREE.CapsuleGeometry(0.12, 1.2, 6, 12)
    const armMaterial = bodyMaterial.clone()
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-0.6, 1.3, 0)
    leftArm.rotation.z = Math.PI / 8
    leftArm.castShadow = true
    leftArm.name = 'leftArm'
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(0.6, 1.3, 0)
    rightArm.rotation.z = -Math.PI / 8
    rightArm.castShadow = true
    rightArm.name = 'rightArm'
    
    // Add legs
    const legGeometry = new THREE.CapsuleGeometry(0.15, 1.4, 6, 12)
    const legMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2a2a2a, // Dark pants
      metalness: 0.1,
      roughness: 0.8
    })
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-0.2, 0.3, 0)
    leftLeg.castShadow = true
    leftLeg.name = 'leftLeg'
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(0.2, 0.3, 0)
    rightLeg.castShadow = true
    rightLeg.name = 'rightLeg'
    
    // Add role-specific accessories
    this.addRoleSpecificDetails(group, executive.role)
    
    // Add holographic glow effect
    const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.ROLE_COLORS[executive.role] || 0x4d7cff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    })
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.scale.set(2.5, 2.5, 2.5)
    glow.position.y = 1.5
    glow.name = 'glow'
    
    // Add all parts to group
    group.add(body)
    group.add(head)
    group.add(leftArm)
    group.add(rightArm)
    group.add(leftLeg)
    group.add(rightLeg)
    group.add(glow)
    
    // Create animation mixer for this model
    const mixer = new THREE.AnimationMixer(group)
    this.mixers.set(executive.id, mixer)
    
    // Add procedural breathing animation
    this.addBreathingAnimation(group, executive.id)
    
    return group
  }

  /**
   * Adds a procedural breathing animation to a placeholder model
   */
  private addBreathingAnimation(group: THREE.Group, executiveId: string): void {
    // Create a more sophisticated breathing animation system
    const breathingData = {
      group,
      baseScale: { x: 1, y: 1, z: 1 },
      breathingRate: 0.8 + Math.random() * 0.4, // Vary breathing rate slightly
      amplitude: 0.02 + Math.random() * 0.01, // Vary breathing depth
      phase: Math.random() * Math.PI * 2, // Random starting phase
      isActive: true
    }
    
    // Store breathing data for this executive
    if (!this.animations.has(executiveId)) {
      this.animations.set(executiveId, new Map())
    }
    
    this.animations.get(executiveId)?.set('breathing', breathingData as any)
  }

  /**
   * Adds role-specific visual details to executive models
   */
  private addRoleSpecificDetails(group: THREE.Group, role: ExecutiveRole): void {
    switch (role) {
      case 'CEO':
        // Add a subtle crown or leadership indicator
        const crownGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.1, 8)
        const crownMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffd700,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0x332200,
          emissiveIntensity: 0.2
        })
        const crown = new THREE.Mesh(crownGeometry, crownMaterial)
        crown.position.y = 2.8
        crown.name = 'crown'
        group.add(crown)
        break
        
      case 'CFO':
        // Add calculator/financial symbol
        const calcGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.05)
        const calcMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x00cc88,
          metalness: 0.5,
          roughness: 0.3
        })
        const calculator = new THREE.Mesh(calcGeometry, calcMaterial)
        calculator.position.set(0.4, 1.8, 0.3)
        calculator.name = 'calculator'
        group.add(calculator)
        break
        
      case 'CTO':
        // Add tech/circuit pattern
        const chipGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.03)
        const chipMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x00ff88,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x003322,
          emissiveIntensity: 0.3
        })
        const chip = new THREE.Mesh(chipGeometry, chipMaterial)
        chip.position.set(-0.4, 1.9, 0.3)
        chip.name = 'chip'
        group.add(chip)
        break
        
      case 'CMO':
        // Add marketing/megaphone symbol
        const megaphoneGeometry = new THREE.ConeGeometry(0.1, 0.3, 8)
        const megaphoneMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xcc44ff,
          metalness: 0.4,
          roughness: 0.3
        })
        const megaphone = new THREE.Mesh(megaphoneGeometry, megaphoneMaterial)
        megaphone.position.set(0.3, 1.7, 0.4)
        megaphone.rotation.z = Math.PI / 4
        megaphone.name = 'megaphone'
        group.add(megaphone)
        break
        
      default:
        // Add a simple badge for other roles
        const badgeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16)
        const badgeMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x888888,
          metalness: 0.8,
          roughness: 0.2
        })
        const badge = new THREE.Mesh(badgeGeometry, badgeMaterial)
        badge.position.set(-0.3, 1.8, 0.35)
        badge.name = 'badge'
        group.add(badge)
        break
    }
  }



  /**
   * Loads the actual GLTF model for an executive
   */
  private loadExecutiveModel(executive: Executive): void {
    // If already loading this model, don't start again
    if (this.loadingPromises.has(executive.id)) {
      return
    }
    
    // Determine model path - use custom path if specified, otherwise use default
    const modelPath = executive.avatar.modelPath || this.DEFAULT_AVATARS[executive.role] || this.DEFAULT_AVATARS['CEO']
    
    // Create and store loading promise
    const loadingPromise = new Promise<THREE.Group>((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => {
          // Process loaded model
          const model = gltf.scene
          
          // Set up model properties
          model.castShadow = true
          model.receiveShadow = true
          
          // Apply scale from avatar config
          model.scale.set(
            executive.avatar.scale.x || 1,
            executive.avatar.scale.y || 1,
            executive.avatar.scale.z || 1
          )
          
          // Set up animations
          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)
            this.mixers.set(executive.id, mixer)
            
            // Store animations by name for this executive
            const animationMap = new Map<string, THREE.AnimationClip>()
            
            gltf.animations.forEach(clip => {
              animationMap.set(clip.name, clip)
              
              // Create animation action
              const action = mixer.clipAction(clip)
              
              // Configure action based on animation type
              if (clip.name === 'breathing' || clip.name === 'idle') {
                action.loop = THREE.LoopRepeat
                action.clampWhenFinished = false
                action.timeScale = 1.0
              } else {
                action.loop = THREE.LoopOnce
                action.clampWhenFinished = true
              }
            })
            
            this.animations.set(executive.id, animationMap)
          }
          
          // Replace placeholder with actual model
          const placeholder = this.executiveModels.get(executive.id)
          if (placeholder) {
            // Copy position from placeholder
            model.position.copy(placeholder.position)
            
            // Remove placeholder from scene
            this.scene.remove(placeholder)
          }
          
          // Add model to scene and store reference
          this.scene.add(model)
          this.executiveModels.set(executive.id, model)
          
          // Start breathing animation by default
          this.playAnimation(executive.id, 'breathing')
          
          resolve(model)
        },
        // Progress callback
        (xhr) => {
          // Could update loading progress here
        },
        // Error callback
        (error) => {
          console.error(`Error loading executive model: ${error instanceof Error ? error.message : String(error)}`)
          reject(error)
        }
      )
    })
    
    // Store promise for tracking
    this.loadingPromises.set(executive.id, loadingPromise)
  }

  /**
   * Updates the animation state for an executive
   */
  private updateExecutiveAnimation(
    executiveId: string, 
    isActive: boolean, 
    animationState: AnimationState
  ): void {
    const mixer = this.mixers.get(executiveId)
    if (!mixer) return
    
    // Get animations for this executive
    const animations = this.animations.get(executiveId)
    if (!animations) return
    
    // Handle breathing animation for placeholder models
    if (!animations.has(animationState.current) && animations.has('breathing')) {
      // For placeholder models, we'll update the breathing animation
      const breathingData = animations.get('breathing') as any
      const model = this.executiveModels.get(executiveId)
      
      if (model && breathingData && breathingData.isActive) {
        // Apply realistic breathing animation
        const time = this.clock.getElapsedTime()
        const breathingValue = Math.sin(time * breathingData.breathingRate + breathingData.phase) * breathingData.amplitude
        
        // Apply breathing to body (chest expansion)
        const body = model.getObjectByName('body')
        if (body) {
          body.scale.set(
            breathingData.baseScale.x + breathingValue * 0.5,
            breathingData.baseScale.y + breathingValue,
            breathingData.baseScale.z + breathingValue * 0.3
          )
        }
        
        // Subtle head movement
        const head = model.getObjectByName('head')
        if (head) {
          head.position.y = 2.4 + breathingValue * 0.1
        }
        
        // Arm movement
        const leftArm = model.getObjectByName('leftArm')
        const rightArm = model.getObjectByName('rightArm')
        if (leftArm && rightArm) {
          leftArm.rotation.z = Math.PI / 8 + breathingValue * 0.1
          rightArm.rotation.z = -Math.PI / 8 - breathingValue * 0.1
        }
      }
      return
    }
    
    // For actual models with animations
    if (animations.has(animationState.current)) {
      this.playAnimation(executiveId, animationState.current, animationState.speed)
    } else if (isActive && animations.has('active')) {
      this.playAnimation(executiveId, 'active')
    } else if (animations.has('breathing')) {
      this.playAnimation(executiveId, 'breathing')
    } else if (animations.has('idle')) {
      this.playAnimation(executiveId, 'idle')
    }
  }

  /**
   * Plays an animation for an executive
   */
  private playAnimation(executiveId: string, animationName: string, speed: number = 1.0): void {
    const mixer = this.mixers.get(executiveId)
    const animations = this.animations.get(executiveId)
    
    if (!mixer || !animations) return
    
    const clip = animations.get(animationName)
    if (!clip) return
    
    // Stop all current animations
    mixer.stopAllAction()
    
    // Play the requested animation
    const action = mixer.clipAction(clip)
    action.timeScale = speed
    action.reset().play()
  }

  /**
   * Updates visual effects for an executive based on activity
   */
  private updateVisualEffects(model: THREE.Group, executive: Executive, isActive: boolean): void {
    // Find glow effect
    const glowMesh = model.getObjectByName('glow') as THREE.Mesh
    
    // Update glow effect based on activity
    if (glowMesh && glowMesh.material instanceof THREE.MeshBasicMaterial) {
      const material = glowMesh.material
      
      if (isActive) {
        // Enhance glow for active executives
        material.color.set(this.ROLE_COLORS[executive.role] || 0x4d7cff)
        material.opacity = 0.12 + Math.sin(this.clock.getElapsedTime() * 2) * 0.08
        
        // Scale glow effect with pulse
        const pulseScale = 1 + Math.sin(this.clock.getElapsedTime() * 1.5) * 0.08
        glowMesh.scale.set(2.5 * pulseScale, 2.5 * pulseScale, 2.5 * pulseScale)
      } else {
        // Subtle glow for inactive executives
        material.opacity = 0.03 + Math.sin(this.clock.getElapsedTime() * 0.5) * 0.02
        glowMesh.scale.set(2.5, 2.5, 2.5)
      }
    }
    
    // Add subtle idle movements
    this.addIdleMovements(model, executive, isActive)
    
    // Add activity-specific visual effects
    switch (executive.currentActivity) {
      case 'call':
        this.addCallVisualization(model, executive)
        break
      case 'email':
        this.addEmailVisualization(model, executive)
        break
      case 'meeting':
        this.addMeetingVisualization(model, executive)
        break
      case 'analysis':
        this.addAnalysisVisualization(model, executive)
        break
      default:
        this.removeActivityVisualizations(model, executive)
        break
    }
  }

  /**
   * Adds subtle idle movements to make executives feel more alive
   */
  private addIdleMovements(model: THREE.Group, executive: Executive, isActive: boolean): void {
    const time = this.clock.getElapsedTime()
    const executiveOffset = executive.id.charCodeAt(executive.id.length - 1) // Use ID for unique offset
    
    // Subtle head movements
    const head = model.getObjectByName('head')
    if (head) {
      // Occasional head turns
      const headTurnFreq = 0.1 + executiveOffset * 0.01
      head.rotation.y = Math.sin(time * headTurnFreq) * 0.15
      
      // Slight head nods
      const headNodFreq = 0.08 + executiveOffset * 0.005
      head.rotation.x = Math.sin(time * headNodFreq + executiveOffset) * 0.05
    }
    
    // Subtle body sway
    const body = model.getObjectByName('body')
    if (body && isActive) {
      const swayFreq = 0.05 + executiveOffset * 0.002
      body.rotation.z = Math.sin(time * swayFreq + executiveOffset) * 0.02
    }
    
    // Arm movements
    const leftArm = model.getObjectByName('leftArm')
    const rightArm = model.getObjectByName('rightArm')
    
    if (leftArm && rightArm) {
      const armFreq = 0.06 + executiveOffset * 0.003
      
      // Subtle arm swaying
      leftArm.rotation.x = Math.sin(time * armFreq + executiveOffset) * 0.08
      rightArm.rotation.x = Math.sin(time * armFreq + executiveOffset + Math.PI) * 0.08
      
      // Occasional gestures for active executives
      if (isActive) {
        const gestureFreq = 0.02 + executiveOffset * 0.001
        leftArm.rotation.y = Math.sin(time * gestureFreq) * 0.1
        rightArm.rotation.y = Math.sin(time * gestureFreq + Math.PI / 2) * 0.1
      }
    }
  }

  /**
   * Adds analysis visualization for executives doing analytical work
   */
  private addAnalysisVisualization(model: THREE.Group, executive: Executive): void {
    // Remove any existing analysis visualization
    this.removeActivityVisualization(model, 'analysis-viz')
    
    // Create analysis visualization with floating data points
    const analysisGroup = new THREE.Group()
    analysisGroup.name = 'analysis-viz'
    
    // Create floating data points
    const pointCount = 8
    for (let i = 0; i < pointCount; i++) {
      const pointGeometry = new THREE.SphereGeometry(0.03, 8, 8)
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: this.ROLE_COLORS[executive.role] || 0x4d7cff,
        transparent: true,
        opacity: 0.8
      })
      
      const point = new THREE.Mesh(pointGeometry, pointMaterial)
      
      // Position points in a spiral around the executive
      const angle = (i / pointCount) * Math.PI * 2
      const radius = 0.8 + Math.sin(angle) * 0.2
      const height = 2.5 + Math.sin(angle * 2) * 0.5
      
      point.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
      
      analysisGroup.add(point)
    }
    
    // Add connecting lines between points
    const lineGeometry = new THREE.BufferGeometry()
    const linePositions: number[] = []
    
    for (let i = 0; i < pointCount; i++) {
      const nextIndex = (i + 1) % pointCount
      const point1 = analysisGroup.children[i].position
      const point2 = analysisGroup.children[nextIndex].position
      
      linePositions.push(point1.x, point1.y, point1.z)
      linePositions.push(point2.x, point2.y, point2.z)
    }
    
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.ROLE_COLORS[executive.role] || 0x4d7cff,
      transparent: true,
      opacity: 0.4
    })
    
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    analysisGroup.add(lines)
    
    // Add to model
    model.add(analysisGroup)
  }

  /**
   * Adds call visualization effects to an executive
   */
  private addCallVisualization(model: THREE.Group, executive: Executive): void {
    // Remove any existing call visualization
    this.removeActivityVisualization(model, 'call-viz')
    
    // Create voice waveform visualization
    const waveformGroup = new THREE.Group()
    waveformGroup.name = 'call-viz'
    
    // Create animated voice waveform lines
    const lineCount = 5
    const lineWidth = 0.05
    const lineSpacing = 0.1
    const lineHeight = 0.4
    
    for (let i = 0; i < lineCount; i++) {
      const height = lineHeight * (0.5 + Math.sin(this.clock.getElapsedTime() * 3 + i) * 0.5)
      
      const geometry = new THREE.BoxGeometry(lineWidth, height, lineWidth)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      })
      
      const line = new THREE.Mesh(geometry, material)
      line.position.x = (i - (lineCount - 1) / 2) * lineSpacing
      line.position.y = height / 2
      
      waveformGroup.add(line)
    }
    
    // Position waveform above executive
    waveformGroup.position.y = 3
    
    // Add to model
    model.add(waveformGroup)
  }

  /**
   * Adds email visualization effects to an executive
   */
  private addEmailVisualization(model: THREE.Group, executive: Executive): void {
    // Remove any existing email visualization
    this.removeActivityVisualization(model, 'email-viz')
    
    // Create email visualization
    const emailGroup = new THREE.Group()
    emailGroup.name = 'email-viz'
    
    // Create envelope shape
    const envelopeGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.1)
    const envelopeMaterial = new THREE.MeshBasicMaterial({
      color: 0x4d7cff,
      transparent: true,
      opacity: 0.8
    })
    
    const envelope = new THREE.Mesh(envelopeGeometry, envelopeMaterial)
    
    // Create text lines
    const lineGeometry1 = new THREE.BoxGeometry(0.4, 0.03, 0.01)
    const lineGeometry2 = new THREE.BoxGeometry(0.3, 0.03, 0.01)
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    })
    
    const line1 = new THREE.Mesh(lineGeometry1, lineMaterial)
    line1.position.set(0, 0.08, 0.06)
    
    const line2 = new THREE.Mesh(lineGeometry2, lineMaterial)
    line2.position.set(0, 0, 0.06)
    
    const line3 = new THREE.Mesh(lineGeometry1, lineMaterial)
    line3.position.set(0, -0.08, 0.06)
    
    envelope.add(line1)
    envelope.add(line2)
    envelope.add(line3)
    
    // Animate envelope
    envelope.rotation.y = Math.sin(this.clock.getElapsedTime() * 2) * 0.2
    envelope.position.y = Math.sin(this.clock.getElapsedTime() * 1.5) * 0.1
    
    emailGroup.add(envelope)
    
    // Position email visualization above executive
    emailGroup.position.y = 3
    
    // Add to model
    model.add(emailGroup)
  }

  /**
   * Adds meeting visualization effects to an executive
   */
  private addMeetingVisualization(model: THREE.Group, executive: Executive): void {
    // Remove any existing meeting visualization
    this.removeActivityVisualization(model, 'meeting-viz')
    
    // Create meeting visualization
    const meetingGroup = new THREE.Group()
    meetingGroup.name = 'meeting-viz'
    
    // Create calendar icon
    const calendarGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1)
    const calendarMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.8
    })
    
    const calendar = new THREE.Mesh(calendarGeometry, calendarMaterial)
    
    // Create calendar details
    const detailGeometry1 = new THREE.BoxGeometry(0.4, 0.08, 0.01)
    const detailGeometry2 = new THREE.BoxGeometry(0.4, 0.08, 0.01)
    const detailMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    })
    
    const detail1 = new THREE.Mesh(detailGeometry1, detailMaterial)
    detail1.position.set(0, 0.1, 0.06)
    
    const detail2 = new THREE.Mesh(detailGeometry2, detailMaterial)
    detail2.position.set(0, -0.1, 0.06)
    
    calendar.add(detail1)
    calendar.add(detail2)
    
    // Animate calendar
    calendar.rotation.y = Math.sin(this.clock.getElapsedTime() * 1.5) * 0.3
    calendar.position.y = Math.sin(this.clock.getElapsedTime() * 2) * 0.1
    
    meetingGroup.add(calendar)
    
    // Position meeting visualization above executive
    meetingGroup.position.y = 3
    
    // Add to model
    model.add(meetingGroup)
  }

  /**
   * Removes all activity visualizations from an executive
   */
  private removeActivityVisualizations(model: THREE.Group, executive: Executive): void {
    this.removeActivityVisualization(model, 'call-viz')
    this.removeActivityVisualization(model, 'email-viz')
    this.removeActivityVisualization(model, 'meeting-viz')
  }

  /**
   * Removes a specific activity visualization from an executive
   */
  private removeActivityVisualization(model: THREE.Group, name: string): void {
    const visualization = model.children.find(child => child.name === name)
    if (visualization) {
      model.remove(visualization)
    }
  }

  /**
   * Positions executives in a semi-circle formation
   */
  public positionExecutivesInSemiCircle(executiveStates: ExecutiveState[]): void {
    const totalExecutives = executiveStates.length
    if (totalExecutives === 0) return
    
    // Calculate semi-circle parameters for optimal viewing
    const radius = 9 // Slightly larger radius for better spacing
    const startAngle = -Math.PI * 0.65 // Start at -117 degrees for wider arc
    const endAngle = Math.PI * 0.65 // End at 117 degrees
    
    // Sort executives by role hierarchy for better positioning
    const sortedStates = [...executiveStates].sort((a, b) => {
      const roleOrder = ['CEO', 'CFO', 'CTO', 'COO', 'CMO', 'CHRO', 'CLO', 'CSO']
      return roleOrder.indexOf(a.executive.role) - roleOrder.indexOf(b.executive.role)
    })
    
    // Position each executive along the semi-circle
    sortedStates.forEach((state, index) => {
      // Calculate angle for this executive
      let angle: number
      
      if (totalExecutives === 1) {
        angle = 0 // Center position for single executive
      } else {
        angle = startAngle + (endAngle - startAngle) * (index / (totalExecutives - 1))
      }
      
      // Add slight randomization to avoid perfect symmetry (more natural)
      const randomOffset = (Math.random() - 0.5) * 0.1
      angle += randomOffset
      
      // Calculate position on semi-circle
      const x = Math.sin(angle) * radius
      const z = -Math.cos(angle) * radius // Negative to place in front of camera
      
      // Add slight height variation based on role importance
      let y = 0
      if (state.executive.role === 'CEO') {
        y = 0.2 // CEO slightly elevated
      } else if (['CFO', 'CTO', 'COO'].includes(state.executive.role)) {
        y = 0.1 // C-level executives slightly elevated
      }
      
      // Update executive avatar position
      state.executive.avatar.position = { x, y, z }
      
      // Update location in state for consistency
      state.location = { x, y, z }
    })
  }

  /**
   * Updates animation mixers
   */
  public update(delta: number): void {
    // Update all animation mixers
    this.mixers.forEach(mixer => {
      mixer.update(delta)
    })
    
    // Update visual effects for all executives
    this.executiveModels.forEach((model, executiveId) => {
      // Find activity visualizations and update them
      model.children.forEach(child => {
        if (child.name === 'call-viz') {
          this.updateCallVisualization(child)
        } else if (child.name === 'email-viz') {
          this.updateEmailVisualization(child)
        } else if (child.name === 'meeting-viz') {
          this.updateMeetingVisualization(child)
        }
      })
    })
  }

  /**
   * Updates call visualization animation
   */
  private updateCallVisualization(visualization: THREE.Object3D): void {
    visualization.children.forEach((line, index) => {
      if (line instanceof THREE.Mesh) {
        // Animate line height for waveform effect
        const height = 0.4 * (0.5 + Math.sin(this.clock.getElapsedTime() * 3 + index) * 0.5)
        line.scale.y = height
        line.position.y = height / 2
      }
    })
  }

  /**
   * Updates email visualization animation
   */
  private updateEmailVisualization(visualization: THREE.Object3D): void {
    if (visualization.children.length > 0) {
      const envelope = visualization.children[0]
      envelope.rotation.y = Math.sin(this.clock.getElapsedTime() * 2) * 0.2
      envelope.position.y = Math.sin(this.clock.getElapsedTime() * 1.5) * 0.1
    }
  }

  /**
   * Updates meeting visualization animation
   */
  private updateMeetingVisualization(visualization: THREE.Object3D): void {
    if (visualization.children.length > 0) {
      const calendar = visualization.children[0]
      calendar.rotation.y = Math.sin(this.clock.getElapsedTime() * 1.5) * 0.3
      calendar.position.y = Math.sin(this.clock.getElapsedTime() * 2) * 0.1
    }
  }

  /**
   * Disposes of all resources
   */
  public dispose(): void {
    // Clear all models and animations
    this.executiveModels.forEach(model => {
      this.scene.remove(model)
      model.traverse(object => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        }
      })
    })
    
    // Clear all maps
    this.executiveModels.clear()
    this.mixers.clear()
    this.animations.clear()
    this.loadingPromises.clear()
  }
}