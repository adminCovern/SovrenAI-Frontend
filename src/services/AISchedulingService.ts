import { CalendarEvent, Calendar } from '../types/calendar'
import { 
  SchedulingConflict, 
  ConflictResolution, 
  ProposedScheduleChange,
  MeetingActionItem,
  MeetingNotes,
  VideoCallSession,
  FollowUpTask,
  SchedulingPreferences,
  AISchedulingDecision,
  SchedulingAnalytics
} from '../types/scheduling'
import { ExecutiveState } from '../types'

/**
 * AI Scheduling Service
 * Handles autonomous scheduling, conflict resolution, and meeting management
 * Requirements: 3.3, 3.5, 3.7
 */
export class AISchedulingService {
  private conflicts: Map<string, SchedulingConflict> = new Map()
  private decisions: AISchedulingDecision[] = []
  private analytics: SchedulingAnalytics
  private executivePreferences: Map<string, SchedulingPreferences> = new Map()

  constructor() {
    this.analytics = {
      conflictsResolved: 0,
      averageResolutionTime: 0,
      executiveUtilization: {},
      aiAccuracy: 0.85,
      userSatisfaction: 0.9
    }
  }

  /**
   * Detect and resolve scheduling conflicts automatically
   * Requirement 3.3: WHEN scheduling conflicts arise THEN the AI SHALL resolve conflicts automatically with executive coordination
   */
  public async detectAndResolveConflicts(events: CalendarEvent[], executives: ExecutiveState[]): Promise<ConflictResolution[]> {
    const conflicts = this.detectConflicts(events)
    const resolutions: ConflictResolution[] = []

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, executives)
      if (resolution) {
        resolutions.push(resolution)
        this.conflicts.set(conflict.id, conflict)
        this.logDecision('conflict_resolution', resolution, 'AI conflict resolution')
      }
    }

    return resolutions
  }

  /**
   * Detect scheduling conflicts between events
   */
  private detectConflicts(events: CalendarEvent[]): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = []
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i]
        const event2 = events[j]
        
        // Check for time overlap
        if (this.hasTimeOverlap(event1, event2)) {
          const conflict: SchedulingConflict = {
            id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'time_overlap',
            severity: this.calculateConflictSeverity(event1, event2),
            events: [event1.id, event2.id],
            executives: [...new Set([...event1.attendees.map(a => a.email), ...event2.attendees.map(a => a.email)])],
            description: `Time conflict between "${event1.title}" and "${event2.title}"`,
            suggestedResolutions: [],
            resolved: false
          }
          conflicts.push(conflict)
        }
      }
    }

    return conflicts
  }

  /**
   * Check if two events have time overlap
   */
  private hasTimeOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
    const start1 = new Date(event1.startTime)
    const end1 = new Date(event1.endTime)
    const start2 = new Date(event2.startTime)
    const end2 = new Date(event2.endTime)
    
    return start1 < end2 && start2 < end1
  }

  /**
   * Calculate conflict severity based on event importance and executive availability
   */
  private calculateConflictSeverity(event1: CalendarEvent, event2: CalendarEvent): 'low' | 'medium' | 'high' | 'critical' {
    const priority1 = this.getEventPriority(event1)
    const priority2 = this.getEventPriority(event2)
    
    if (priority1 === 'high' && priority2 === 'high') return 'critical'
    if (priority1 === 'high' || priority2 === 'high') return 'high'
    if (priority1 === 'medium' || priority2 === 'medium') return 'medium'
    return 'low'
  }

  /**
   * Get event priority based on attendees and type
   */
  private getEventPriority(event: CalendarEvent): 'low' | 'medium' | 'high' {
    if (event.attendees.length > 5) return 'high'
    if (event.attendees.length > 2) return 'medium'
    return 'low'
  }

  /**
   * Resolve a specific conflict using AI reasoning
   */
  private async resolveConflict(conflict: SchedulingConflict, executives: ExecutiveState[]): Promise<ConflictResolution | null> {
    const resolutions: ConflictResolution[] = []
    
    // Generate different resolution strategies
    resolutions.push(this.generateRescheduleResolution(conflict))
    resolutions.push(this.generateDelegateResolution(conflict, executives))
    resolutions.push(this.generateMergeResolution(conflict))
    
    // Select best resolution based on AI reasoning
    const bestResolution = this.selectBestResolution(resolutions, conflict)
    
    if (bestResolution) {
      conflict.resolved = true
      conflict.resolvedBy = 'ai'
      conflict.resolvedAt = new Date()
      this.analytics.conflictsResolved++
    }
    
    return bestResolution
  }

  /**
   * Generate reschedule resolution
   */
  private generateRescheduleResolution(conflict: SchedulingConflict): ConflictResolution {
    return {
      id: `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'reschedule',
      description: 'Reschedule one of the conflicting events to an available time slot',
      impact: 'medium',
      affectedEvents: conflict.events,
      proposedSchedule: [],
      confidence: 0.8,
      aiReasoning: 'Rescheduling provides minimal disruption while maintaining all meeting objectives'
    }
  }

  /**
   * Generate delegate resolution
   */
  private generateDelegateResolution(conflict: SchedulingConflict, executives: ExecutiveState[]): ConflictResolution {
    const availableExecutives = executives.filter(exec => 
      exec.isActive && exec.executive.currentActivity === 'idle'
    )
    
    return {
      id: `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'delegate',
      description: `Delegate meeting to available executive: ${availableExecutives[0]?.executive.name || 'None'}`,
      impact: 'low',
      affectedEvents: conflict.events,
      proposedSchedule: [],
      confidence: availableExecutives.length > 0 ? 0.9 : 0.3,
      aiReasoning: 'Delegation leverages available executive capacity and maintains meeting continuity'
    }
  }

  /**
   * Generate merge resolution
   */
  private generateMergeResolution(conflict: SchedulingConflict): ConflictResolution {
    return {
      id: `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'merge',
      description: 'Merge conflicting meetings into a single coordinated session',
      impact: 'high',
      affectedEvents: conflict.events,
      proposedSchedule: [],
      confidence: 0.7,
      aiReasoning: 'Merging meetings can increase efficiency and reduce overall scheduling conflicts'
    }
  }

  /**
   * Select best resolution using AI reasoning
   */
  private selectBestResolution(resolutions: ConflictResolution[], conflict: SchedulingConflict): ConflictResolution | null {
    // Sort by confidence and impact
    const sorted = resolutions.sort((a, b) => {
      if (a.confidence !== b.confidence) return b.confidence - a.confidence
      return this.getImpactScore(b.impact) - this.getImpactScore(a.impact)
    })
    
    return sorted[0] || null
  }

  /**
   * Get impact score for sorting
   */
  private getImpactScore(impact: 'low' | 'medium' | 'high'): number {
    switch (impact) {
      case 'low': return 1
      case 'medium': return 2
      case 'high': return 3
      default: return 1
    }
  }

  /**
   * Handle autonomous video call joining
   * Requirement 3.5: IF executives join video calls THEN they SHALL do so autonomously with meeting notes generation
   */
  public async handleVideoCallJoin(meetingId: string, executives: string[]): Promise<VideoCallSession> {
    const session: VideoCallSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      meetingId,
      platform: this.detectVideoPlatform(meetingId),
      joinUrl: this.generateJoinUrl(meetingId),
      executives,
      status: 'joining',
      startTime: new Date()
    }

    // Simulate autonomous joining
    await this.simulateExecutiveJoining(session)
    
    // Generate meeting notes template
    session.notes = await this.generateMeetingNotes(meetingId, executives[0])
    
    this.logDecision('meeting_scheduling', session, 'Autonomous video call joining')
    
    return session
  }

  /**
   * Detect video platform from meeting ID or URL
   */
  private detectVideoPlatform(meetingId: string): 'zoom' | 'teams' | 'google_meet' | 'webex' {
    if (meetingId.includes('zoom')) return 'zoom'
    if (meetingId.includes('teams')) return 'teams'
    if (meetingId.includes('meet')) return 'google_meet'
    return 'webex'
  }

  /**
   * Generate join URL for video call
   */
  private generateJoinUrl(meetingId: string): string {
    return `https://meet.example.com/${meetingId}`
  }

  /**
   * Simulate executives autonomously joining the call
   */
  private async simulateExecutiveJoining(session: VideoCallSession): Promise<void> {
    // Simulate joining process
    await new Promise(resolve => setTimeout(resolve, 2000))
    session.status = 'active'
  }

  /**
   * Generate meeting notes template
   */
  private async generateMeetingNotes(meetingId: string, executiveId: string): Promise<MeetingNotes> {
    return {
      id: `notes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      meetingId,
      executiveId,
      content: 'Meeting notes will be generated during the call...',
      keyPoints: [],
      decisions: [],
      actionItems: [],
      sentiment: 'neutral',
      confidence: 0.8,
      createdAt: new Date()
    }
  }

  /**
   * Handle automatic follow-ups and action item extraction
   * Requirement 3.7: WHEN meetings conclude THEN executives SHALL handle automatic follow-ups and action item extraction
   */
  public async handleMeetingConclusion(meetingId: string, notes: MeetingNotes): Promise<{
    actionItems: MeetingActionItem[]
    followUps: FollowUpTask[]
  }> {
    const actionItems = await this.extractActionItems(notes)
    const followUps = await this.generateFollowUps(meetingId, actionItems)
    
    // Assign action items to appropriate executives
    await this.assignActionItems(actionItems)
    
    // Schedule follow-up tasks
    await this.scheduleFollowUps(followUps)
    
    this.logDecision('action_item_assignment', { actionItems, followUps }, 'Automatic follow-up generation')
    
    return { actionItems, followUps }
  }

  /**
   * Extract action items from meeting notes using AI
   */
  private async extractActionItems(notes: MeetingNotes): Promise<MeetingActionItem[]> {
    const actionItems: MeetingActionItem[] = []
    
    // Simulate AI extraction from meeting content
    const extractedItems = this.simulateAIExtraction(notes.content)
    
    for (const item of extractedItems) {
      actionItems.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        meetingId: notes.meetingId,
        title: item.title,
        description: item.description,
        assignedTo: item.assignedTo,
        priority: item.priority,
        dueDate: item.dueDate,
        status: 'pending',
        tags: item.tags,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    return actionItems
  }

  /**
   * Simulate AI extraction of action items from meeting content
   */
  private simulateAIExtraction(content: string): Array<{
    title: string
    description: string
    assignedTo: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    dueDate?: Date
    tags: string[]
  }> {
    // Simulate AI processing
    const actionItems: Array<{
      title: string
      description: string
      assignedTo: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
      dueDate?: Date
      tags: string[]
    }> = []
    
    if (content.includes('follow up')) {
      actionItems.push({
        title: 'Follow up with client',
        description: 'Send meeting summary and next steps',
        assignedTo: 'exec-1',
        priority: 'high' as const,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        tags: ['client', 'follow-up']
      })
    }
    
    if (content.includes('review')) {
      actionItems.push({
        title: 'Review proposal',
        description: 'Review and approve the proposed solution',
        assignedTo: 'exec-2',
        priority: 'medium' as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        tags: ['proposal', 'review']
      })
    }
    
    return actionItems
  }

  /**
   * Generate follow-up tasks based on action items
   */
  private async generateFollowUps(meetingId: string, actionItems: MeetingActionItem[]): Promise<FollowUpTask[]> {
    const followUps: FollowUpTask[] = []
    
    for (const actionItem of actionItems) {
      if (actionItem.priority === 'high' || actionItem.priority === 'urgent') {
        followUps.push({
          id: `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          meetingId,
          type: 'email',
          title: `Follow up: ${actionItem.title}`,
          description: actionItem.description,
          assignedTo: actionItem.assignedTo,
          priority: actionItem.priority,
          dueDate: actionItem.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'pending',
          relatedActionItems: [actionItem.id],
          createdAt: new Date()
        })
      }
    }
    
    return followUps
  }

  /**
   * Assign action items to appropriate executives
   */
  private async assignActionItems(actionItems: MeetingActionItem[]): Promise<void> {
    for (const item of actionItems) {
      // Simulate AI assignment logic
      if (!item.assignedTo) {
        item.assignedTo = this.selectBestExecutive(item)
      }
    }
  }

  /**
   * Select best executive for action item based on availability and expertise
   */
  private selectBestExecutive(actionItem: MeetingActionItem): string {
    // Simulate AI selection logic
    const executives = ['exec-1', 'exec-2', 'exec-3', 'exec-4', 'exec-5', 'exec-6', 'exec-7', 'exec-8']
    return executives[Math.floor(Math.random() * executives.length)]
  }

  /**
   * Schedule follow-up tasks
   */
  private async scheduleFollowUps(followUps: FollowUpTask[]): Promise<void> {
    for (const followUp of followUps) {
      // Schedule follow-up in calendar
      await this.scheduleFollowUpTask(followUp)
    }
  }

  /**
   * Schedule a follow-up task in the calendar
   */
  private async scheduleFollowUpTask(followUp: FollowUpTask): Promise<void> {
    // Simulate calendar scheduling
    console.log(`Scheduling follow-up: ${followUp.title} for ${followUp.assignedTo}`)
  }

  /**
   * Log AI scheduling decisions for audit trail
   */
  private logDecision(type: AISchedulingDecision['type'], decision: any, reasoning: string): void {
    const aiDecision: AISchedulingDecision = {
      id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      decision,
      reasoning,
      confidence: 0.85,
      alternatives: [],
      executiveId: 'ai-system',
      timestamp: new Date()
    }
    
    this.decisions.push(aiDecision)
  }

  /**
   * Get scheduling analytics
   */
  public getAnalytics(): SchedulingAnalytics {
    return this.analytics
  }

  /**
   * Get all AI decisions
   */
  public getDecisions(): AISchedulingDecision[] {
    return this.decisions
  }

  /**
   * Get active conflicts
   */
  public getActiveConflicts(): SchedulingConflict[] {
    return Array.from(this.conflicts.values()).filter(c => !c.resolved)
  }
} 