import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { administrativeMonitoringService } from '../../services/AdministrativeMonitoringService';
import { securityHardeningService } from '../../services/SecurityHardeningService';

interface AdministrativeMonitorProps {
  position: [number, number, number];
  scale?: number;
}

export const AdministrativeMonitor: React.FC<AdministrativeMonitorProps> = ({
  position,
  scale = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [monitoringStats, setMonitoringStats] = useState<any>(null);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const updateData = () => {
      setDashboardData(administrativeMonitoringService.getAdminDashboardData());
      setMonitoringStats(administrativeMonitoringService.getMonitoringStats());
      setSecurityStats(securityHardeningService.getSecurityStats());
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    // Start monitoring if not already started
    if (!administrativeMonitoringService.getMonitoringStats().isMonitoring) {
      administrativeMonitoringService.startMonitoring();
      setIsMonitoring(true);
    }

    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const handleStartMonitoring = () => {
    administrativeMonitoringService.startMonitoring();
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    administrativeMonitoringService.stopMonitoring();
    setIsMonitoring(false);
  };

  const handleGenerateReport = async () => {
    try {
      await administrativeMonitoringService.generateComplianceReport('daily');
    } catch (error) {
      console.error('Error generating report:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    administrativeMonitoringService.acknowledgeAlert(alertId, 'admin');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#00ff00';
      case 'warning': return '#ffff00';
      case 'critical': return '#ff0000';
      default: return '#888888';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#00ff00';
      case 'medium': return '#ffff00';
      case 'high': return '#ff8800';
      case 'critical': return '#ff0000';
      default: return '#888888';
    }
  };

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Central monitoring orb */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={isMonitoring ? '#00ff00' : '#ff0000'}
          emissive={isMonitoring ? '#00ff00' : '#ff0000'}
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Orbital rings for different metrics */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <ringGeometry args={[1.5, 1.8, 32]} />
        <meshBasicMaterial color="#0088ff" transparent opacity={0.3} />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <ringGeometry args={[2, 2.3, 32]} />
        <meshBasicMaterial color="#ff0088" transparent opacity={0.3} />
      </mesh>

      {/* Main holographic display */}
      <Html position={[0, 2, 0]} center>
        <div className="admin-monitor-display" style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid #00ff00',
          borderRadius: '10px',
          padding: '20px',
          minWidth: '400px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#00ff00', textAlign: 'center' }}>
            Administrative Monitor
          </h3>

          {/* System Health */}
          {dashboardData?.systemHealth && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>System Health</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <div>CPU: {dashboardData.systemHealth.cpuUsage.toFixed(1)}%</div>
                <div>Memory: {dashboardData.systemHealth.memoryUsage.toFixed(1)}%</div>
                <div>Disk: {dashboardData.systemHealth.diskUsage.toFixed(1)}%</div>
                <div>Network: {dashboardData.systemHealth.networkLatency.toFixed(0)}ms</div>
                <div>Errors: {dashboardData.systemHealth.errorRate.toFixed(1)}%</div>
                <div style={{ color: getStatusColor(dashboardData.systemHealth.status) }}>
                  Status: {dashboardData.systemHealth.status.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Recent Alerts */}
          {dashboardData?.recentAlerts && dashboardData.recentAlerts.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#ff8800', margin: '0 0 10px 0' }}>Recent Alerts</h4>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {dashboardData.recentAlerts.slice(0, 3).map((alert: any) => (
                  <div key={alert.id} style={{ 
                    marginBottom: '5px', 
                    padding: '5px', 
                    border: `1px solid ${getSeverityColor(alert.severity)}`,
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}>
                    <div style={{ color: getSeverityColor(alert.severity), fontWeight: 'bold' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '9px', opacity: 0.8 }}>
                      {alert.message}
                    </div>
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      style={{
                        background: '#00ff00',
                        color: '#000',
                        border: 'none',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '8px',
                        cursor: 'pointer',
                        marginTop: '3px'
                      }}
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Status */}
          {dashboardData && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#0088ff', margin: '0 0 10px 0' }}>Compliance</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <div>Status: {dashboardData.complianceStatus}</div>
                <div>Violations: {dashboardData.activeViolations}</div>
              </div>
              {dashboardData.recommendations.length > 0 && (
                <div style={{ marginTop: '5px', fontSize: '9px', opacity: 0.8 }}>
                  <div>Recommendations:</div>
                  {dashboardData.recommendations.slice(0, 2).map((rec: string, i: number) => (
                    <div key={i} style={{ marginLeft: '10px' }}>• {rec}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Stats */}
          {securityStats && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#ff0088', margin: '0 0 10px 0' }}>Security</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <div>Threats: {securityStats.totalThreats}</div>
                <div>Blocked: {securityStats.blockedThreats}</div>
                <div>Failed Logins: {securityStats.failedLogins}</div>
                <div>Active Sessions: {securityStats.activeSessions}</div>
              </div>
            </div>
          )}

          {/* Monitoring Controls */}
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button
              onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
              style={{
                background: isMonitoring ? '#ff0000' : '#00ff00',
                color: '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                marginRight: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            <button
              onClick={handleGenerateReport}
              style={{
                background: '#0088ff',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Generate Report
            </button>
          </div>

                     {/* Monitoring Stats */}
           {monitoringStats && (
             <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.7 }}>
               <div>Alerts: {monitoringStats.totalAlerts} | Unacknowledged: {monitoringStats.unacknowledgedAlerts}</div>
               <div>Reports: {monitoringStats.totalReports} | History: {monitoringStats.systemHealthHistorySize}</div>
             </div>
           )}
        </div>
      </Html>

      {/* Floating data points around the orb */}
      {dashboardData?.systemHealth && (
        <>
          <mesh position={[2, 1, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial 
              color={getStatusColor(dashboardData.systemHealth.status)}
              emissive={getStatusColor(dashboardData.systemHealth.status)}
              emissiveIntensity={0.5}
            />
          </mesh>
          <Html position={[2.5, 1, 0]}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              padding: '5px',
              borderRadius: '3px',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              CPU: {dashboardData.systemHealth.cpuUsage.toFixed(1)}%
            </div>
          </Html>
        </>
      )}

      {dashboardData?.recentAlerts && dashboardData.recentAlerts.length > 0 && (
        <>
          <mesh position={[-2, -1, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial 
              color={getSeverityColor(dashboardData.recentAlerts[0].severity)}
              emissive={getSeverityColor(dashboardData.recentAlerts[0].severity)}
              emissiveIntensity={0.5}
            />
          </mesh>
          <Html position={[-2.5, -1, 0]}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              padding: '5px',
              borderRadius: '3px',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              {dashboardData.recentAlerts.length} Alerts
            </div>
          </Html>
        </>
      )}
    </group>
  );
}; 