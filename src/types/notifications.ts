import { Vector3, ExecutiveRole, ActivityType, ImpactLevel } from './index'

// Notification Types
export interface Notification {
  id: string
  executiveId: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  priority: NotificationPriority
  impact: ImpactLevel
  data?: any
  position?: Vector3
  duration?: number
  requiresAction?: boolean
}

export type NotificationType = 
  | 'activity_update'
  | 'approval_required'
  | 'integration_alert'
  | 'performance_warning'
  | 'system_message'
  | 'executive_communication'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

// Holographic Display Types
export interface HolographicNotification {
  notification: Notification
  visualConfig: NotificationVisualConfig
  animationState: NotificationAnimationState
  particleSystem?: ParticleSystemConfig
}

export interface NotificationVisualConfig {
  color: number
  opacity: number
  scale: Vector3
  glowIntensity: number
  pulseRate: number
  floatHeight: number
  rotationSpeed: number
}

export interface NotificationAnimationState {
  isVisible: boolean
  isAnimating: boolean
  currentPhase: AnimationPhase
  startTime: number
  duration: number
}

export type AnimationPhase = 'appearing' | 'floating' | 'pulsing' | 'disappearing'

// Particle System Types
export interface ParticleSystemConfig {
  particleCount: number
  particleSize: number
  particleColor: number
  particleOpacity: number
  emissionRate: number
  velocity: Vector3
  spread: number
  lifetime: number
  blending: ParticleBlending
}

export type ParticleBlending = 'normal' | 'additive' | 'multiply'

// Central Activity Stream Types
export interface ActivityStreamItem {
  id: string
  executiveId: string
  executiveRole: ExecutiveRole
  activity: ActivityType
  description: string
  timestamp: Date
  impact: ImpactLevel
  status: ActivityStatus
  metadata?: any
}

export type ActivityStatus = 'active' | 'completed' | 'pending' | 'failed'

export interface ActivityStreamConfig {
  maxItems: number
  autoScroll: boolean
  filterByExecutive?: string[]
  filterByActivity?: ActivityType[]
  filterByImpact?: ImpactLevel[]
  sortOrder: 'newest' | 'oldest' | 'impact'
}

// Notification Manager Types
export interface NotificationManagerConfig {
  maxNotificationsPerExecutive: number
  defaultNotificationDuration: number
  enableParticleEffects: boolean
  enableSoundEffects: boolean
  notificationSpacing: number
  centralDisplayEnabled: boolean
}