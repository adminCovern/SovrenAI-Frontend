export class PerformanceManager {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 0
  private targetFPS = 120
  private performanceCallbacks: Array<(metrics: PerformanceMetrics) => void> = []

  constructor(targetFPS = 120) {
    this.targetFPS = targetFPS
    this.startMonitoring()
  }

  private startMonitoring(): void {
    const monitor = () => {
      const currentTime = performance.now()
      this.frameCount++

      // Calculate FPS every second
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
        this.frameCount = 0
        this.lastTime = currentTime

        // Notify callbacks with performance metrics
        const metrics = this.getPerformanceMetrics()
        this.performanceCallbacks.forEach(callback => callback(metrics))
      }

      requestAnimationFrame(monitor)
    }
    monitor()
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    const memory = (performance as any).memory || {}
    
    return {
      fps: this.fps,
      targetFPS: this.targetFPS,
      isPerformant: this.fps >= this.targetFPS * 0.9, // 90% of target
      memory: {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        limit: memory.jsHeapSizeLimit || 0
      },
      timestamp: Date.now()
    }
  }

  public onPerformanceUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    this.performanceCallbacks.push(callback)
  }

  public removePerformanceCallback(callback: (metrics: PerformanceMetrics) => void): void {
    const index = this.performanceCallbacks.indexOf(callback)
    if (index > -1) {
      this.performanceCallbacks.splice(index, 1)
    }
  }

  // Adaptive quality management
  public getRecommendedQuality(): QualitySettings {
    const metrics = this.getPerformanceMetrics()
    
    if (metrics.fps >= this.targetFPS * 0.95) {
      return {
        particleCount: 'high',
        shadowQuality: 'high',
        antialiasing: true,
        postProcessing: true
      }
    } else if (metrics.fps >= this.targetFPS * 0.8) {
      return {
        particleCount: 'medium',
        shadowQuality: 'medium',
        antialiasing: true,
        postProcessing: false
      }
    } else {
      return {
        particleCount: 'low',
        shadowQuality: 'low',
        antialiasing: false,
        postProcessing: false
      }
    }
  }

  // Memory optimization
  public shouldOptimizeMemory(): boolean {
    const metrics = this.getPerformanceMetrics()
    const memoryUsageRatio = metrics.memory.used / metrics.memory.limit
    return memoryUsageRatio > 0.8 // Optimize if using more than 80% of available memory
  }
}

export interface PerformanceMetrics {
  fps: number
  targetFPS: number
  isPerformant: boolean
  memory: {
    used: number
    total: number
    limit: number
  }
  timestamp: number
}

export interface QualitySettings {
  particleCount: 'low' | 'medium' | 'high'
  shadowQuality: 'low' | 'medium' | 'high'
  antialiasing: boolean
  postProcessing: boolean
}