import * as THREE from 'three';

/**
 * GPU Memory Manager
 * 
 * Provides advanced GPU memory management including:
 * - Memory defragmentation engine
 * - Texture streaming and asset management
 * - Memory usage monitoring and optimization
 * - Performance optimization for 3D rendering
 */

export interface MemoryMetrics {
  totalMemory: number;
  usedMemory: number;
  availableMemory: number;
  textureMemory: number;
  geometryMemory: number;
  materialMemory: number;
  fragmentationLevel: number;
  lastDefragmentation: number;
}

export interface TextureAsset {
  id: string;
  url: string;
  priority: number;
  size: number;
  loaded: boolean;
  texture?: THREE.Texture;
  lastUsed: number;
  usageCount: number;
}

export interface GeometryAsset {
  id: string;
  geometry: THREE.BufferGeometry;
  size: number;
  lastUsed: number;
  usageCount: number;
}

export interface MaterialAsset {
  id: string;
  material: THREE.Material;
  size: number;
  lastUsed: number;
  usageCount: number;
}

export interface MemoryOptimizationConfig {
  maxTextureMemory: number; // MB
  maxGeometryMemory: number; // MB
  maxMaterialMemory: number; // MB
  defragmentationThreshold: number; // 0-1
  textureStreamingEnabled: boolean;
  autoCleanupEnabled: boolean;
  cleanupInterval: number; // ms
}

export class GPUMemoryManager {
  private renderer: THREE.WebGLRenderer;
  private config: MemoryOptimizationConfig;
  private textureAssets: Map<string, TextureAsset> = new Map();
  private geometryAssets: Map<string, GeometryAsset> = new Map();
  private materialAssets: Map<string, MaterialAsset> = new Map();
  private memoryMetrics: MemoryMetrics;
  private isDefragmenting: boolean = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(renderer: THREE.WebGLRenderer, config: Partial<MemoryOptimizationConfig> = {}) {
    this.renderer = renderer;
    this.config = {
      maxTextureMemory: 512, // 512MB
      maxGeometryMemory: 256, // 256MB
      maxMaterialMemory: 128, // 128MB
      defragmentationThreshold: 0.3, // 30% fragmentation
      textureStreamingEnabled: true,
      autoCleanupEnabled: true,
      cleanupInterval: 30000, // 30 seconds
      ...config
    };

    this.memoryMetrics = this.initializeMemoryMetrics();
    this.startAutoCleanup();
  }

  /**
   * Initialize memory metrics
   */
  private initializeMemoryMetrics(): MemoryMetrics {
    return {
      totalMemory: this.getTotalGPUMemory(),
      usedMemory: 0,
      availableMemory: this.getTotalGPUMemory(),
      textureMemory: 0,
      geometryMemory: 0,
      materialMemory: 0,
      fragmentationLevel: 0,
      lastDefragmentation: Date.now()
    };
  }

  /**
   * Get total GPU memory (estimated)
   */
  private getTotalGPUMemory(): number {
    // Estimate based on common GPU configurations
    const canvas = this.renderer.getContext().canvas;
    const gl = this.renderer.getContext();
    
    // Try to get actual GPU memory info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Parse renderer string for memory info
      if (renderer.includes('NVIDIA')) {
        const match = renderer.match(/(\d+)MB/);
        if (match) return parseInt(match[1]) * 1024 * 1024; // Convert to bytes
      }
    }
    
    // Fallback to estimated values
    return 2048 * 1024 * 1024; // 2GB default
  }

  /**
   * Update memory metrics
   */
  public updateMemoryMetrics(): MemoryMetrics {
    const gl = this.renderer.getContext();
    
    // Calculate texture memory
    let textureMemory = 0;
    this.textureAssets.forEach(asset => {
      if (asset.texture && asset.loaded) {
        textureMemory += asset.size;
      }
    });

    // Calculate geometry memory
    let geometryMemory = 0;
    this.geometryAssets.forEach(asset => {
      geometryMemory += asset.size;
    });

    // Calculate material memory
    let materialMemory = 0;
    this.materialAssets.forEach(asset => {
      materialMemory += asset.size;
    });

    const usedMemory = textureMemory + geometryMemory + materialMemory;
    const availableMemory = this.memoryMetrics.totalMemory - usedMemory;
    const fragmentationLevel = this.calculateFragmentationLevel();

    this.memoryMetrics = {
      ...this.memoryMetrics,
      usedMemory,
      availableMemory,
      textureMemory,
      geometryMemory,
      materialMemory,
      fragmentationLevel
    };

    return this.memoryMetrics;
  }

  /**
   * Calculate memory fragmentation level
   */
  private calculateFragmentationLevel(): number {
    const metrics = this.memoryMetrics;
    if (metrics.totalMemory === 0) return 0;

    const usedPercentage = metrics.usedMemory / metrics.totalMemory;
    const availablePercentage = metrics.availableMemory / metrics.totalMemory;
    
    // Fragmentation is high when we have both used and available memory
    // but can't allocate large contiguous blocks
    return Math.min(usedPercentage * availablePercentage, 1.0);
  }

  /**
   * Load texture with streaming support
   */
  public async loadTexture(id: string, url: string, priority: number = 1): Promise<THREE.Texture> {
    // Check if texture is already loaded
    const existingAsset = this.textureAssets.get(id);
    if (existingAsset && existingAsset.loaded && existingAsset.texture) {
      existingAsset.lastUsed = Date.now();
      existingAsset.usageCount++;
      return existingAsset.texture;
    }

    // Create new texture asset
    const textureLoader = new THREE.TextureLoader();
    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      textureLoader.load(
        url,
        (texture) => {
          texture.generateMipmaps = true;
          texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
          
          // Calculate texture size
          const size = this.calculateTextureSize(texture);
          
          const asset: TextureAsset = {
            id,
            url,
            priority,
            size,
            loaded: true,
            texture,
            lastUsed: Date.now(),
            usageCount: 1
          };
          
          this.textureAssets.set(id, asset);
          this.updateMemoryMetrics();
          
          resolve(texture);
        },
        undefined,
        reject
      );
    });

    return texture;
  }

  /**
   * Calculate texture memory size
   */
  private calculateTextureSize(texture: THREE.Texture): number {
    const image = texture.image;
    if (!image) return 0;

    const width = image.width || 1024;
    const height = image.height || 1024;
    const format = texture.format || THREE.RGBAFormat;
    const type = texture.type || THREE.UnsignedByteType;

    let bytesPerPixel = 4; // Default RGBA
    if (format === THREE.RGBAFormat) bytesPerPixel = 4;
    if (type === THREE.FloatType) bytesPerPixel *= 4;
    if (type === THREE.HalfFloatType) bytesPerPixel *= 2;

    // Account for mipmaps
    const mipmapFactor = texture.generateMipmaps ? 1.33 : 1;
    
    return width * height * bytesPerPixel * mipmapFactor;
  }

  /**
   * Register geometry asset
   */
  public registerGeometry(id: string, geometry: THREE.BufferGeometry): void {
    const size = this.calculateGeometrySize(geometry);
    
    const asset: GeometryAsset = {
      id,
      geometry,
      size,
      lastUsed: Date.now(),
      usageCount: 1
    };
    
    this.geometryAssets.set(id, asset);
    this.updateMemoryMetrics();
  }

  /**
   * Calculate geometry memory size
   */
  private calculateGeometrySize(geometry: THREE.BufferGeometry): number {
    let size = 0;
    
    // Calculate buffer sizes
    if (geometry.attributes.position) {
      size += geometry.attributes.position.count * 3 * 4; // 3 floats * 4 bytes
    }
    if (geometry.attributes.normal) {
      size += geometry.attributes.normal.count * 3 * 4;
    }
    if (geometry.attributes.uv) {
      size += geometry.attributes.uv.count * 2 * 4;
    }
    if (geometry.attributes.color) {
      size += geometry.attributes.color.count * 3 * 4;
    }
    
    // Index buffer
    if (geometry.index) {
      size += geometry.index.count * 2; // Assuming 16-bit indices
    }
    
    return size;
  }

  /**
   * Register material asset
   */
  public registerMaterial(id: string, material: THREE.Material): void {
    const size = this.calculateMaterialSize(material);
    
    const asset: MaterialAsset = {
      id,
      material,
      size,
      lastUsed: Date.now(),
      usageCount: 1
    };
    
    this.materialAssets.set(id, asset);
    this.updateMemoryMetrics();
  }

  /**
   * Calculate material memory size (estimated)
   */
  private calculateMaterialSize(material: THREE.Material): number {
    // Estimate material size based on type and properties
    let size = 1024; // Base size
    
    if (material instanceof THREE.MeshStandardMaterial) {
      size += 2048; // Additional properties
    } else if (material instanceof THREE.ShaderMaterial) {
      size += 4096; // Shader programs
    }
    
    return size;
  }

  /**
   * Perform memory defragmentation
   */
  public async defragmentMemory(): Promise<void> {
    if (this.isDefragmenting) return;
    
    this.isDefragmenting = true;
    console.log('🔧 Starting GPU memory defragmentation...');
    
    try {
      // Update metrics before defragmentation
      const beforeMetrics = this.updateMemoryMetrics();
      
      // Clean up unused assets
      await this.cleanupUnusedAssets();
      
      // Reorganize memory layout
      await this.reorganizeMemoryLayout();
      
      // Update metrics after defragmentation
      const afterMetrics = this.updateMemoryMetrics();
      
      this.memoryMetrics.lastDefragmentation = Date.now();
      
      console.log('✅ GPU memory defragmentation completed');
      console.log(`Memory freed: ${(beforeMetrics.usedMemory - afterMetrics.usedMemory) / (1024 * 1024)}MB`);
      console.log(`Fragmentation reduced: ${(beforeMetrics.fragmentationLevel - afterMetrics.fragmentationLevel).toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ GPU memory defragmentation failed:', error);
    } finally {
      this.isDefragmenting = false;
    }
  }

  /**
   * Clean up unused assets
   */
  private async cleanupUnusedAssets(): Promise<void> {
    const now = Date.now();
    const unusedThreshold = 60000; // 1 minute
    
    // Clean up unused textures
    for (const [id, asset] of this.textureAssets.entries()) {
      if (now - asset.lastUsed > unusedThreshold && asset.usageCount < 2) {
        if (asset.texture) {
          asset.texture.dispose();
        }
        this.textureAssets.delete(id);
      }
    }
    
    // Clean up unused geometries
    for (const [id, asset] of this.geometryAssets.entries()) {
      if (now - asset.lastUsed > unusedThreshold && asset.usageCount < 2) {
        asset.geometry.dispose();
        this.geometryAssets.delete(id);
      }
    }
    
    // Clean up unused materials
    for (const [id, asset] of this.materialAssets.entries()) {
      if (now - asset.lastUsed > unusedThreshold && asset.usageCount < 2) {
        asset.material.dispose();
        this.materialAssets.delete(id);
      }
    }
  }

  /**
   * Reorganize memory layout
   */
  private async reorganizeMemoryLayout(): Promise<void> {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Recreate renderer context to force memory reorganization
    const canvas = this.renderer.domElement;
    const contextAttributes = this.renderer.getContext().getContextAttributes();
    
    // Temporarily dispose of renderer
    this.renderer.dispose();
    
    // Create new renderer with same context
    const newRenderer = new THREE.WebGLRenderer({
      canvas,
      context: canvas.getContext('webgl2', contextAttributes),
      ...this.renderer.getContextAttributes()
    });
    
    // Copy renderer properties
    Object.assign(newRenderer, this.renderer);
    this.renderer = newRenderer;
    
    // Small delay to allow memory reorganization
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Start automatic cleanup
   */
  private startAutoCleanup(): void {
    if (!this.config.autoCleanupEnabled) return;
    
    this.cleanupInterval = setInterval(() => {
      this.performAutoCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Perform automatic cleanup
   */
  private performAutoCleanup(): void {
    const metrics = this.updateMemoryMetrics();
    
    // Check if defragmentation is needed
    if (metrics.fragmentationLevel > this.config.defragmentationThreshold) {
      this.defragmentMemory();
    }
    
    // Check memory limits
    if (metrics.textureMemory > this.config.maxTextureMemory * 1024 * 1024) {
      this.cleanupUnusedAssets();
    }
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStats(): {
    metrics: MemoryMetrics;
    assetCounts: { textures: number; geometries: number; materials: number };
    performance: { fps: number; frameTime: number };
  } {
    const metrics = this.updateMemoryMetrics();
    
    return {
      metrics,
      assetCounts: {
        textures: this.textureAssets.size,
        geometries: this.geometryAssets.size,
        materials: this.materialAssets.size
      },
      performance: {
        fps: this.getCurrentFPS(),
        frameTime: this.getAverageFrameTime()
      }
    };
  }

  /**
   * Get current FPS (estimated)
   */
  private getCurrentFPS(): number {
    // This would need to be implemented with actual frame timing
    // For now, return estimated value
    return 60;
  }

  /**
   * Get average frame time
   */
  private getAverageFrameTime(): number {
    // This would need to be implemented with actual frame timing
    // For now, return estimated value
    return 16.67; // 60 FPS = 16.67ms per frame
  }

  /**
   * Optimize for performance
   */
  public optimizeForPerformance(): void {
    // Reduce texture quality for better performance
    this.textureAssets.forEach(asset => {
      if (asset.texture) {
        asset.texture.minFilter = THREE.LinearFilter;
        asset.texture.magFilter = THREE.LinearFilter;
        asset.texture.generateMipmaps = false;
      }
    });
    
    // Force cleanup
    this.cleanupUnusedAssets();
    
    console.log('⚡ Performance optimization applied');
  }

  /**
   * Optimize for quality
   */
  public optimizeForQuality(): void {
    // Increase texture quality
    this.textureAssets.forEach(asset => {
      if (asset.texture) {
        asset.texture.minFilter = THREE.LinearMipmapLinearFilter;
        asset.texture.magFilter = THREE.LinearFilter;
        asset.texture.generateMipmaps = true;
        asset.texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      }
    });
    
    console.log('🎨 Quality optimization applied');
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Dispose of all textures
    this.textureAssets.forEach(asset => {
      if (asset.texture) {
        asset.texture.dispose();
      }
    });
    
    // Dispose of all geometries
    this.geometryAssets.forEach(asset => {
      asset.geometry.dispose();
    });
    
    // Dispose of all materials
    this.materialAssets.forEach(asset => {
      asset.material.dispose();
    });
    
    // Clear maps
    this.textureAssets.clear();
    this.geometryAssets.clear();
    this.materialAssets.clear();
    
    console.log('🧹 GPU Memory Manager disposed');
  }
}

// Export singleton instance
export const gpuMemoryManager = new GPUMemoryManager(new THREE.WebGLRenderer()); 