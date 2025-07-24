import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { WebGLRenderer } from './WebGLRenderer'
import { PerformanceManager } from './PerformanceManager'
import { ExecutiveAvatarManager } from './ExecutiveAvatarManager'
import { NotificationManager } from './NotificationManager'
import { ExecutiveState } from '../types'

export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private webGLRenderer: WebGLRenderer
  private performanceManager: PerformanceManager
  private executiveAvatarManager: ExecutiveAvatarManager
  private notificationManager: NotificationManager
  private clock: THREE.Clock = new THREE.Clock()
  private isRunning: boolean = false
  private controls: OrbitControls | null = null
  private holographicLights: THREE.Light[] = []
  private holographicEffects: THREE.Object3D[] = []

  constructor(webGLRenderer: WebGLRenderer, performanceManager: PerformanceManager) {
    this.webGLRenderer = webGLRenderer
    this.performanceManager = performanceManager
    this.scene = new THREE.Scene()
    
    // Create camera with cinematic perspective (60° FOV for more realistic view)
    this.camera = new THREE.PerspectiveCamera(
      60, // Field of view - more cinematic and less distortion
      window.innerWidth / window.innerHeight, 
      0.1, // Near clipping plane
      100 // Far clipping plane - increased for better depth perception
    )
    
    // Initialize executive avatar manager
    this.executiveAvatarManager = new ExecutiveAvatarManager(this.scene, this.clock)
    
    // Initialize notification manager
    this.notificationManager = new NotificationManager(this.scene, this.clock, {
      maxNotificationsPerExecutive: 3,
      defaultNotificationDuration: 8000,
      enableParticleEffects: true,
      enableSoundEffects: false,
      notificationSpacing: 0.8,
      centralDisplayEnabled: true
    })
    
    // Initialize scene
    this.initializeScene()
  }

  private initializeScene(): void {
    // Set scene background and fog for depth perception
    this.scene.background = new THREE.Color('#050520') // Deep space blue
    this.scene.fog = new THREE.Fog('#070730', 15, 60) // Increased fog distance for better depth
    
    // Set camera position for optimal viewing angle
    this.camera.position.set(0, 7, 18) // Positioned higher and further back for better overview
    this.camera.lookAt(0, 2, 0) // Looking at center point slightly above floor
    
    // Setup camera controls
    this.setupCameraControls()
    
    // Setup advanced lighting
    this.setupAdvancedLighting()
    
    // Create command bridge floor with enhanced materials
    this.createCommandBridgeFloor()
    
    // Create center holographic display with improved effects
    this.createCenterHolographicDisplay()
    
    // Add holographic ambient effects
    this.createHolographicAmbience()
  }

  private setupCameraControls(): void {
    // Only create controls if we have access to the DOM
    if (typeof window !== 'undefined' && this.webGLRenderer.getRenderer()) {
      const renderer = this.webGLRenderer.getRenderer()
      if (renderer) {
        this.controls = new OrbitControls(this.camera, renderer.domElement)
        
        // Configure controls for smooth cinematic experience
        this.controls.enableDamping = true // Adds inertia to controls
        this.controls.dampingFactor = 0.05 // Smooth damping
        
        // Limit zoom range for better user experience
        this.controls.minDistance = 8 // Can't zoom in too close
        this.controls.maxDistance = 25 // Can't zoom out too far
        
        // Limit rotation to prevent disorientation
        this.controls.minPolarAngle = Math.PI / 6 // Can't go below 30 degrees
        this.controls.maxPolarAngle = Math.PI / 2 // Can't go above 90 degrees (horizon)
        
        // Disable pan for more controlled experience
        this.controls.enablePan = false
        
        // Set target to center of command bridge
        this.controls.target.set(0, 2, 0)
        
        // Update controls
        this.controls.update()
      }
    }
  }

  private setupAdvancedLighting(): void {
    // Create a more sophisticated lighting setup for holographic effects
    
    // Ambient light for base illumination - subtle blue tint
    const ambientLight = new THREE.AmbientLight(0x4466aa, 0.5)
    this.scene.add(ambientLight)
    
    // Main directional light (key light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(5, 10, 7.5)
    directionalLight.castShadow = true
    
    // Configure shadow properties for high quality
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.bias = -0.0001
    
    // Set up shadow camera frustum to cover the scene
    const shadowSize = 15
    directionalLight.shadow.camera.left = -shadowSize
    directionalLight.shadow.camera.right = shadowSize
    directionalLight.shadow.camera.top = shadowSize
    directionalLight.shadow.camera.bottom = -shadowSize
    
    this.scene.add(directionalLight)
    
    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.5)
    fillLight.position.set(-5, 8, -7.5)
    this.scene.add(fillLight)
    
    // Add holographic effect lights with animation capabilities
    
    // Central blue holographic light
    const centerLight = new THREE.PointLight(0x4d7cff, 2, 20)
    centerLight.position.set(0, 5, 0)
    this.scene.add(centerLight)
    this.holographicLights.push(centerLight)
    
    // Cyan accent light
    const cyanLight = new THREE.PointLight(0x00ffff, 1.5, 15)
    cyanLight.position.set(-5, 3, -5)
    this.scene.add(cyanLight)
    this.holographicLights.push(cyanLight)
    
    // Magenta accent light
    const magentaLight = new THREE.PointLight(0xff00ff, 1.5, 15)
    magentaLight.position.set(5, 3, -5)
    this.scene.add(magentaLight)
    this.holographicLights.push(magentaLight)
    
    // Add subtle rim lighting
    const rimLight1 = new THREE.SpotLight(0x0088ff, 1, 30, Math.PI / 4, 0.5, 1)
    rimLight1.position.set(-10, 2, 0)
    rimLight1.target.position.set(0, 2, 0)
    this.scene.add(rimLight1)
    this.scene.add(rimLight1.target)
    
    const rimLight2 = new THREE.SpotLight(0x8800ff, 1, 30, Math.PI / 4, 0.5, 1)
    rimLight2.position.set(10, 2, 0)
    rimLight2.target.position.set(0, 2, 0)
    this.scene.add(rimLight2)
    this.scene.add(rimLight2.target)
  }

  private createCommandBridgeFloor(): void {
    // Create enhanced floor with reflective properties
    
    // Main floor circle
    const floorGeometry = new THREE.CircleGeometry(12, 128) // Increased segments for smoother edge
    const floorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a2a,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 0.8,
      clearcoat: 0.5, // Add clearcoat for more realistic reflection
      clearcoatRoughness: 0.1
    })
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.1
    floor.receiveShadow = true
    
    this.scene.add(floor)
    
    // Add outer ring with different material
    const outerRingGeometry = new THREE.RingGeometry(12, 14, 128)
    const outerRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0066aa,
      metalness: 1.0,
      roughness: 0.2,
      emissive: 0x0033aa,
      emissiveIntensity: 0.5
    })
    
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial)
    outerRing.rotation.x = -Math.PI / 2
    outerRing.position.y = -0.09
    outerRing.receiveShadow = true
    
    this.scene.add(outerRing)
    
    // Add grid lines for holographic effect with animation capability
    const gridHelper = new THREE.GridHelper(24, 24, 0x0088ff, 0x0044aa)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)
    this.holographicEffects.push(gridHelper)
    
    // Add concentric rings for additional holographic effect
    for (let i = 1; i <= 3; i++) {
      const ringGeometry = new THREE.RingGeometry(i * 3, i * 3 + 0.05, 128)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x4d7cff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.02
      
      this.scene.add(ring)
      this.holographicEffects.push(ring)
    }
  }

  private createCenterHolographicDisplay(): void {
    // Create enhanced center holographic display with layered effects
    
    // Main holographic sphere
    const sphereGeometry = new THREE.SphereGeometry(1.8, 64, 64)
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4d7cff,
      transparent: true,
      opacity: 0.15,
      metalness: 0.5,
      roughness: 0.1,
      transmission: 0.95,
      thickness: 0.5,
      envMapIntensity: 1.0
    })
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.y = 2.5
    this.scene.add(sphere)
    this.holographicEffects.push(sphere)
    
    // Inner sphere with different properties
    const innerSphereGeometry = new THREE.SphereGeometry(1.4, 48, 48)
    const innerSphereMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.1,
      metalness: 0.8,
      roughness: 0.2,
      transmission: 0.9,
      thickness: 0.2,
      envMapIntensity: 0.8
    })
    
    const innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial)
    innerSphere.position.y = 2.5
    this.scene.add(innerSphere)
    this.holographicEffects.push(innerSphere)
    
    // Add holographic rings around the sphere
    const ringGeometry = new THREE.TorusGeometry(2.2, 0.04, 16, 100)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6
    })
    
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial)
    ring1.position.y = 2.5
    ring1.rotation.x = Math.PI / 2
    this.scene.add(ring1)
    this.holographicEffects.push(ring1)
    
    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial.clone())
    ring2.position.y = 2.5
    ring2.rotation.x = Math.PI / 4
    this.scene.add(ring2)
    this.holographicEffects.push(ring2)
    
    const ring3 = new THREE.Mesh(ringGeometry, ringMaterial.clone())
    ring3.position.y = 2.5
    ring3.rotation.x = -Math.PI / 4
    this.scene.add(ring3)
    this.holographicEffects.push(ring3)
  }

  private createHolographicAmbience(): void {
    // Add floating particles for holographic ambience
    const particleCount = 200
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleSizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      // Position particles in a dome shape above the command bridge
      const radius = 10 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI / 2 // Half sphere
      
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      particlePositions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) // Keep above floor
      particlePositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
      
      // Randomize particle sizes
      particleSizes[i] = Math.random() * 0.1 + 0.05
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1))
    
    // Create particle material with custom shader for better glow effect
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x4d7cff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
    
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    this.scene.add(particles)
    this.holographicEffects.push(particles)
  }

  public updateExecutives(executiveStates: ExecutiveState[]): void {
    // Use the ExecutiveAvatarManager to handle all avatar-related operations
    this.executiveAvatarManager.updateExecutives(executiveStates)
    
    // Update notification positions based on executive positions
    this.notificationManager.updateNotificationPositions(executiveStates)
    
    // Generate demo notifications for active executives
    this.generateDemoNotifications(executiveStates)
  }

  private updateHolographicEffects(delta: number): void {
    // Animate holographic lights
    this.holographicLights.forEach((light, index) => {
      if (light instanceof THREE.PointLight) {
        // Pulse intensity
        light.intensity = 1.5 + Math.sin(this.clock.getElapsedTime() * 0.5 + index) * 0.5
        
        // Subtle position movement
        light.position.y = light.position.y + Math.sin(this.clock.getElapsedTime() * 0.3 + index * 2) * 0.01
      }
    })
    
    // Animate holographic effects
    this.holographicEffects.forEach((effect, index) => {
      // Rotate rings
      if (effect instanceof THREE.Mesh && effect.geometry instanceof THREE.TorusGeometry) {
        effect.rotation.z += delta * 0.2
        
        // Pulse opacity
        if (effect.material instanceof THREE.MeshBasicMaterial) {
          effect.material.opacity = 0.4 + Math.sin(this.clock.getElapsedTime() * 0.8 + index) * 0.2
        }
      }
      
      // Pulse central sphere
      if (effect instanceof THREE.Mesh && effect.geometry instanceof THREE.SphereGeometry) {
        // Subtle scale pulsing
        const scale = 1 + Math.sin(this.clock.getElapsedTime() * 0.4) * 0.05
        effect.scale.set(scale, scale, scale)
        
        // Rotate slowly
        effect.rotation.y += delta * 0.05
        effect.rotation.z += delta * 0.02
      }
      
      // Animate particles
      if (effect instanceof THREE.Points) {
        const positions = effect.geometry.attributes.position.array as Float32Array
        
        for (let i = 0; i < positions.length; i += 3) {
          // Subtle vertical movement
          positions[i + 1] += Math.sin(this.clock.getElapsedTime() * 0.5 + positions[i] * 0.1) * 0.01
          
          // Keep particles within bounds
          if (positions[i + 1] > 20) positions[i + 1] = 5
          if (positions[i + 1] < 0) positions[i + 1] = 15
        }
        
        effect.geometry.attributes.position.needsUpdate = true
      }
    })
    
    // Update executive avatars
    this.executiveAvatarManager.update(delta)
    
    // Update notification system
    this.notificationManager.update(delta)
    
    // Update camera controls if available
    if (this.controls) {
      this.controls.update()
    }
  }

  public start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.clock.start()
    
    // Start render loop with holographic animations
    this.webGLRenderer.startRenderLoop(this.scene, this.camera, (delta) => {
      // Update holographic effects
      this.updateHolographicEffects(delta)
    })
  }

  public stop(): void {
    if (!this.isRunning) return
    
    this.isRunning = false
    this.webGLRenderer.stopRenderLoop()
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.webGLRenderer.setSize(width, height)
    
    // Update composer size if using post-processing
    if (this.webGLRenderer.getComposer()) {
      this.webGLRenderer.getComposer()?.setSize(width, height)
    }
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getControls(): OrbitControls | null {
    return this.controls
  }

  public getNotificationManager(): NotificationManager {
    return this.notificationManager
  }

  /**
   * Generates demo notifications for active executives
   */
  private generateDemoNotifications(executiveStates: ExecutiveState[]): void {
    // Only generate notifications occasionally and for active executives
    if (Math.random() > 0.02) return // 2% chance per update
    
    const activeExecutives = executiveStates.filter(state => state.isActive)
    if (activeExecutives.length === 0) return
    
    const randomExecutive = activeExecutives[Math.floor(Math.random() * activeExecutives.length)]
    const { executive } = randomExecutive
    
    // Generate different types of notifications based on executive role and activity
    const notificationTypes = this.getNotificationTypesForExecutive(executive.role, executive.currentActivity)
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
    
    const notification = this.createNotificationForType(randomType, executive)
    
    this.notificationManager.createNotification(
      executive.id,
      notification.type,
      notification.title,
      notification.message,
      notification.priority,
      notification.data
    )
  }

  /**
   * Gets appropriate notification types for an executive based on role and activity
   */
  private getNotificationTypesForExecutive(role: string, activity: string) {
    const baseTypes = ['activity_update', 'system_message']
    
    switch (role) {
      case 'CEO':
        return [...baseTypes, 'approval_required', 'executive_communication']
      case 'CFO':
        return [...baseTypes, 'approval_required', 'performance_warning']
      case 'CTO':
        return [...baseTypes, 'integration_alert', 'performance_warning']
      case 'CMO':
        return [...baseTypes, 'activity_update', 'executive_communication']
      default:
        return baseTypes
    }
  }

  /**
   * Creates notification content based on type and executive
   */
  private createNotificationForType(type: string, executive: any) {
    const notifications = {
      'activity_update': {
        type: 'activity_update' as const,
        title: `${executive.name} Activity`,
        message: `Currently ${executive.currentActivity}`,
        priority: 'medium' as const,
        data: { activity: executive.currentActivity }
      },
      'approval_required': {
        type: 'approval_required' as const,
        title: 'Approval Required',
        message: `${executive.name} needs approval for high-value decision`,
        priority: 'high' as const,
        data: { value: Math.floor(Math.random() * 50000) + 10000 }
      },
      'integration_alert': {
        type: 'integration_alert' as const,
        title: 'Integration Alert',
        message: `${executive.name} detected system integration issue`,
        priority: 'high' as const,
        data: { system: 'CRM' }
      },
      'performance_warning': {
        type: 'performance_warning' as const,
        title: 'Performance Alert',
        message: `${executive.name} monitoring system performance`,
        priority: 'medium' as const,
        data: { metric: 'latency' }
      },
      'system_message': {
        type: 'system_message' as const,
        title: 'System Update',
        message: `${executive.name} received system notification`,
        priority: 'low' as const,
        data: {}
      },
      'executive_communication': {
        type: 'executive_communication' as const,
        title: 'Executive Message',
        message: `${executive.name} sent important communication`,
        priority: 'medium' as const,
        data: { recipient: 'Board' }
      }
    }
    
    return notifications[type as keyof typeof notifications] || notifications['activity_update']
  }

  public dispose(): void {
    // Dispose of all resources
    this.stop()
    
    // Dispose of controls
    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }
    
    // Dispose of executive avatar manager
    this.executiveAvatarManager.dispose()
    
    // Dispose of notification manager
    this.notificationManager.dispose()
    
    // Dispose of all geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      }
    })
    
    // Clear arrays and maps
    this.holographicLights = []
    this.holographicEffects = []
    
    // Clear scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0])
    }
  }
}