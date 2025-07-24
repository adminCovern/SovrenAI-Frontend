/**
 * Edge Deployment System
 * 
 * Provides global CDN configuration, regional failover, and latency optimization:
 * - Global CDN configuration with multiple regions
 * - Regional failover with automatic switching
 * - Latency optimization and performance monitoring
 * - Geographic load balancing
 */

export interface CDNRegion {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  endpoint: string;
  status: 'active' | 'degraded' | 'down';
  latency: number; // ms
  capacity: number; // requests/second
  currentLoad: number; // percentage
}

export interface DeploymentConfig {
  regions: CDNRegion[];
  primaryRegion: string;
  failoverEnabled: boolean;
  latencyThreshold: number; // ms
  loadThreshold: number; // percentage
  healthCheckInterval: number; // ms
  autoFailover: boolean;
}

export interface PerformanceMetrics {
  latency: number;
  throughput: number;
  errorRate: number;
  availability: number;
  regionId: string;
  timestamp: number;
}

export interface FailoverEvent {
  timestamp: number;
  fromRegion: string;
  toRegion: string;
  reason: 'latency' | 'capacity' | 'error' | 'manual';
  duration: number; // ms
}

export class EdgeDeploymentSystem {
  private config: DeploymentConfig;
  private regions: Map<string, CDNRegion> = new Map();
  private currentRegion: string;
  private performanceHistory: PerformanceMetrics[] = [];
  private failoverHistory: FailoverEvent[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isFailoverInProgress: boolean = false;

  constructor(config: Partial<DeploymentConfig> = {}) {
    this.config = {
      regions: [],
      primaryRegion: 'us-east-1',
      failoverEnabled: true,
      latencyThreshold: 200, // 200ms
      loadThreshold: 80, // 80%
      healthCheckInterval: 10000, // 10 seconds
      autoFailover: true,
      ...config
    };

    this.initializeRegions();
    this.currentRegion = this.config.primaryRegion;
    this.startHealthChecks();
  }

  /**
   * Initialize CDN regions
   */
  private initializeRegions(): void {
    const defaultRegions: CDNRegion[] = [
      {
        id: 'us-east-1',
        name: 'US East (N. Virginia)',
        location: 'Virginia, USA',
        coordinates: [38.9072, -77.0369],
        endpoint: 'https://cdn-us-east-1.sovren.ai',
        status: 'active',
        latency: 50,
        capacity: 10000,
        currentLoad: 30
      },
      {
        id: 'us-west-2',
        name: 'US West (Oregon)',
        location: 'Oregon, USA',
        coordinates: [44.0582, -121.3153],
        endpoint: 'https://cdn-us-west-2.sovren.ai',
        status: 'active',
        latency: 80,
        capacity: 8000,
        currentLoad: 25
      },
      {
        id: 'eu-west-1',
        name: 'Europe (Ireland)',
        location: 'Dublin, Ireland',
        coordinates: [53.3498, -6.2603],
        endpoint: 'https://cdn-eu-west-1.sovren.ai',
        status: 'active',
        latency: 120,
        capacity: 6000,
        currentLoad: 40
      },
      {
        id: 'ap-southeast-1',
        name: 'Asia Pacific (Singapore)',
        location: 'Singapore',
        coordinates: [1.3521, 103.8198],
        endpoint: 'https://cdn-ap-southeast-1.sovren.ai',
        status: 'active',
        latency: 180,
        capacity: 5000,
        currentLoad: 35
      },
      {
        id: 'sa-east-1',
        name: 'South America (São Paulo)',
        location: 'São Paulo, Brazil',
        coordinates: [-23.5505, -46.6333],
        endpoint: 'https://cdn-sa-east-1.sovren.ai',
        status: 'active',
        latency: 150,
        capacity: 4000,
        currentLoad: 20
      }
    ];

    defaultRegions.forEach(region => {
      this.regions.set(region.id, region);
    });

    console.log(`🌍 Initialized ${this.regions.size} CDN regions`);
  }

  /**
   * Start health checks for all regions
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks for all regions
   */
  private async performHealthChecks(): Promise<void> {
    const healthChecks = Array.from(this.regions.values()).map(region =>
      this.checkRegionHealth(region)
    );

    await Promise.all(healthChecks);

    // Check if failover is needed
    if (this.config.autoFailover && !this.isFailoverInProgress) {
      await this.checkFailoverNeeded();
    }
  }

  /**
   * Check health of a specific region
   */
  private async checkRegionHealth(region: CDNRegion): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Simulate health check
      const response = await this.simulateHealthCheck(region.endpoint);
      
      const latency = Date.now() - startTime;
      const errorRate = response.success ? 0 : 1;
      
      // Update region metrics
      region.latency = latency;
      region.currentLoad = Math.min(100, region.currentLoad + Math.random() * 10 - 5);
      
      // Update status based on metrics
      if (latency > this.config.latencyThreshold * 2) {
        region.status = 'down';
      } else if (latency > this.config.latencyThreshold || region.currentLoad > this.config.loadThreshold) {
        region.status = 'degraded';
      } else {
        region.status = 'active';
      }

      // Record performance metrics
      this.recordPerformanceMetrics({
        latency,
        throughput: region.capacity * (1 - region.currentLoad / 100),
        errorRate,
        availability: region.status === 'active' ? 1 : 0,
        regionId: region.id,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error(`❌ Health check failed for ${region.id}:`, error);
      region.status = 'down';
    }
  }

  /**
   * Simulate health check request
   */
  private async simulateHealthCheck(endpoint: string): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      // Simulate network request with random success/failure
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95% success rate
        resolve({ success });
      }, Math.random() * 100 + 50); // 50-150ms latency
    });
  }

  /**
   * Check if failover is needed
   */
  private async checkFailoverNeeded(): Promise<void> {
    const currentRegion = this.regions.get(this.currentRegion);
    if (!currentRegion) return;

    // Check if current region is degraded or down
    if (currentRegion.status === 'down' || 
        (currentRegion.status === 'degraded' && currentRegion.latency > this.config.latencyThreshold)) {
      
      // Find best alternative region
      const bestRegion = this.findBestRegion();
      if (bestRegion && bestRegion.id !== this.currentRegion) {
        await this.performFailover(bestRegion.id, 'latency');
      }
    }
  }

  /**
   * Find the best available region
   */
  private findBestRegion(): CDNRegion | null {
    const availableRegions = Array.from(this.regions.values())
      .filter(region => region.status === 'active')
      .sort((a, b) => {
        // Sort by latency, then by load
        if (a.latency !== b.latency) {
          return a.latency - b.latency;
        }
        return a.currentLoad - b.currentLoad;
      });

    return availableRegions[0] || null;
  }

  /**
   * Perform failover to a different region
   */
  public async performFailover(targetRegionId: string, reason: 'latency' | 'capacity' | 'error' | 'manual'): Promise<boolean> {
    if (this.isFailoverInProgress) {
      console.warn('⚠️ Failover already in progress');
      return false;
    }

    const targetRegion = this.regions.get(targetRegionId);
    if (!targetRegion || targetRegion.status !== 'active') {
      console.error(`❌ Cannot failover to ${targetRegionId}: region not available`);
      return false;
    }

    this.isFailoverInProgress = true;
    const startTime = Date.now();

    try {
      console.log(`🔄 Performing failover from ${this.currentRegion} to ${targetRegionId} (${reason})`);

      // Simulate failover process
      await this.simulateFailoverProcess();

      // Update current region
      const previousRegion = this.currentRegion;
      this.currentRegion = targetRegionId;

      // Record failover event
      this.failoverHistory.push({
        timestamp: Date.now(),
        fromRegion: previousRegion,
        toRegion: targetRegionId,
        reason,
        duration: Date.now() - startTime
      });

      console.log(`✅ Failover to ${targetRegionId} completed successfully`);
      return true;

    } catch (error) {
      console.error(`❌ Failover failed:`, error);
      return false;
    } finally {
      this.isFailoverInProgress = false;
    }
  }

  /**
   * Simulate failover process
   */
  private async simulateFailoverProcess(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate DNS propagation and connection switching
      setTimeout(resolve, 2000 + Math.random() * 1000); // 2-3 seconds
    });
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }
  }

  /**
   * Get current region information
   */
  public getCurrentRegion(): CDNRegion | null {
    return this.regions.get(this.currentRegion) || null;
  }

  /**
   * Get all regions with status
   */
  public getAllRegions(): CDNRegion[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get performance metrics for a region
   */
  public getRegionPerformance(regionId: string, timeRange: number = 3600000): PerformanceMetrics[] {
    const cutoff = Date.now() - timeRange;
    return this.performanceHistory
      .filter(metric => metric.regionId === regionId && metric.timestamp > cutoff)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get average latency for a region
   */
  public getAverageLatency(regionId: string, timeRange: number = 3600000): number {
    const metrics = this.getRegionPerformance(regionId, timeRange);
    if (metrics.length === 0) return 0;

    const totalLatency = metrics.reduce((sum, metric) => sum + metric.latency, 0);
    return totalLatency / metrics.length;
  }

  /**
   * Get availability percentage for a region
   */
  public getAvailability(regionId: string, timeRange: number = 3600000): number {
    const metrics = this.getRegionPerformance(regionId, timeRange);
    if (metrics.length === 0) return 0;

    const availableMetrics = metrics.filter(metric => metric.availability > 0);
    return (availableMetrics.length / metrics.length) * 100;
  }

  /**
   * Get failover history
   */
  public getFailoverHistory(): FailoverEvent[] {
    return [...this.failoverHistory];
  }

  /**
   * Optimize latency for a specific location
   */
  public optimizeLatency(userLocation: [number, number]): CDNRegion | null {
    const regions = Array.from(this.regions.values())
      .filter(region => region.status === 'active')
      .map(region => ({
        ...region,
        distance: this.calculateDistance(userLocation, region.coordinates)
      }))
      .sort((a, b) => a.distance - b.distance);

    return regions[0] || null;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get deployment statistics
   */
  public getDeploymentStats(): {
    totalRegions: number;
    activeRegions: number;
    degradedRegions: number;
    downRegions: number;
    averageLatency: number;
    totalFailovers: number;
    currentRegion: string;
  } {
    const regions = Array.from(this.regions.values());
    const activeRegions = regions.filter(r => r.status === 'active');
    const degradedRegions = regions.filter(r => r.status === 'degraded');
    const downRegions = regions.filter(r => r.status === 'down');
    
    const averageLatency = regions.reduce((sum, r) => sum + r.latency, 0) / regions.length;
    
    return {
      totalRegions: regions.length,
      activeRegions: activeRegions.length,
      degradedRegions: degradedRegions.length,
      downRegions: downRegions.length,
      averageLatency,
      totalFailovers: this.failoverHistory.length,
      currentRegion: this.currentRegion
    };
  }

  /**
   * Test latency to all regions
   */
  public async testAllLatencies(): Promise<Map<string, number>> {
    const latencies = new Map<string, number>();
    
    const tests = Array.from(this.regions.values()).map(async (region) => {
      const startTime = Date.now();
      try {
        await this.simulateHealthCheck(region.endpoint);
        const latency = Date.now() - startTime;
        latencies.set(region.id, latency);
      } catch (error) {
        latencies.set(region.id, -1); // Failed
      }
    });

    await Promise.all(tests);
    return latencies;
  }

  /**
   * Get optimal region for a user
   */
  public getOptimalRegion(userLocation?: [number, number]): CDNRegion | null {
    if (userLocation) {
      return this.optimizeLatency(userLocation);
    }

    // Return region with best performance
    return this.findBestRegion();
  }

  /**
   * Dispose of edge deployment system
   */
  public dispose(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.performanceHistory = [];
    this.failoverHistory = [];
    this.isFailoverInProgress = false;
    
    console.log('🧹 Edge Deployment System disposed');
  }
}

// Export singleton instance
export const edgeDeploymentSystem = new EdgeDeploymentSystem(); 