export interface SchedulingConflict {
  id: string
  type: 'time_overlap' | 'resource_conflict' | 'priority_conflict' | 'location_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  events: string[] // Event IDs involved in conflict
  executives: string[] // Executive IDs involved
  description: string
  suggestedResolutions: ConflictResolution[]
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

export interface ConflictResolution {
  id: string
  type: 'reschedule' | 'delegate' | 'merge' | 'cancel' | 'extend'
  description: string
  impact: 'low' | 'medium' | 'high'
  affectedEvents: string[]
  proposedSchedule: ProposedScheduleChange[]
  confidence: number // 0-1
  aiReasoning: string
}

export interface ProposedScheduleChange {
  eventId: string
  newStartTime: Date
  newEndTime: Date
  newLocation?: string
  newAttendees?: string[]
  reason: string
}

export interface MeetingActionItem {
  id: string
  meetingId: string
  title: string
  description: string
  assignedTo: string // Executive ID
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'delegated'
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface MeetingNotes {
  id: string
  meetingId: string
  executiveId: string
  content: string
  keyPoints: string[]
  decisions: string[]
  actionItems: MeetingActionItem[]
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
  createdAt: Date
}

export interface VideoCallSession {
  id: string
  meetingId: string
  platform: 'zoom' | 'teams' | 'google_meet' | 'webex'
  joinUrl: string
  meetingCode?: string
  password?: string
  executives: string[]
  status: 'scheduled' | 'joining' | 'active' | 'ended'
  startTime?: Date
  endTime?: Date
  recordingUrl?: string
  transcriptUrl?: string
  notes?: MeetingNotes
}

export interface FollowUpTask {
  id: string
  meetingId: string
  type: 'email' | 'call' | 'meeting' | 'document' | 'approval'
  title: string
  description: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: Date
  status: 'pending' | 'in_progress' | 'completed'
  relatedActionItems: string[]
  createdAt: Date
}

export interface SchedulingPreferences {
  executiveId: string
  preferredMeetingTimes: {
    startTime: string // HH:MM
    endTime: string // HH:MM
    days: number[] // 0-6 (Sunday-Saturday)
  }[]
  maxMeetingsPerDay: number
  preferredMeetingDuration: number // minutes
  bufferTime: number // minutes between meetings
  autoDeclineThreshold: number // minutes notice required
  delegationPreferences: {
    [executiveId: string]: number // confidence score 0-1
  }
}

export interface AISchedulingDecision {
  id: string
  type: 'conflict_resolution' | 'meeting_scheduling' | 'action_item_assignment' | 'follow_up_creation'
  decision: any
  reasoning: string
  confidence: number
  alternatives: any[]
  executiveId: string
  timestamp: Date
}

export interface SchedulingAnalytics {
  conflictsResolved: number
  averageResolutionTime: number // minutes
  executiveUtilization: {
    [executiveId: string]: {
      meetingsScheduled: number
      meetingsAttended: number
      conflictsInvolved: number
      actionItemsCompleted: number
    }
  }
  aiAccuracy: number // 0-1
  userSatisfaction: number // 0-1
} 