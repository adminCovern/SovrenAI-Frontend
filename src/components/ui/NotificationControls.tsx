'use client'

import React, { useState } from 'react'
import { useCommandCenter } from '../../providers/CommandCenterProvider'
import { useAppSelector } from '../../hooks/useAppStore'
import { NotificationType, NotificationPriority } from '../../types/notifications'

const NotificationControls: React.FC = () => {
  const { sceneManager } = useCommandCenter()
  const executiveStates = useAppSelector(state => state.executives.states)
  const notificationManager = sceneManager?.getNotificationManager()
  
  const [selectedExecutive, setSelectedExecutive] = useState<string>('')
  const [notificationType, setNotificationType] = useState<NotificationType>('activity_update')
  const [priority, setPriority] = useState<NotificationPriority>('medium')
  const [customTitle, setCustomTitle] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  
  const handleCreateNotification = () => {
    if (!notificationManager || !selectedExecutive) return
    
    const executive = executiveStates.find(s => s.executive.id === selectedExecutive)?.executive
    if (!executive) return
    
    const title = customTitle || getDefaultTitle(notificationType, executive.name)
    const message = customMessage || getDefaultMessage(notificationType, executive.name, executive.role)
    
    notificationManager.createNotification(
      selectedExecutive,
      notificationType,
      title,
      message,
      priority,
      { timestamp: new Date(), source: 'manual' }
    )
    
    // Clear custom fields
    setCustomTitle('')
    setCustomMessage('')
  }
  
  const handleClearNotifications = () => {
    if (!notificationManager || !selectedExecutive) return
    notificationManager.clearNotificationsForExecutive(selectedExecutive)
  }
  
  const handleCreateUrgentApproval = () => {
    if (!notificationManager || !selectedExecutive) return
    
    const executive = executiveStates.find(s => s.executive.id === selectedExecutive)?.executive
    if (!executive) return
    
    notificationManager.createNotification(
      selectedExecutive,
      'approval_required',
      'URGENT: High-Value Decision',
      `${executive.name} requires immediate approval for $${Math.floor(Math.random() * 50000 + 25000).toLocaleString()} transaction`,
      'urgent',
      { 
        value: Math.floor(Math.random() * 50000 + 25000),
        category: 'financial',
        deadline: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }
    )
  }
  
  const handleCreateSystemAlert = () => {
    const activeExecutives = executiveStates.filter(s => s.isActive)
    if (activeExecutives.length === 0 || !notificationManager) return
    
    const randomExecutive = activeExecutives[Math.floor(Math.random() * activeExecutives.length)]
    
    notificationManager.createNotification(
      randomExecutive.executive.id,
      'integration_alert',
      'System Integration Alert',
      `${randomExecutive.executive.name} detected anomaly in ${getRandomSystem()} integration`,
      'high',
      { 
        system: getRandomSystem(),
        errorCode: `ERR_${Math.floor(Math.random() * 9999)}`,
        severity: 'high'
      }
    )
  }
  
  const activeNotifications = notificationManager?.getActiveNotifications() || []
  const activityStream = notificationManager?.getActivityStream() || []
  
  return (
    <div style={{
      position: 'fixed',
      top: '120px',
      right: '20px',
      width: '320px',
      backgroundColor: 'rgba(5, 5, 32, 0.95)',
      border: '1px solid #4d7cff',
      borderRadius: '8px',
      padding: '16px',
      color: 'white',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      maxHeight: '70vh',
      overflowY: 'auto',
      boxShadow: '0 0 20px rgba(77, 124, 255, 0.3)'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        color: '#4d7cff',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        🔔 Notification Controls
      </h3>
      
      {/* Quick Actions */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#00ccff' }}>Quick Actions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={handleCreateUrgentApproval}
            disabled={!selectedExecutive}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedExecutive ? 'pointer' : 'not-allowed',
              fontSize: '11px',
              opacity: selectedExecutive ? 1 : 0.5
            }}
          >
            🚨 Create Urgent Approval
          </button>
          <button
            onClick={handleCreateSystemAlert}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ffaa00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            ⚠️ Create System Alert
          </button>
        </div>
      </div>
      
      {/* Executive Selection */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#00ccff' }}>
          Executive:
        </label>
        <select
          value={selectedExecutive}
          onChange={(e) => setSelectedExecutive(e.target.value)}
          style={{
            width: '100%',
            padding: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: '1px solid #4d7cff',
            borderRadius: '4px',
            fontSize: '11px'
          }}
        >
          <option value="">Select Executive</option>
          {executiveStates.map(state => (
            <option key={state.executive.id} value={state.executive.id}>
              {state.executive.name} ({state.executive.role})
            </option>
          ))}
        </select>
      </div>
      
      {/* Notification Type */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#00ccff' }}>
          Type:
        </label>
        <select
          value={notificationType}
          onChange={(e) => setNotificationType(e.target.value as NotificationType)}
          style={{
            width: '100%',
            padding: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: '1px solid #4d7cff',
            borderRadius: '4px',
            fontSize: '11px'
          }}
        >
          <option value="activity_update">Activity Update</option>
          <option value="approval_required">Approval Required</option>
          <option value="integration_alert">Integration Alert</option>
          <option value="performance_warning">Performance Warning</option>
          <option value="system_message">System Message</option>
          <option value="executive_communication">Executive Communication</option>
        </select>
      </div>
      
      {/* Priority */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#00ccff' }}>
          Priority:
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as NotificationPriority)}
          style={{
            width: '100%',
            padding: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: '1px solid #4d7cff',
            borderRadius: '4px',
            fontSize: '11px'
          }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      
      {/* Custom Title */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#00ccff' }}>
          Custom Title (optional):
        </label>
        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Leave empty for default"
          style={{
            width: '100%',
            padding: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: '1px solid #4d7cff',
            borderRadius: '4px',
            fontSize: '11px'
          }}
        />
      </div>
      
      {/* Custom Message */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#00ccff' }}>
          Custom Message (optional):
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Leave empty for default"
          rows={2}
          style={{
            width: '100%',
            padding: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: '1px solid #4d7cff',
            borderRadius: '4px',
            fontSize: '11px',
            resize: 'vertical'
          }}
        />
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={handleCreateNotification}
          disabled={!selectedExecutive}
          style={{
            flex: 1,
            padding: '6px 12px',
            backgroundColor: selectedExecutive ? '#4d7cff' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedExecutive ? 'pointer' : 'not-allowed',
            fontSize: '11px'
          }}
        >
          Create Notification
        </button>
        <button
          onClick={handleClearNotifications}
          disabled={!selectedExecutive}
          style={{
            flex: 1,
            padding: '6px 12px',
            backgroundColor: selectedExecutive ? '#ff6600' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedExecutive ? 'pointer' : 'not-allowed',
            fontSize: '11px'
          }}
        >
          Clear All
        </button>
      </div>
      
      {/* Active Notifications */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#00ccff' }}>
          Active Notifications ({activeNotifications.length})
        </h4>
        <div style={{ 
          maxHeight: '120px', 
          overflowY: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #333'
        }}>
          {activeNotifications.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>No active notifications</div>
          ) : (
            activeNotifications.map(notification => (
              <div key={notification.id} style={{ 
                marginBottom: '8px',
                padding: '6px',
                backgroundColor: 'rgba(77, 124, 255, 0.1)',
                borderRadius: '4px',
                borderLeft: `3px solid ${getNotificationColor(notification.priority)}`
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                  {notification.title}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>
                  {notification.message}
                </div>
                <div style={{ fontSize: '9px', opacity: 0.6 }}>
                  {notification.type} • {notification.priority} • {
                    executiveStates.find(s => s.executive.id === notification.executiveId)?.executive.name
                  }
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Activity Stream */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: '#00ccff' }}>
          Recent Activity ({activityStream.length})
        </h4>
        <div style={{ 
          maxHeight: '100px', 
          overflowY: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #333'
        }}>
          {activityStream.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>No recent activity</div>
          ) : (
            activityStream.slice(0, 10).map((item, index) => (
              <div key={item.id} style={{ 
                marginBottom: '4px',
                fontSize: '10px',
                opacity: 1 - (index * 0.05),
                color: getImpactColor(item.impact)
              }}>
                <span style={{ fontWeight: 'bold' }}>{item.executiveRole}:</span> {item.description}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getDefaultTitle(type: NotificationType, executiveName: string): string {
  switch (type) {
    case 'activity_update':
      return `${executiveName} Activity Update`
    case 'approval_required':
      return 'Approval Required'
    case 'integration_alert':
      return 'Integration Alert'
    case 'performance_warning':
      return 'Performance Warning'
    case 'system_message':
      return 'System Message'
    case 'executive_communication':
      return 'Executive Communication'
    default:
      return 'Notification'
  }
}

function getDefaultMessage(type: NotificationType, executiveName: string, role: string): string {
  switch (type) {
    case 'activity_update':
      return `${executiveName} is currently handling ${role.toLowerCase()} operations`
    case 'approval_required':
      return `${executiveName} requires approval for high-value decision`
    case 'integration_alert':
      return `${executiveName} detected integration issue requiring attention`
    case 'performance_warning':
      return `${executiveName} monitoring system performance metrics`
    case 'system_message':
      return `${executiveName} received important system notification`
    case 'executive_communication':
      return `${executiveName} sent executive communication`
    default:
      return `${executiveName} notification`
  }
}

function getNotificationColor(priority: NotificationPriority): string {
  switch (priority) {
    case 'urgent': return '#ff4444'
    case 'high': return '#ffaa00'
    case 'medium': return '#4d7cff'
    case 'low': return '#00ccff'
    default: return '#888'
  }
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'major': return '#ff4444'
    case 'significant': return '#ffaa00'
    case 'moderate': return '#4d7cff'
    case 'minimal': return '#00ccff'
    default: return '#888'
  }
}

function getRandomSystem(): string {
  const systems = ['CRM', 'Email', 'Calendar', 'Voice', 'Database', 'API Gateway', 'Analytics']
  return systems[Math.floor(Math.random() * systems.length)]
}

export default NotificationControls