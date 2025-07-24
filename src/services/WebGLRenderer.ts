import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { QualitySettings } from './PerformanceManager'

export class WebGLRenderer {
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private animationId: number | null = null
  private composer: EffectComposer | null = null
  private bloomPass: UnrealBloomPass | null = null
  private renderPass: RenderPass | null = null
  private outputPass: OutputPass | null = null
  private clock: THREE.Clock = new THREE.Clock()
  private qualitySettings: QualitySettings = {
    particleCount: 'high',
    shadowQuality: 'high',
    antialiasing: true,
    postProcessing: true
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeRenderer()
    }
  }

  private initializeRenderer(): void {
    // Create WebGL renderer with high performance settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      precision: 'highp',
      logarithmicDepthBuffer: true
    })

    // Configure renderer for optimal performance
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Enable GPU memory optimization
    this.renderer.info.autoReset = false
    
    // Set default size
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  public initializeScene(): THREE.Scene {
    this.scene = new THREE.Scene()
    return this.scene
  }

  public initializeCamera(fov: number = 75, near: number = 0.1, far: number = 1000): THREE.PerspectiveCamera {
    this.camera = new THREE.PerspectiveCamera(
      fov, 
      window.innerWidth / window.innerHeight, 
      near, 
      far
    )
    return this.camera
  }

  public initializePostProcessing(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.renderer) return
    
    // Create effect composer for post-processing effects
    this.composer = new EffectComposer(this.renderer)
    
    // Add render pass
    this.renderPass = new RenderPass(scene, camera)
    this.composer.addPass(this.renderPass)
    
    // Add enhanced bloom pass for holographic glow effects
    // Higher strength and lower threshold for more pronounced glow
    const bloomParams = {
      strength: 1.0,    // Increased for more intense glow
      radius: 0.75,     // Increased for wider glow spread
      threshold: 0.15   // Lowered to make more elements glow
    }
    
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloomParams.strength,
      bloomParams.radius,
      bloomParams.threshold
    )
    
    // Configure bloom pass for better performance
    // Note: kernelSize is not available in this version of UnrealBloomPass
    
    this.composer.addPass(this.bloomPass)
    
    // Add output pass with gamma correction for better color reproduction
    this.outputPass = new OutputPass()
    this.outputPass.enabled = true
    
    this.composer.addPass(this.outputPass)
  }

  public setupLighting(scene: THREE.Scene): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)
    
    // Directional light for shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 10, 7.5)
    directionalLight.castShadow = true
    
    // Configure shadow properties for high quality
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.bias = -0.0001
    
    scene.add(directionalLight)
    
    // Add point lights for holographic effect
    const pointLight1 = new THREE.PointLight(0x4d7cff, 2, 20)
    pointLight1.position.set(0, 5, 0)
    scene.add(pointLight1)
    
    const pointLight2 = new THREE.PointLight(0x00ffff, 1.5, 15)
    pointLight2.position.set(-5, 3, -5)
    scene.add(pointLight2)
    
    const pointLight3 = new THREE.PointLight(0xff00ff, 1.5, 15)
    pointLight3.position.set(5, 3, -5)
    scene.add(pointLight3)
  }

  public getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer
  }

  public getComposer(): EffectComposer | null {
    return this.composer
  }

  public setSize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height)
    }
    
    if (this.composer) {
      this.composer.setSize(width, height)
    }
    
    if (this.camera && this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.qualitySettings.postProcessing && this.composer) {
      this.composer.render()
    } else if (this.renderer) {
      this.renderer.render(scene, camera)
    }
  }

  public startRenderLoop(scene: THREE.Scene, camera: THREE.Camera, updateFn?: (delta: number) => void): void {
    this.clock.start()
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      
      const delta = this.clock.getDelta()
      
      // Call update function if provided
      if (updateFn) {
        updateFn(delta)
      }
      
      // Render the scene
      this.render(scene, camera)
    }
    
    animate()
  }

  public stopRenderLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  public dispose(): void {
    this.stopRenderLoop()
    
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    
    if (this.composer) {
      this.composer.renderTarget1.dispose()
      this.composer.renderTarget2.dispose()
    }
    
    this.scene = null
    this.camera = null
    this.composer = null
    this.bloomPass = null
    this.renderPass = null
    this.outputPass = null
  }

  // Apply quality settings with enhanced holographic effects
  public applyQualitySettings(settings: QualitySettings): void {
    this.qualitySettings = settings
    
    if (this.renderer) {
      // Apply antialiasing
      if (settings.antialiasing !== this.renderer.getContext().getContextAttributes()?.antialias) {
        // Antialiasing requires renderer recreation
        const currentRenderer = this.renderer
        this.initializeRenderer()
        if (this.renderer && this.scene && this.camera) {
          this.renderer.setSize(currentRenderer.domElement.width, currentRenderer.domElement.height)
          this.initializePostProcessing(this.scene, this.camera)
        }
      }
      
      // Apply shadow quality
      if (this.renderer.shadowMap.enabled) {
        switch (settings.shadowQuality) {
          case 'high':
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
            this.renderer.shadowMap.autoUpdate = true
            break
          case 'medium':
            this.renderer.shadowMap.type = THREE.PCFShadowMap
            this.renderer.shadowMap.autoUpdate = true
            break
          case 'low':
            this.renderer.shadowMap.type = THREE.BasicShadowMap
            this.renderer.shadowMap.autoUpdate = false // Only update when needed
            break
        }
      }
      
      // Apply tone mapping based on quality
      switch (settings.shadowQuality) {
        case 'high':
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping
          this.renderer.toneMappingExposure = 1.2
          break
        case 'medium':
          this.renderer.toneMapping = THREE.CineonToneMapping
          this.renderer.toneMappingExposure = 1.1
          break
        case 'low':
          this.renderer.toneMapping = THREE.ReinhardToneMapping
          this.renderer.toneMappingExposure = 1.0
          break
      }
      
      // Set pixel ratio based on quality
      switch (settings.shadowQuality) {
        case 'high':
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          break
        case 'medium':
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
          break
        case 'low':
          this.renderer.setPixelRatio(1)
          break
      }
    }
    
    // Apply bloom settings for holographic effects
    if (this.bloomPass) {
      switch (settings.particleCount) {
        case 'high':
          this.bloomPass.strength = 1.0
          this.bloomPass.radius = 0.75
          this.bloomPass.threshold = 0.15
          break
        case 'medium':
          this.bloomPass.strength = 0.7
          this.bloomPass.radius = 0.6
          this.bloomPass.threshold = 0.2
          break
        case 'low':
          this.bloomPass.strength = 0.5
          this.bloomPass.radius = 0.4
          this.bloomPass.threshold = 0.25
          break
      }
    }
    
    // Enable/disable post-processing based on settings
    if (this.composer && this.renderer) {
      if (!settings.postProcessing) {
        // If post-processing is disabled, make sure we're using the regular renderer
        this.render = (scene, camera) => {
          this.renderer?.render(scene, camera)
        }
      } else {
        // If post-processing is enabled, use the composer
        this.render = (scene, camera) => {
          this.composer?.render()
        }
      }
    }
  }

  // GPU memory management
  public optimizeMemory(): void {
    if (this.renderer) {
      // Force garbage collection of GPU resources
      this.renderer.info.reset()
      
      // Clear unused textures and geometries
      this.renderer.renderLists.dispose()
      
      // Run THREE.js internal cache optimization
      THREE.Cache.clear()
    }
  }

  // Performance monitoring
  public getPerformanceInfo(): {
    drawCalls: number
    triangles: number
    points: number
    lines: number
    memory: {
      geometries: number
      textures: number
    }
  } {
    if (!this.renderer) {
      return {
        drawCalls: 0,
        triangles: 0,
        points: 0,
        lines: 0,
        memory: { geometries: 0, textures: 0 }
      }
    }

    return {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      points: this.renderer.info.render.points,
      lines: this.renderer.info.render.lines,
      memory: {
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures
      }
    }
  }
}