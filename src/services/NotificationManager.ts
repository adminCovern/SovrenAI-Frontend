import * as THREE from 'three'
import { 
  Notification, 
  HolographicNotification, 
  NotificationVisualConfig, 
  NotificationAnimationState,
  ParticleSystemConfig,
  ActivityStreamItem,
  NotificationManagerConfig,
  NotificationType,
  NotificationPriority,
  AnimationPhase
} from '../types/notifications'
import { ExecutiveState, Vector3, ActivityType, ImpactLevel } from '../types'
import { ParticleEffectsManager, ParticleEffectUtils } from '../utils/particleEffects'

/**
 * Manages holographic notifications and particle effects for the command center
 */
export class NotificationManager {
  private scene: THREE.Scene
  private clock: THREE.Clock
  private config: NotificationManagerConfig
  
  // Notification storage
  private activeNotifications: Map<string, HolographicNotification> = new Map()
  private notificationMeshes: Map<string, THREE.Group> = new Map()
  private particleSystems: Map<string, THREE.Points> = new Map()
  
  // Activity stream
  private activityStream: ActivityStreamItem[] = []
  private centralDisplay: THREE.Group | null = null
  
  // Visual effects
  private holographicMaterials: Map<string, THREE.Material> = new Map()
  private animationMixers: THREE.AnimationMixer[] = []
  private particleEffectsManager: ParticleEffectsManager

  constructor(scene: THREE.Scene, clock: THREE.Clock, config?: Partial<NotificationManagerConfig>) {
    this.scene = scene
    this.clock = clock
    this.config = {
      maxNotificationsPerExecutive: 3,
      defaultNotificationDuration: 8000,
      enableParticleEffects: true,
      enableSoundEffects: false,
      notificationSpacing: 0.8,
      centralDisplayEnabled: true,
      ...config
    }
    
    // Initialize particle effects manager
    this.particleEffectsManager = new ParticleEffectsManager(scene, clock)
    
    this.initializeCentralDisplay()
    
    // Create ambient holographic particles
    if (this.config.enableParticleEffects) {
      this.particleEffectsManager.createAmbientHolographicParticles()
    }
  }

  /**
   * Creates a new notification for an executive
   */
  public createNotification(
    executiveId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    data?: any
  ): string {
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executiveId,
      type,
      title,
      message,
      timestamp: new Date(),
      priority,
      impact: this.calculateImpactFromPriority(priority),
      data,
      duration: this.config.defaultNotificationDuration,
      requiresAction: priority === 'urgent' || type === 'approval_required'
    }
    
    this.addNotification(notification)
    return notification.id
  }

  /**
   * Adds a notification to the system
   */
  public addNotification(notification: Notification): void {
    // Remove oldest notification if at limit for this executive
    this.enforceNotificationLimit(notification.executiveId)
    
    // Create holographic notification
    const holographicNotification = this.createHolographicNotification(notification)
    
    // Store notification
    this.activeNotifications.set(notification.id, holographicNotification)
    
    // Create 3D visualization
    this.createNotificationMesh(holographicNotification)
    
    // Add to activity stream
    this.addToActivityStream(notification)
    
    // Update central display
    this.updateCentralDisplay()
  }

  /**
   * Removes a notification
   */
  public removeNotification(notificationId: string): void {
    const notification = this.activeNotifications.get(notificationId)
    if (!notification) return
    
    // Start disappearing animation
    notification.animationState.currentPhase = 'disappearing'
    notification.animationState.startTime = this.clock.getElapsedTime()
    
    // Remove after animation completes
    setTimeout(() => {
      this.cleanupNotification(notificationId)
    }, 1000)
  }

  /**
   * Updates notification positions based on executive positions
   */
  public updateNotificationPositions(executiveStates: ExecutiveState[]): void {
    const executivePositions = new Map<string, Vector3>()
    
    // Build position map
    executiveStates.forEach(state => {
      executivePositions.set(state.executive.id, state.executive.avatar.position)
    })
    
    // Update notification positions
    this.activeNotifications.forEach((holographicNotification, notificationId) => {
      const executivePosition = executivePositions.get(holographicNotification.notification.executiveId)
      if (executivePosition) {
        this.updateNotificationPosition(notificationId, executivePosition)
      }
    })
  }

  /**
   * Updates all notification animations and effects
   */
  public update(delta: number): void {
    const currentTime = this.clock.getElapsedTime()
    
    // Update notification animations
    this.activeNotifications.forEach((holographicNotification, notificationId) => {
      this.updateNotificationAnimation(holographicNotification, currentTime, delta)
      
      // Check if notification should expire
      if (this.shouldExpireNotification(holographicNotification, currentTime)) {
        this.removeNotification(notificationId)
      }
    })
    
    // Update particle effects manager
    this.particleEffectsManager.update(delta)
    
    // Update central display
    this.updateCentralDisplayAnimation(delta)
    
    // Update animation mixers
    this.animationMixers.forEach(mixer => mixer.update(delta))
  }

  /**
   * Creates a holographic notification object
   */
  private createHolographicNotification(notification: Notification): HolographicNotification {
    const visualConfig = this.createVisualConfig(notification)
    const animationState: NotificationAnimationState = {
      isVisible: true,
      isAnimating: true,
      currentPhase: 'appearing',
      startTime: this.clock.getElapsedTime(),
      duration: notification.duration || this.config.defaultNotificationDuration
    }
    
    const particleSystem = this.config.enableParticleEffects 
      ? this.createParticleSystemConfig(notification)
      : undefined
    
    return {
      notification,
      visualConfig,
      animationState,
      particleSystem
    }
  }

  /**
   * Creates visual configuration based on notification properties
   */
  private createVisualConfig(notification: Notification): NotificationVisualConfig {
    const baseConfig = {
      scale: { x: 1, y: 1, z: 1 },
      opacity: 0.8,
      glowIntensity: 1.0,
      pulseRate: 1.0,
      floatHeight: 0.2,
      rotationSpeed: 0.1
    }
    
    // Customize based on notification type and priority
    switch (notification.type) {
      case 'approval_required':
        return {
          ...baseConfig,
          color: 0xff4444,
          glowIntensity: 1.5,
          pulseRate: 2.0,
          scale: { x: 1.2, y: 1.2, z: 1.2 }
        }
      case 'activity_update':
        return {
          ...baseConfig,
          color: 0x4d7cff,
          glowIntensity: 0.8,
          pulseRate: 0.8
        }
      case 'integration_alert':
        return {
          ...baseConfig,
          color: 0xffaa00,
          glowIntensity: 1.2,
          pulseRate: 1.5
        }
      case 'performance_warning':
        return {
          ...baseConfig,
          color: 0xff6600,
          glowIntensity: 1.3,
          pulseRate: 1.8
        }
      case 'system_message':
        return {
          ...baseConfig,
          color: 0x00ccff,
          glowIntensity: 0.9,
          pulseRate: 0.6
        }
      default:
        return {
          ...baseConfig,
          color: 0x88ccff
        }
    }
  }

  /**
   * Creates particle system configuration
   */
  private createParticleSystemConfig(notification: Notification): ParticleSystemConfig {
    const baseConfig = {
      particleCount: 20,
      particleSize: 0.05,
      particleOpacity: 0.6,
      emissionRate: 5,
      velocity: { x: 0, y: 0.1, z: 0 },
      spread: 0.3,
      lifetime: 2.0,
      blending: 'additive' as const
    }
    
    // Customize based on notification priority
    switch (notification.priority) {
      case 'urgent':
        return {
          ...baseConfig,
          particleCount: 40,
          particleColor: 0xff4444,
          emissionRate: 10,
          velocity: { x: 0, y: 0.2, z: 0 }
        }
      case 'high':
        return {
          ...baseConfig,
          particleCount: 30,
          particleColor: 0xffaa00,
          emissionRate: 8
        }
      case 'medium':
        return {
          ...baseConfig,
          particleColor: 0x4d7cff
        }
      default:
        return {
          ...baseConfig,
          particleCount: 15,
          particleColor: 0x88ccff,
          emissionRate: 3
        }
    }
  }

  /**
   * Creates 3D mesh for notification
   */
  private createNotificationMesh(holographicNotification: HolographicNotification): void {
    const { notification, visualConfig } = holographicNotification
    
    const group = new THREE.Group()
    group.name = `notification-${notification.id}`
    
    // Create main notification panel
    const panelGeometry = new THREE.PlaneGeometry(1.5, 0.8)
    const panelMaterial = new THREE.MeshPhysicalMaterial({
      color: visualConfig.color,
      transparent: true,
      opacity: visualConfig.opacity * 0.3,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.1,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide
    })
    
    const panel = new THREE.Mesh(panelGeometry, panelMaterial)
    group.add(panel)
    
    // Create glow effect
    const glowGeometry = new THREE.PlaneGeometry(2.0, 1.2)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: visualConfig.color,
      transparent: true,
      opacity: visualConfig.opacity * 0.1,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.z = -0.01
    group.add(glow)
    
    // Create border frame
    const frameGeometry = new THREE.RingGeometry(0.9, 1.0, 32)
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: visualConfig.color,
      transparent: true,
      opacity: visualConfig.opacity * 0.8,
      side: THREE.DoubleSide
    })
    
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.z = 0.01
    group.add(frame)
    
    // Create priority indicator
    if (notification.priority === 'urgent') {
      const urgentGeometry = new THREE.RingGeometry(1.1, 1.2, 32)
      const urgentMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      })
      
      const urgentRing = new THREE.Mesh(urgentGeometry, urgentMaterial)
      urgentRing.position.z = 0.02
      group.add(urgentRing)
    }
    
    // Create particle system if enabled
    if (this.config.enableParticleEffects && holographicNotification.particleSystem) {
      const particles = this.particleEffectsManager.createNotificationParticles(
        notification.id,
        new THREE.Vector3(0, 0, 0),
        holographicNotification.particleSystem
      )
      this.particleSystems.set(notification.id, particles)
      
      // Create explosion effect for urgent notifications
      if (notification.priority === 'urgent') {
        this.particleEffectsManager.createExplosionEffect(
          new THREE.Vector3(0, 0, 0),
          ParticleEffectUtils.getNotificationParticleColor(notification.priority),
          1.0
        )
      }
      
      // Create interference pattern for high priority notifications
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        this.particleEffectsManager.createInterferencePattern(
          new THREE.Vector3(0, 0, 0),
          1.2,
          visualConfig.color,
          notification.priority === 'urgent' ? 1.0 : 0.7
        )
      }
    }
    
    // Store materials for animation
    this.holographicMaterials.set(notification.id, panelMaterial)
    this.holographicMaterials.set(`${notification.id}-glow`, glowMaterial)
    this.holographicMaterials.set(`${notification.id}-frame`, frameMaterial)
    
    // Add to scene and store reference
    this.scene.add(group)
    this.notificationMeshes.set(notification.id, group)
    
    // Position notification near executive
    this.positionNotificationNearExecutive(notification.id, notification.executiveId)
  }

  /**
   * Creates particle system for notification
   */
  private createParticleSystem(config: ParticleSystemConfig): THREE.Points {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(config.particleCount * 3)
    const velocities = new Float32Array(config.particleCount * 3)
    const lifetimes = new Float32Array(config.particleCount)
    
    // Initialize particles
    for (let i = 0; i < config.particleCount; i++) {
      const i3 = i * 3
      
      // Random position within spread
      positions[i3] = (Math.random() - 0.5) * config.spread
      positions[i3 + 1] = (Math.random() - 0.5) * config.spread
      positions[i3 + 2] = (Math.random() - 0.5) * config.spread
      
      // Random velocity
      velocities[i3] = config.velocity.x + (Math.random() - 0.5) * 0.1
      velocities[i3 + 1] = config.velocity.y + (Math.random() - 0.5) * 0.1
      velocities[i3 + 2] = config.velocity.z + (Math.random() - 0.5) * 0.1
      
      // Random lifetime
      lifetimes[i] = Math.random() * config.lifetime
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))
    
    const material = new THREE.PointsMaterial({
      color: config.particleColor,
      size: config.particleSize,
      transparent: true,
      opacity: config.particleOpacity,
      blending: config.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
      sizeAttenuation: true
    })
    
    return new THREE.Points(geometry, material)
  }

  /**
   * Positions notification near an executive
   */
  private positionNotificationNearExecutive(notificationId: string, executiveId: string): void {
    // This will be called when executive positions are updated
    // For now, set a default position
    const mesh = this.notificationMeshes.get(notificationId)
    if (mesh) {
      mesh.position.set(0, 3, 0) // Default position above center
    }
  }

  /**
   * Updates notification position based on executive position
   */
  private updateNotificationPosition(notificationId: string, executivePosition: Vector3): void {
    const mesh = this.notificationMeshes.get(notificationId)
    if (!mesh) return
    
    // Get existing notifications for this executive to stack them
    const executiveNotifications = Array.from(this.activeNotifications.values())
      .filter(n => n.notification.executiveId === this.activeNotifications.get(notificationId)?.notification.executiveId)
    
    const notificationIndex = executiveNotifications.findIndex(n => n.notification.id === notificationId)
    const stackOffset = notificationIndex * this.config.notificationSpacing
    
    // Position notification above and to the side of executive
    mesh.position.set(
      executivePosition.x + 1.5,
      executivePosition.y + 2.5 + stackOffset,
      executivePosition.z
    )
    
    // Face the camera
    mesh.lookAt(0, mesh.position.y, 10)
  }

  /**
   * Updates notification animation
   */
  private updateNotificationAnimation(
    holographicNotification: HolographicNotification,
    currentTime: number,
    delta: number
  ): void {
    const { notification, visualConfig, animationState } = holographicNotification
    const mesh = this.notificationMeshes.get(notification.id)
    if (!mesh) return
    
    const elapsedTime = currentTime - animationState.startTime
    
    // Handle animation phases
    switch (animationState.currentPhase) {
      case 'appearing':
        this.animateAppearing(mesh, elapsedTime, visualConfig)
        if (elapsedTime > 0.5) {
          animationState.currentPhase = 'floating'
          animationState.startTime = currentTime
        }
        break
        
      case 'floating':
        this.animateFloating(mesh, currentTime, visualConfig)
        if (elapsedTime > animationState.duration - 1000) {
          animationState.currentPhase = 'pulsing'
        }
        break
        
      case 'pulsing':
        this.animatePulsing(mesh, currentTime, visualConfig)
        break
        
      case 'disappearing':
        this.animateDisappearing(mesh, elapsedTime, visualConfig)
        break
    }
    
    // Update particle system
    const particles = this.particleSystems.get(notification.id)
    if (particles) {
      this.updateParticleSystem(particles, delta)
    }
  }

  /**
   * Animates notification appearing
   */
  private animateAppearing(mesh: THREE.Group, elapsedTime: number, config: NotificationVisualConfig): void {
    const progress = Math.min(elapsedTime / 0.5, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic
    
    mesh.scale.setScalar(easeProgress * config.scale.x)
    
    // Update material opacity
    const material = this.holographicMaterials.get(mesh.name.replace('notification-', ''))
    if (material && 'opacity' in material) {
      material.opacity = config.opacity * easeProgress
    }
  }

  /**
   * Animates notification floating
   */
  private animateFloating(mesh: THREE.Group, currentTime: number, config: NotificationVisualConfig): void {
    // Gentle floating motion
    const floatOffset = Math.sin(currentTime * config.pulseRate) * config.floatHeight
    mesh.position.y += floatOffset * 0.01
    
    // Gentle rotation
    mesh.rotation.y += config.rotationSpeed * 0.01
  }

  /**
   * Animates notification pulsing (when about to expire)
   */
  private animatePulsing(mesh: THREE.Group, currentTime: number, config: NotificationVisualConfig): void {
    const pulseIntensity = Math.sin(currentTime * config.pulseRate * 3) * 0.3 + 0.7
    
    // Update glow material
    const glowMaterial = this.holographicMaterials.get(`${mesh.name.replace('notification-', '')}-glow`)
    if (glowMaterial && 'opacity' in glowMaterial) {
      glowMaterial.opacity = config.opacity * 0.1 * pulseIntensity
    }
  }

  /**
   * Animates notification disappearing
   */
  private animateDisappearing(mesh: THREE.Group, elapsedTime: number, config: NotificationVisualConfig): void {
    const progress = Math.min(elapsedTime / 1.0, 1)
    const fadeProgress = 1 - progress
    
    mesh.scale.setScalar(config.scale.x * (0.5 + fadeProgress * 0.5))
    
    // Fade out all materials
    const materials = [
      this.holographicMaterials.get(mesh.name.replace('notification-', '')),
      this.holographicMaterials.get(`${mesh.name.replace('notification-', '')}-glow`),
      this.holographicMaterials.get(`${mesh.name.replace('notification-', '')}-frame`)
    ]
    
    materials.forEach(material => {
      if (material && 'opacity' in material) {
        material.opacity = config.opacity * fadeProgress
      }
    })
  }

  /**
   * Updates particle system
   */
  private updateParticleSystem(particles: THREE.Points, delta: number): void {
    const positions = particles.geometry.attributes.position.array as Float32Array
    const velocities = particles.geometry.attributes.velocity.array as Float32Array
    const lifetimes = particles.geometry.attributes.lifetime.array as Float32Array
    
    for (let i = 0; i < positions.length; i += 3) {
      const particleIndex = i / 3
      
      // Update position
      positions[i] += velocities[i] * delta
      positions[i + 1] += velocities[i + 1] * delta
      positions[i + 2] += velocities[i + 2] * delta
      
      // Update lifetime
      lifetimes[particleIndex] -= delta
      
      // Reset particle if lifetime expired
      if (lifetimes[particleIndex] <= 0) {
        positions[i] = (Math.random() - 0.5) * 0.3
        positions[i + 1] = (Math.random() - 0.5) * 0.3
        positions[i + 2] = (Math.random() - 0.5) * 0.3
        lifetimes[particleIndex] = Math.random() * 2.0
      }
    }
    
    particles.geometry.attributes.position.needsUpdate = true
    particles.geometry.attributes.lifetime.needsUpdate = true
  }

  /**
   * Updates all particle systems
   */
  private updateParticleSystems(delta: number): void {
    this.particleSystems.forEach(particles => {
      this.updateParticleSystem(particles, delta)
    })
  }

  /**
   * Initializes enhanced central holographic display for unified activity stream
   */
  private initializeCentralDisplay(): void {
    if (!this.config.centralDisplayEnabled) return
    
    this.centralDisplay = new THREE.Group()
    this.centralDisplay.name = 'central-activity-display'
    this.centralDisplay.position.set(0, 4, 0)
    
    // Create main display screen with enhanced materials
    const screenGeometry = new THREE.PlaneGeometry(3.5, 2.2)
    const screenMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.3,
      metalness: 0.3,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.2,
      envMapIntensity: 1.0
    })
    
    const screen = new THREE.Mesh(screenGeometry, screenMaterial)
    this.centralDisplay.add(screen)
    
    // Create secondary background layer for depth
    const backScreenGeometry = new THREE.PlaneGeometry(3.3, 2.0)
    const backScreenMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x002244,
      transparent: true,
      opacity: 0.2,
      metalness: 0.5,
      roughness: 0.2,
      transmission: 0.8
    })
    
    const backScreen = new THREE.Mesh(backScreenGeometry, backScreenMaterial)
    backScreen.position.z = -0.05
    this.centralDisplay.add(backScreen)
    
    // Create outer frame with more segments for smoother look
    const frameGeometry = new THREE.RingGeometry(1.9, 2.0, 64)
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: 0x4d7cff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
    
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    this.centralDisplay.add(frame)
    
    // Create inner rotating ring
    const innerFrameGeometry = new THREE.RingGeometry(1.7, 1.8, 64)
    const innerFrameMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })
    
    const innerFrame = new THREE.Mesh(innerFrameGeometry, innerFrameMaterial)
    this.centralDisplay.add(innerFrame)
    
    // Create enhanced corner indicators for sci-fi look
    const cornerPositions = [[-1.7, -1.1], [1.7, -1.1], [1.7, 1.1], [-1.7, 1.1]]
    cornerPositions.forEach(pos => {
      const cornerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.01)
      const cornerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      })
      
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial)
      corner.position.set(pos[0], pos[1], 0.01)
      this.centralDisplay?.add(corner)
    })
    
    // Create data flow indicators with more complex geometry
    const dataFlowGeometry = new THREE.RingGeometry(2.1, 2.15, 64)
    const dataFlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4d7cff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
    
    const dataFlow = new THREE.Mesh(dataFlowGeometry, dataFlowMaterial)
    this.centralDisplay.add(dataFlow)
    
    // Add rotating data flow segments for more dynamic look
    const segmentGeometry = new THREE.RingGeometry(2.1, 2.15, 64, 4, 0, Math.PI * 0.5)
    const segmentMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    
    const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
    segment.rotation.z = Math.PI / 4
    segment.position.z = -0.02
    this.centralDisplay.add(segment)
    
    // Add holographic grid pattern
    const gridGeometry = new THREE.PlaneGeometry(3.0, 1.8, 15, 9)
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x4d7cff,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    })
    
    const grid = new THREE.Mesh(gridGeometry, gridMaterial)
    grid.position.z = 0.03
    this.centralDisplay.add(grid)
    
    // Create enhanced holographic particles around the display
    if (this.config.enableParticleEffects) {
      // Main particle system
      const displayParticles = this.particleEffectsManager.createNotificationParticles(
        'central-display',
        new THREE.Vector3(0, 0, 0),
        {
          particleCount: 100, // Increased from 40
          particleSize: 0.02,
          particleColor: 0x4d7cff,
          particleOpacity: 0.5, // Increased from 0.4
          emissionRate: 10, // Increased from 8
          velocity: { x: 0, y: 0.03, z: 0 },
          spread: 2.5,
          lifetime: 6.0,
          blending: 'additive'
        }
      )
      
      // Position particles around the display
      displayParticles.position.copy(this.centralDisplay.position)
      this.particleSystems.set('central-display', displayParticles)
      
      // Add secondary particle system with different color
      const accentParticles = this.particleEffectsManager.createNotificationParticles(
        'central-display-accent',
        new THREE.Vector3(0, 0, 0),
        {
          particleCount: 40,
          particleSize: 0.015,
          particleColor: 0x00ffff,
          particleOpacity: 0.6,
          emissionRate: 5,
          velocity: { x: 0, y: 0.02, z: 0 },
          spread: 3.0,
          lifetime: 8.0,
          blending: 'additive'
        }
      )
      
      accentParticles.position.copy(this.centralDisplay.position)
      this.particleSystems.set('central-display-accent', accentParticles)
      
      // Create data streams connecting to the central display
      this.createInitialDataStreams()
    }
    
    this.scene.add(this.centralDisplay)
  }
  
  /**
   * Creates initial data streams connecting to the central display
   */
  private createInitialDataStreams(): void {
    // Create a few initial data streams for visual effect
    // These will be replaced by real data streams as notifications are created
    
    const centerPos = new THREE.Vector3(0, 4, 0)
    
    // Create streams from different directions
    const streamPositions = [
      new THREE.Vector3(-5, 2, -3),
      new THREE.Vector3(5, 1, -2),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(-4, 1, 2)
    ]
    
    // Create streams with different colors
    const streamColors = [0x4d7cff, 0x00ffff, 0xff00ff, 0x88ccff]
    
    // Create initial streams
    streamPositions.forEach((pos, index) => {
      setTimeout(() => {
        this.particleEffectsManager.createDataStream(
          pos,
          centerPos,
          streamColors[index % streamColors.length],
          0.7 + (Math.random() * 0.3)
        )
      }, index * 500) // Stagger creation for visual effect
    })
  }

  /**
   * Updates central display animation with enhanced effects
   */
  private updateCentralDisplayAnimation(delta: number): void {
    if (!this.centralDisplay) return
    
    const time = this.clock.getElapsedTime()
    
    // Enhanced rotation with slight wobble
    this.centralDisplay.rotation.y += delta * 0.1
    this.centralDisplay.rotation.x = Math.sin(time * 0.3) * 0.03
    
    // Enhanced floating with multi-frequency oscillation
    this.centralDisplay.position.y = 4 + Math.sin(time * 0.5) * 0.1 + Math.sin(time * 0.2) * 0.05
    
    // Animate individual elements for more dynamic appearance
    this.centralDisplay.children.forEach((child, index) => {
      // Animate rings
      if (child instanceof THREE.Mesh && 
          child.geometry instanceof THREE.RingGeometry && 
          child.material instanceof THREE.MeshBasicMaterial) {
        
        // Pulse opacity
        child.material.opacity = child.material.opacity * 0.95 + 
          (0.3 + Math.sin(time * 0.8 + index) * 0.2) * 0.05
        
        // Rotate inner rings
        if (child.geometry.parameters.innerRadius === 1.7) {
          child.rotation.z += delta * 0.2
        }
      }
      
      // Animate grid pattern
      if (child instanceof THREE.Mesh && 
          child.geometry instanceof THREE.PlaneGeometry && 
          child.material instanceof THREE.MeshBasicMaterial &&
          child.material.wireframe) {
        
        // Pulse opacity
        child.material.opacity = 0.1 + Math.sin(time * 0.7) * 0.05
        
        // Gentle rotation
        child.rotation.z += delta * 0.05
      }
      
      // Animate corner indicators
      if (child instanceof THREE.Mesh && 
          child.geometry instanceof THREE.BoxGeometry) {
        
        // Pulse scale
        const pulseScale = 1 + Math.sin(time * 1.5 + index) * 0.2
        child.scale.set(pulseScale, pulseScale, 1)
      }
      
      // Animate segment
      if (child instanceof THREE.Mesh && 
          child.geometry instanceof THREE.RingGeometry && 
          child.geometry.parameters.thetaLength < Math.PI * 2) {
        
        // Rotate segment
        child.rotation.z += delta * 0.3
      }
    })
    
    // Occasionally create new data streams to the central display
    if (Math.random() < 0.01 && this.config.enableParticleEffects) { // 1% chance per update
      this.createRandomDataStreamToCentralDisplay()
    }
  }
  
  /**
   * Creates a random data stream to the central display
   */
  private createRandomDataStreamToCentralDisplay(): void {
    // Get a random position around the scene
    const angle = Math.random() * Math.PI * 2
    const distance = 8 + Math.random() * 5
    const height = Math.random() * 4
    
    const startPos = new THREE.Vector3(
      Math.cos(angle) * distance,
      height,
      Math.sin(angle) * distance
    )
    
    const centerPos = new THREE.Vector3(0, 4, 0)
    
    // Random color from a set of holographic colors
    const colors = [0x4d7cff, 0x00ffff, 0xff00ff, 0x88ccff, 0x00ff88]
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    // Create data stream
    this.particleEffectsManager.createDataStream(
      startPos,
      centerPos,
      color,
      0.7 + (Math.random() * 0.3)
    )
  }

  /**
   * Adds notification to activity stream
   */
  private addToActivityStream(notification: Notification): void {
    const streamItem: ActivityStreamItem = {
      id: `stream-${notification.id}`,
      executiveId: notification.executiveId,
      executiveRole: 'CEO', // This should be looked up from executive data
      activity: this.mapNotificationTypeToActivity(notification.type),
      description: notification.message,
      timestamp: notification.timestamp,
      impact: notification.impact,
      status: 'active',
      metadata: notification.data
    }
    
    this.activityStream.unshift(streamItem)
    
    // Keep only recent items
    if (this.activityStream.length > 50) {
      this.activityStream = this.activityStream.slice(0, 50)
    }
  }

  /**
   * Updates central display with latest activity
   */
  private updateCentralDisplay(): void {
    // This would update the central display with latest activity stream items
    // For now, we'll just ensure it's visible and animated
  }

  /**
   * Helper methods
   */
  private calculateImpactFromPriority(priority: NotificationPriority): ImpactLevel {
    switch (priority) {
      case 'urgent': return 'major'
      case 'high': return 'significant'
      case 'medium': return 'moderate'
      default: return 'minimal'
    }
  }

  private mapNotificationTypeToActivity(type: NotificationType): ActivityType {
    switch (type) {
      case 'approval_required': return 'approval'
      case 'activity_update': return 'analysis'
      case 'executive_communication': return 'email'
      default: return 'idle'
    }
  }

  private enforceNotificationLimit(executiveId: string): void {
    const executiveNotifications = Array.from(this.activeNotifications.entries())
      .filter(([_, notification]) => notification.notification.executiveId === executiveId)
    
    if (executiveNotifications.length >= this.config.maxNotificationsPerExecutive) {
      // Remove oldest notification
      const oldestNotification = executiveNotifications
        .sort((a, b) => a[1].notification.timestamp.getTime() - b[1].notification.timestamp.getTime())[0]
      
      if (oldestNotification) {
        this.removeNotification(oldestNotification[0])
      }
    }
  }

  private shouldExpireNotification(holographicNotification: HolographicNotification, currentTime: number): boolean {
    const { notification, animationState } = holographicNotification
    const age = currentTime * 1000 - notification.timestamp.getTime()
    return age > (notification.duration || this.config.defaultNotificationDuration)
  }

  private cleanupNotification(notificationId: string): void {
    // Remove from active notifications
    this.activeNotifications.delete(notificationId)
    
    // Remove mesh from scene
    const mesh = this.notificationMeshes.get(notificationId)
    if (mesh) {
      this.scene.remove(mesh)
      this.notificationMeshes.delete(notificationId)
    }
    
    // Remove particle system
    this.particleEffectsManager.removeParticleSystem(notificationId)
    this.particleSystems.delete(notificationId)
    
    // Clean up materials
    this.holographicMaterials.delete(notificationId)
    this.holographicMaterials.delete(`${notificationId}-glow`)
    this.holographicMaterials.delete(`${notificationId}-frame`)
  }

  /**
   * Public API methods
   */
  public getActiveNotifications(): Notification[] {
    return Array.from(this.activeNotifications.values()).map(h => h.notification)
  }

  public getActivityStream(): ActivityStreamItem[] {
    return [...this.activityStream]
  }

  public clearNotificationsForExecutive(executiveId: string): void {
    const toRemove = Array.from(this.activeNotifications.entries())
      .filter(([_, notification]) => notification.notification.executiveId === executiveId)
      .map(([id, _]) => id)
    
    toRemove.forEach(id => this.removeNotification(id))
  }

  public getParticleEffectsManager(): ParticleEffectsManager {
    return this.particleEffectsManager
  }

  public dispose(): void {
    // Clean up all notifications
    Array.from(this.activeNotifications.keys()).forEach(id => {
      this.cleanupNotification(id)
    })
    
    // Remove central display
    if (this.centralDisplay) {
      this.scene.remove(this.centralDisplay)
      this.centralDisplay = null
    }
    
    // Dispose particle effects manager
    this.particleEffectsManager.dispose()
    
    // Clear arrays and maps
    this.activeNotifications.clear()
    this.notificationMeshes.clear()
    this.particleSystems.clear()
    this.holographicMaterials.clear()
    this.activityStream = []
    this.animationMixers = []
  }
}