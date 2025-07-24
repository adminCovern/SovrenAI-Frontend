import * as THREE from 'three'
import { ParticleSystemConfig } from '../types/notifications'

/**
 * Utility class for creating and managing particle effects for holographic notifications
 */
export class ParticleEffectsManager {
  private scene: THREE.Scene
  private clock: THREE.Clock
  private particleSystems: Map<string, THREE.Points> = new Map()
  private particleTexture: THREE.Texture | null = null

  constructor(scene: THREE.Scene, clock: THREE.Clock) {
    this.scene = scene
    this.clock = clock
    this.initializeParticleTexture()
  }

  /**
   * Creates a particle texture for better visual effects
   */
  private initializeParticleTexture(): void {
    // Create a canvas-based particle texture
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    // Create a radial gradient for the particle
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
    
    this.particleTexture = new THREE.CanvasTexture(canvas)
  }

  /**
   * Creates a holographic particle system for notifications
   */
  public createNotificationParticles(
    id: string,
    position: THREE.Vector3,
    config: ParticleSystemConfig
  ): THREE.Points {
    const geometry = new THREE.BufferGeometry()
    
    // Create particle attributes
    const positions = new Float32Array(config.particleCount * 3)
    const velocities = new Float32Array(config.particleCount * 3)
    const lifetimes = new Float32Array(config.particleCount)
    const sizes = new Float32Array(config.particleCount)
    const colors = new Float32Array(config.particleCount * 3)
    
    // Initialize particles
    for (let i = 0; i < config.particleCount; i++) {
      const i3 = i * 3
      
      // Random position within spread
      positions[i3] = position.x + (Math.random() - 0.5) * config.spread
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * config.spread
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * config.spread
      
      // Random velocity based on config
      velocities[i3] = config.velocity.x + (Math.random() - 0.5) * 0.1
      velocities[i3 + 1] = config.velocity.y + Math.random() * 0.1
      velocities[i3 + 2] = config.velocity.z + (Math.random() - 0.5) * 0.1
      
      // Random lifetime
      lifetimes[i] = Math.random() * config.lifetime
      
      // Random size variation
      sizes[i] = config.particleSize * (0.5 + Math.random() * 0.5)
      
      // Color based on config
      const color = new THREE.Color(config.particleColor)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: config.particleSize,
      transparent: true,
      opacity: config.particleOpacity,
      vertexColors: true,
      blending: this.getBlendingMode(config.blending),
      sizeAttenuation: true,
      map: this.particleTexture,
      alphaTest: 0.1
    })
    
    // Create particle system
    const particles = new THREE.Points(geometry, material)
    particles.name = `particles-${id}`
    
    // Store and add to scene
    this.particleSystems.set(id, particles)
    this.scene.add(particles)
    
    return particles
  }

  /**
   * Creates floating holographic particles around executives
   */
  public createExecutiveAura(
    executiveId: string,
    position: THREE.Vector3,
    color: number = 0x4d7cff,
    intensity: number = 1.0
  ): THREE.Points {
    const config: ParticleSystemConfig = {
      particleCount: Math.floor(30 * intensity),
      particleSize: 0.03,
      particleColor: color,
      particleOpacity: 0.4 * intensity,
      emissionRate: 5,
      velocity: { x: 0, y: 0.05, z: 0 },
      spread: 1.5,
      lifetime: 4.0,
      blending: 'additive'
    }
    
    return this.createNotificationParticles(`aura-${executiveId}`, position, config)
  }

  /**
   * Creates holographic data streams between notifications and central display
   */
  public createDataStream(
    fromPosition: THREE.Vector3,
    toPosition: THREE.Vector3,
    color: number = 0x4d7cff,
    intensity: number = 1.0
  ): THREE.Points {
    const streamId = `stream-${Date.now()}`
    const geometry = new THREE.BufferGeometry()
    
    // Calculate stream path with curve
    const direction = new THREE.Vector3().subVectors(toPosition, fromPosition)
    const length = direction.length()
    const particleCount = Math.floor(length * 8 * intensity)
    
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)
    
    const streamColor = new THREE.Color(color)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const progress = i / particleCount
      
      // Create curved path using quadratic bezier
      const midPoint = new THREE.Vector3()
        .copy(fromPosition)
        .lerp(toPosition, 0.5)
        .add(new THREE.Vector3(0, 2, 0)) // Arc upward
      
      const currentPos = new THREE.Vector3()
      currentPos.copy(fromPosition)
        .lerp(midPoint, progress * 2 > 1 ? 2 - progress * 2 : progress * 2)
      
      if (progress > 0.5) {
        currentPos.lerp(toPosition, (progress - 0.5) * 2)
      }
      
      // Add some randomness for organic feel
      currentPos.x += (Math.random() - 0.5) * 0.2
      currentPos.y += (Math.random() - 0.5) * 0.2
      currentPos.z += (Math.random() - 0.5) * 0.2
      
      positions[i3] = currentPos.x
      positions[i3 + 1] = currentPos.y
      positions[i3 + 2] = currentPos.z
      
      // Velocity along the stream
      const streamVelocity = direction.clone().normalize().multiplyScalar(0.1)
      velocities[i3] = streamVelocity.x + (Math.random() - 0.5) * 0.02
      velocities[i3 + 1] = streamVelocity.y + (Math.random() - 0.5) * 0.02
      velocities[i3 + 2] = streamVelocity.z + (Math.random() - 0.5) * 0.02
      
      // Color with intensity variation based on position
      const colorIntensity = 0.3 + (1 - Math.abs(progress - 0.5) * 2) * 0.7
      colors[i3] = streamColor.r * colorIntensity
      colors[i3 + 1] = streamColor.g * colorIntensity
      colors[i3 + 2] = streamColor.b * colorIntensity
      
      // Size variation
      sizes[i] = 0.01 + Math.random() * 0.02
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.02,
      transparent: true,
      opacity: 0.8 * intensity,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: this.particleTexture
    })
    
    const stream = new THREE.Points(geometry, material)
    stream.name = `data-stream-${streamId}`
    
    this.particleSystems.set(streamId, stream)
    this.scene.add(stream)
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.removeParticleSystem(streamId)
    }, 3000)
    
    return stream
  }

  /**
   * Creates holographic interference patterns around notifications
   */
  public createInterferencePattern(
    position: THREE.Vector3,
    radius: number = 1.0,
    color: number = 0x4d7cff,
    intensity: number = 1.0
  ): THREE.Points {
    const patternId = `interference-${Date.now()}`
    const geometry = new THREE.BufferGeometry()
    
    const particleCount = Math.floor(80 * intensity) // Increased particle count for more density
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3) // Added velocities for animation
    
    const patternColor = new THREE.Color(color)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const angle = (i / particleCount) * Math.PI * 2
      const ringRadius = radius * (0.5 + Math.random() * 0.5)
      
      // Create more complex interference wave pattern with multiple frequencies
      const waveOffset = Math.sin(angle * 8) * 0.2 + Math.sin(angle * 12) * 0.1
      const currentRadius = ringRadius + waveOffset
      
      positions[i3] = position.x + Math.cos(angle) * currentRadius
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.3
      positions[i3 + 2] = position.z + Math.sin(angle) * currentRadius
      
      // Add velocities for dynamic movement
      velocities[i3] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02
      
      // Color intensity based on wave pattern with more variation
      const waveIntensity = 0.3 + Math.abs(Math.sin(angle * 8) * Math.cos(angle * 4)) * 0.7
      colors[i3] = patternColor.r * waveIntensity
      colors[i3 + 1] = patternColor.g * waveIntensity
      colors[i3 + 2] = patternColor.b * waveIntensity
      
      // Size variation with more range
      sizes[i] = 0.02 + waveIntensity * 0.04
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.03,
      transparent: true,
      opacity: 0.7 * intensity, // Increased opacity
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: this.particleTexture
    })
    
    const pattern = new THREE.Points(geometry, material)
    pattern.name = `interference-${patternId}`
    
    this.particleSystems.set(patternId, pattern)
    this.scene.add(pattern)
    
    // Auto-remove after longer duration for more impact
    setTimeout(() => {
      this.removeParticleSystem(patternId)
    }, 3000) // Increased from 2000 to 3000ms
    
    return pattern
  }

  /**
   * Creates energy beam particles between executives
   */
  public createEnergyBeam(
    fromPosition: THREE.Vector3,
    toPosition: THREE.Vector3,
    color: number = 0x00ffff,
    intensity: number = 1.0
  ): THREE.Points {
    const beamId = `beam-${Date.now()}`
    const geometry = new THREE.BufferGeometry()
    
    // Calculate beam direction and length
    const direction = new THREE.Vector3().subVectors(toPosition, fromPosition)
    const length = direction.length()
    direction.normalize()
    
    const particleCount = Math.floor(length * 10 * intensity)
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    const beamColor = new THREE.Color(color)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const progress = i / particleCount
      
      // Position along the beam
      const currentPos = new THREE.Vector3()
        .copy(fromPosition)
        .add(direction.clone().multiplyScalar(progress * length))
      
      // Add some randomness
      currentPos.x += (Math.random() - 0.5) * 0.1
      currentPos.y += (Math.random() - 0.5) * 0.1
      currentPos.z += (Math.random() - 0.5) * 0.1
      
      positions[i3] = currentPos.x
      positions[i3 + 1] = currentPos.y
      positions[i3 + 2] = currentPos.z
      
      // Color with intensity variation
      const colorIntensity = 0.5 + Math.random() * 0.5
      colors[i3] = beamColor.r * colorIntensity
      colors[i3 + 1] = beamColor.g * colorIntensity
      colors[i3 + 2] = beamColor.b * colorIntensity
      
      // Size variation
      sizes[i] = 0.02 + Math.random() * 0.03
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    const material = new THREE.PointsMaterial({
      size: 0.03,
      transparent: true,
      opacity: 0.8 * intensity,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: this.particleTexture
    })
    
    const beam = new THREE.Points(geometry, material)
    beam.name = `energy-beam-${beamId}`
    
    this.particleSystems.set(beamId, beam)
    this.scene.add(beam)
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
      this.removeParticleSystem(beamId)
    }, 2000)
    
    return beam
  }

  /**
   * Creates explosion effect for urgent notifications
   */
  public createExplosionEffect(
    position: THREE.Vector3,
    color: number = 0xff4444,
    intensity: number = 1.0
  ): THREE.Points {
    const explosionId = `explosion-${Date.now()}`
    const config: ParticleSystemConfig = {
      particleCount: Math.floor(50 * intensity),
      particleSize: 0.05,
      particleColor: color,
      particleOpacity: 0.8,
      emissionRate: 50,
      velocity: { x: 0, y: 0.2, z: 0 },
      spread: 0.5,
      lifetime: 1.5,
      blending: 'additive'
    }
    
    const explosion = this.createNotificationParticles(explosionId, position, config)
    
    // Auto-remove after effect duration
    setTimeout(() => {
      this.removeParticleSystem(explosionId)
    }, 1500)
    
    return explosion
  }

  /**
   * Updates all particle systems
   */
  public update(delta: number): void {
    this.particleSystems.forEach((particles, id) => {
      this.updateParticleSystem(particles, delta)
    })
  }

  /**
   * Updates a single particle system
   */
  private updateParticleSystem(particles: THREE.Points, delta: number): void {
    const geometry = particles.geometry
    const positions = geometry.attributes.position?.array as Float32Array
    const velocities = geometry.attributes.velocity?.array as Float32Array
    const lifetimes = geometry.attributes.lifetime?.array as Float32Array
    
    if (!positions || !velocities || !lifetimes) return
    
    for (let i = 0; i < positions.length; i += 3) {
      const particleIndex = i / 3
      
      // Update position based on velocity
      positions[i] += velocities[i] * delta
      positions[i + 1] += velocities[i + 1] * delta
      positions[i + 2] += velocities[i + 2] * delta
      
      // Update lifetime
      lifetimes[particleIndex] -= delta
      
      // Reset particle if lifetime expired
      if (lifetimes[particleIndex] <= 0) {
        // Reset to origin with some randomness
        positions[i] = (Math.random() - 0.5) * 0.3
        positions[i + 1] = (Math.random() - 0.5) * 0.3
        positions[i + 2] = (Math.random() - 0.5) * 0.3
        
        // Reset lifetime
        lifetimes[particleIndex] = Math.random() * 2.0 + 1.0
        
        // Randomize velocity slightly
        velocities[i] = (Math.random() - 0.5) * 0.1
        velocities[i + 1] = Math.random() * 0.1 + 0.05
        velocities[i + 2] = (Math.random() - 0.5) * 0.1
      }
      
      // Apply gravity to some particles
      if (Math.random() > 0.8) {
        velocities[i + 1] -= 0.01 * delta
      }
    }
    
    // Mark attributes for update
    geometry.attributes.position.needsUpdate = true
    if (geometry.attributes.velocity) {
      geometry.attributes.velocity.needsUpdate = true
    }
    if (geometry.attributes.lifetime) {
      geometry.attributes.lifetime.needsUpdate = true
    }
  }

  /**
   * Removes a particle system
   */
  public removeParticleSystem(id: string): void {
    const particles = this.particleSystems.get(id)
    if (particles) {
      this.scene.remove(particles)
      
      // Dispose of geometry and material
      particles.geometry.dispose()
      if (particles.material instanceof THREE.Material) {
        particles.material.dispose()
      }
      
      this.particleSystems.delete(id)
    }
  }

  /**
   * Gets the appropriate THREE.js blending mode
   */
  private getBlendingMode(blending: string): THREE.Blending {
    switch (blending) {
      case 'additive':
        return THREE.AdditiveBlending
      case 'multiply':
        return THREE.MultiplyBlending
      default:
        return THREE.NormalBlending
    }
  }

  /**
   * Creates ambient holographic particles for the entire scene
   */
  public createAmbientHolographicParticles(): THREE.Points {
    const config: ParticleSystemConfig = {
      particleCount: 100,
      particleSize: 0.02,
      particleColor: 0x4d7cff,
      particleOpacity: 0.3,
      emissionRate: 10,
      velocity: { x: 0, y: 0.02, z: 0 },
      spread: 15,
      lifetime: 10.0,
      blending: 'additive'
    }
    
    const ambientParticles = this.createNotificationParticles(
      'ambient',
      new THREE.Vector3(0, 5, 0),
      config
    )
    
    return ambientParticles
  }

  /**
   * Disposes of all particle systems and resources
   */
  public dispose(): void {
    // Remove all particle systems
    this.particleSystems.forEach((particles, id) => {
      this.removeParticleSystem(id)
    })
    
    // Dispose of texture
    if (this.particleTexture) {
      this.particleTexture.dispose()
      this.particleTexture = null
    }
    
    this.particleSystems.clear()
  }
}

/**
 * Utility functions for particle effects
 */
export const ParticleEffectUtils = {
  /**
   * Creates a color gradient for particles
   */
  createColorGradient(startColor: number, endColor: number, steps: number): number[] {
    const start = new THREE.Color(startColor)
    const end = new THREE.Color(endColor)
    const colors: number[] = []
    
    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1)
      const color = start.clone().lerp(end, progress)
      colors.push(color.getHex())
    }
    
    return colors
  },

  /**
   * Gets notification color based on priority
   */
  getNotificationParticleColor(priority: string): number {
    switch (priority) {
      case 'urgent': return 0xff4444
      case 'high': return 0xffaa00
      case 'medium': return 0x4d7cff
      case 'low': return 0x00ccff
      default: return 0x88ccff
    }
  },

  /**
   * Gets executive aura color based on role
   */
  getExecutiveAuraColor(role: string): number {
    switch (role) {
      case 'CEO': return 0xffd700 // Gold
      case 'CFO': return 0x00ff00 // Green
      case 'CTO': return 0x0088ff // Blue
      case 'CMO': return 0xff00ff // Magenta
      case 'COO': return 0xff8800 // Orange
      case 'CHRO': return 0x88ff00 // Lime
      case 'CLO': return 0x8800ff // Purple
      case 'CSO': return 0x00ffff // Cyan
      default: return 0x4d7cff // Default blue
    }
  }
}