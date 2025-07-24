import { EventEmitter } from 'events';

export interface AdminConfig {
  monitoringInterval: number;
  alertThresholds: AlertThresholds;
  complianceRequirements: ComplianceRequirements;
  maxRetentionDays: number;
  enableRealTimeMonitoring: boolean;
  enableComplianceReporting: boolean;
  enableDataRetention: boolean;
}

export interface AlertThresholds {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  errorRate: number;
  securityThreats: number;
  failedLogins: number;
  unauthorizedAccess: number;
}

export interface ComplianceRequirements {
  dataRetentionDays: number;
  encryptionRequired: boolean;
  accessLoggingRequired: boolean;
  auditTrailRequired: boolean;
  sessionTimeoutMinutes: number;
  passwordComplexityRequired: boolean;
  mfaRequired: boolean;
}

export interface SystemHealth {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  errorRate: number;
  uptime: number;
  status: 'healthy' | 'warning' | 'critical';
  details: string[];
}

export interface AdminAlert {
  id: string;
  type: 'system' | 'security' | 'performance' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  source: string;
  metadata: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'incident';
  generatedAt: number;
  period: {
    start: number;
    end: number;
  };
  dataRetentionMetrics: DataRetentionMetrics;
  securityMetrics: SecurityMetrics;
  accessControlMetrics: AccessControlMetrics;
  auditTrailMetrics: AuditTrailMetrics;
  violations: string[];
  recommendations: string[];
  status: 'compliant' | 'non-compliant' | 'partial';
}

export interface DataRetentionMetrics {
  totalRecords: number;
  retainedRecords: number;
  expiredRecords: number;
  retentionCompliance: number;
  oldestRecordAge: number;
  newestRecordAge: number;
}

export interface SecurityMetrics {
  totalThreats: number;
  blockedThreats: number;
  successfulAttacks: number;
  encryptionCoverage: number;
  keyRotationFrequency: number;
  sessionSecurity: number;
}

export interface AccessControlMetrics {
  totalAccessAttempts: number;
  successfulAccess: number;
  failedAccess: number;
  unauthorizedAttempts: number;
  roleDistribution: Record<string, number>;
  accessPatterns: Record<string, number>;
}

export interface AuditTrailMetrics {
  totalAuditEvents: number;
  executiveActions: number;
  systemEvents: number;
  securityEvents: number;
  auditTrailCompleteness: number;
  blockchainIntegrity: number;
}

export class AdministrativeMonitoringService extends EventEmitter {
  private config: AdminConfig;
  private systemHealthHistory: SystemHealth[] = [];
  private alerts: AdminAlert[] = [];
  private complianceReports: ComplianceReport[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private alertCheckingInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  constructor(config: Partial<AdminConfig> = {}) {
    super();
    this.config = {
      monitoringInterval: 30000, // 30 seconds
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        networkLatency: 200,
        errorRate: 5,
        securityThreats: 10,
        failedLogins: 5,
        unauthorizedAccess: 3
      },
      complianceRequirements: {
        dataRetentionDays: 90,
        encryptionRequired: true,
        accessLoggingRequired: true,
        auditTrailRequired: true,
        sessionTimeoutMinutes: 30,
        passwordComplexityRequired: true,
        mfaRequired: false
      },
      maxRetentionDays: 365,
      enableRealTimeMonitoring: true,
      enableComplianceReporting: true,
      enableDataRetention: true,
      ...config
    };
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemHealth();
    }, this.config.monitoringInterval);

    this.alertCheckingInterval = setInterval(() => {
      this.checkHealthAlerts();
    }, 10000); // Check alerts every 10 seconds

    this.emit('monitoringStarted');
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.alertCheckingInterval) {
      clearInterval(this.alertCheckingInterval);
    }
    this.emit('monitoringStopped');
  }

  private async collectSystemHealth(): Promise<void> {
    try {
      const health: SystemHealth = {
        timestamp: Date.now(),
        cpuUsage: await this.getCPUUsage(),
        memoryUsage: await this.getMemoryUsage(),
        diskUsage: await this.getDiskUsage(),
        networkLatency: await this.getNetworkLatency(),
        activeConnections: await this.getActiveConnections(),
        errorRate: await this.getErrorRate(),
        uptime: await this.getUptime(),
        status: 'healthy',
        details: []
      };

      // Determine health status
      health.status = this.determineHealthStatus(health);
      
      this.systemHealthHistory.push(health);
      
      // Keep only recent history (last 24 hours)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      this.systemHealthHistory = this.systemHealthHistory.filter(
        h => h.timestamp > oneDayAgo
      );

      this.emit('systemHealthUpdated', health);
    } catch (error) {
      console.error('Error collecting system health:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async getCPUUsage(): Promise<number> {
    // Simulate CPU usage (0-100%)
    return Math.random() * 100;
  }

  private async getMemoryUsage(): Promise<number> {
    // Simulate memory usage (0-100%)
    return Math.random() * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // Simulate disk usage (0-100%)
    return Math.random() * 100;
  }

  private async getNetworkLatency(): Promise<number> {
    // Simulate network latency (0-500ms)
    return Math.random() * 500;
  }

  private async getActiveConnections(): Promise<number> {
    // Simulate active connections (0-1000)
    return Math.floor(Math.random() * 1000);
  }

  private async getErrorRate(): Promise<number> {
    // Simulate error rate (0-10%)
    return Math.random() * 10;
  }

  private async getUptime(): Promise<number> {
    // Simulate uptime in seconds
    return Date.now() / 1000;
  }

  private determineHealthStatus(health: SystemHealth): 'healthy' | 'warning' | 'critical' {
    const { alertThresholds } = this.config;
    const issues: string[] = [];

    if (health.cpuUsage > alertThresholds.cpuUsage) {
      issues.push(`High CPU usage: ${health.cpuUsage.toFixed(1)}%`);
    }
    if (health.memoryUsage > alertThresholds.memoryUsage) {
      issues.push(`High memory usage: ${health.memoryUsage.toFixed(1)}%`);
    }
    if (health.diskUsage > alertThresholds.diskUsage) {
      issues.push(`High disk usage: ${health.diskUsage.toFixed(1)}%`);
    }
    if (health.networkLatency > alertThresholds.networkLatency) {
      issues.push(`High network latency: ${health.networkLatency.toFixed(1)}ms`);
    }
    if (health.errorRate > alertThresholds.errorRate) {
      issues.push(`High error rate: ${health.errorRate.toFixed(1)}%`);
    }

    health.details = issues;

    if (issues.length >= 3) return 'critical';
    if (issues.length >= 1) return 'warning';
    return 'healthy';
  }

  private async checkHealthAlerts(): Promise<void> {
    if (this.systemHealthHistory.length === 0) return;

    const latestHealth = this.systemHealthHistory[this.systemHealthHistory.length - 1];
    const { alertThresholds } = this.config;

    // Check for critical conditions
    if (latestHealth.cpuUsage > alertThresholds.cpuUsage) {
      this.createAlert({
        type: 'performance',
        severity: latestHealth.cpuUsage > 95 ? 'critical' : 'high',
        title: 'High CPU Usage',
        message: `CPU usage is at ${latestHealth.cpuUsage.toFixed(1)}%`,
        source: 'system-monitor',
        metadata: { cpuUsage: latestHealth.cpuUsage }
      });
    }

    if (latestHealth.memoryUsage > alertThresholds.memoryUsage) {
      this.createAlert({
        type: 'performance',
        severity: latestHealth.memoryUsage > 95 ? 'critical' : 'high',
        title: 'High Memory Usage',
        message: `Memory usage is at ${latestHealth.memoryUsage.toFixed(1)}%`,
        source: 'system-monitor',
        metadata: { memoryUsage: latestHealth.memoryUsage }
      });
    }

    if (latestHealth.errorRate > alertThresholds.errorRate) {
      this.createAlert({
        type: 'system',
        severity: latestHealth.errorRate > 8 ? 'critical' : 'high',
        title: 'High Error Rate',
        message: `Error rate is at ${latestHealth.errorRate.toFixed(1)}%`,
        source: 'system-monitor',
        metadata: { errorRate: latestHealth.errorRate }
      });
    }
  }

  private createAlert(alertData: Omit<AdminAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: AdminAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);
    this.emit('alertCreated', alert);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = Date.now();

    this.emit('alertAcknowledged', alert);
    return true;
  }

  public getSystemHealthHistory(timeRange: number = 3600000): SystemHealth[] {
    const cutoff = Date.now() - timeRange;
    return this.systemHealthHistory.filter(h => h.timestamp > cutoff);
  }

  public getCurrentSystemHealth(): SystemHealth | null {
    if (this.systemHealthHistory.length === 0) return null;
    return this.systemHealthHistory[this.systemHealthHistory.length - 1];
  }

  public getAdminAlerts(includeAcknowledged: boolean = false): AdminAlert[] {
    if (includeAcknowledged) return [...this.alerts];
    return this.alerts.filter(a => !a.acknowledged);
  }

  public async generateComplianceReport(
    reportType: 'daily' | 'weekly' | 'monthly' | 'incident',
    period?: { start: number; end: number }
  ): Promise<ComplianceReport> {
    const now = Date.now();
    const reportPeriod = period || {
      start: now - (24 * 60 * 60 * 1000), // Last 24 hours
      end: now
    };

    const dataRetentionMetrics = await this.getDataRetentionMetrics(reportPeriod);
    const securityMetrics = await this.getSecurityMetrics(reportPeriod);
    const accessControlMetrics = await this.getAccessControlMetrics(reportPeriod);
    const auditTrailMetrics = await this.getAuditTrailMetrics(reportPeriod);

    const violations = this.checkComplianceViolations(
      dataRetentionMetrics,
      securityMetrics,
      accessControlMetrics,
      auditTrailMetrics
    );

    const recommendations = this.generateRecommendations(violations);

    const status = violations.length === 0 ? 'compliant' : 
                   violations.length <= 2 ? 'partial' : 'non-compliant';

    const report: ComplianceReport = {
      id: this.generateReportId(),
      reportType,
      generatedAt: now,
      period: reportPeriod,
      dataRetentionMetrics,
      securityMetrics,
      accessControlMetrics,
      auditTrailMetrics,
      violations,
      recommendations,
      status
    };

    this.complianceReports.push(report);
    this.emit('complianceReportGenerated', report);

    return report;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDataRetentionMetrics(period: { start: number; end: number }): Promise<DataRetentionMetrics> {
    // Simulate data retention metrics
    const totalRecords = Math.floor(Math.random() * 10000) + 1000;
    const retainedRecords = Math.floor(totalRecords * 0.95);
    const expiredRecords = totalRecords - retainedRecords;
    const retentionCompliance = (retainedRecords / totalRecords) * 100;
    const oldestRecordAge = Math.random() * 365;
    const newestRecordAge = Math.random() * 30;

    return {
      totalRecords,
      retainedRecords,
      expiredRecords,
      retentionCompliance,
      oldestRecordAge,
      newestRecordAge
    };
  }

  private async getSecurityMetrics(period: { start: number; end: number }): Promise<SecurityMetrics> {
    // Simulate security metrics
    const totalThreats = Math.floor(Math.random() * 100);
    const blockedThreats = Math.floor(totalThreats * 0.9);
    const successfulAttacks = totalThreats - blockedThreats;
    const encryptionCoverage = Math.random() * 100;
    const keyRotationFrequency = Math.random() * 30;
    const sessionSecurity = Math.random() * 100;

    return {
      totalThreats,
      blockedThreats,
      successfulAttacks,
      encryptionCoverage,
      keyRotationFrequency,
      sessionSecurity
    };
  }

  private async getAccessControlMetrics(period: { start: number; end: number }): Promise<AccessControlMetrics> {
    // Simulate access control metrics
    const totalAccessAttempts = Math.floor(Math.random() * 1000) + 100;
    const successfulAccess = Math.floor(totalAccessAttempts * 0.85);
    const failedAccess = Math.floor(totalAccessAttempts * 0.1);
    const unauthorizedAttempts = totalAccessAttempts - successfulAccess - failedAccess;

    return {
      totalAccessAttempts,
      successfulAccess,
      failedAccess,
      unauthorizedAttempts,
      roleDistribution: {
        'admin': Math.floor(Math.random() * 10),
        'executive': Math.floor(Math.random() * 50),
        'user': Math.floor(Math.random() * 200)
      },
      accessPatterns: {
        'login': Math.floor(Math.random() * 500),
        'data-access': Math.floor(Math.random() * 300),
        'system-config': Math.floor(Math.random() * 50)
      }
    };
  }

  private async getAuditTrailMetrics(period: { start: number; end: number }): Promise<AuditTrailMetrics> {
    // Simulate audit trail metrics
    const totalAuditEvents = Math.floor(Math.random() * 5000) + 1000;
    const executiveActions = Math.floor(totalAuditEvents * 0.3);
    const systemEvents = Math.floor(totalAuditEvents * 0.4);
    const securityEvents = Math.floor(totalAuditEvents * 0.3);
    const auditTrailCompleteness = Math.random() * 100;
    const blockchainIntegrity = Math.random() * 100;

    return {
      totalAuditEvents,
      executiveActions,
      systemEvents,
      securityEvents,
      auditTrailCompleteness,
      blockchainIntegrity
    };
  }

  private checkComplianceViolations(
    dataRetention: DataRetentionMetrics,
    security: SecurityMetrics,
    accessControl: AccessControlMetrics,
    auditTrail: AuditTrailMetrics
  ): string[] {
    const violations: string[] = [];

    // Check data retention compliance
    if (dataRetention.retentionCompliance < 95) {
      violations.push('Data retention compliance below 95%');
    }

    // Check security compliance
    if (security.encryptionCoverage < 100) {
      violations.push('Encryption coverage not 100%');
    }
    if (security.successfulAttacks > 0) {
      violations.push('Successful security attacks detected');
    }

    // Check access control compliance
    if (accessControl.unauthorizedAttempts > this.config.alertThresholds.unauthorizedAccess) {
      violations.push('Too many unauthorized access attempts');
    }

    // Check audit trail compliance
    if (auditTrail.auditTrailCompleteness < 100) {
      violations.push('Incomplete audit trail');
    }
    if (auditTrail.blockchainIntegrity < 100) {
      violations.push('Blockchain integrity compromised');
    }

    return violations;
  }

  private generateRecommendations(violations: string[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.includes('retention'))) {
      recommendations.push('Implement automated data retention policies');
    }
    if (violations.some(v => v.includes('encryption'))) {
      recommendations.push('Enable encryption for all data at rest and in transit');
    }
    if (violations.some(v => v.includes('unauthorized'))) {
      recommendations.push('Strengthen access controls and implement MFA');
    }
    if (violations.some(v => v.includes('audit'))) {
      recommendations.push('Improve audit logging and monitoring');
    }
    if (violations.some(v => v.includes('blockchain'))) {
      recommendations.push('Verify blockchain integrity and repair if necessary');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current compliance practices');
    }

    return recommendations;
  }

  public getComplianceReports(timeRange: number = 2592000000): ComplianceReport[] { // 30 days
    const cutoff = Date.now() - timeRange;
    return this.complianceReports.filter(r => r.generatedAt > cutoff);
  }

  public getAdminDashboardData(): {
    systemHealth: SystemHealth | null;
    recentAlerts: AdminAlert[];
    complianceStatus: 'compliant' | 'non-compliant' | 'partial';
    activeViolations: number;
    recommendations: string[];
  } {
    const currentHealth = this.getCurrentSystemHealth();
    const recentAlerts = this.getAdminAlerts().slice(-10); // Last 10 alerts
    const recentReports = this.getComplianceReports(86400000); // Last 24 hours
    const latestReport = recentReports[recentReports.length - 1];

    return {
      systemHealth: currentHealth,
      recentAlerts,
      complianceStatus: latestReport?.status || 'compliant',
      activeViolations: latestReport?.violations.length || 0,
      recommendations: latestReport?.recommendations || []
    };
  }

  public checkAdminAccess(userId: string, action: string): boolean {
    // Simulate admin access check
    const adminUsers = ['admin', 'system-admin', 'security-admin'];
    return adminUsers.includes(userId);
  }

  public getMonitoringStats(): {
    isMonitoring: boolean;
    totalAlerts: number;
    unacknowledgedAlerts: number;
    totalReports: number;
    systemHealthHistorySize: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      totalAlerts: this.alerts.length,
      unacknowledgedAlerts: this.alerts.filter(a => !a.acknowledged).length,
      totalReports: this.complianceReports.length,
      systemHealthHistorySize: this.systemHealthHistory.length
    };
  }

  public dispose(): void {
    this.stopMonitoring();
    this.removeAllListeners();
    this.systemHealthHistory = [];
    this.alerts = [];
    this.complianceReports = [];
  }
}

export const administrativeMonitoringService = new AdministrativeMonitoringService(); 