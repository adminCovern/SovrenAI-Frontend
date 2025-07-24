import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './useAppStore'
import {
  detectAndResolveConflicts,
  handleVideoCallJoin,
  handleMeetingConclusion,
  getSchedulingAnalytics,
  addConflict,
  resolveConflict,
  addActionItem,
  updateActionItem,
  addFollowUp,
  updateFollowUp,
  addVideoSession,
  updateVideoSession,
  addDecision,
  clearError
} from '../store/slices/schedulingSlice'
import { CalendarEvent } from '../types/calendar'
import { ExecutiveState } from '../types'
import { MeetingNotes } from '../types/scheduling'

/**
 * AI Scheduling Hook
 * Provides access to AI scheduling functionality including conflict resolution,
 * autonomous video call joining, and action item extraction
 * Requirements: 3.3, 3.5, 3.7
 */
export const useAIScheduling = () => {
  const dispatch = useAppDispatch()
  const scheduling = useAppSelector(state => state.scheduling)

  // Conflict Resolution
  // Requirement 3.3: WHEN scheduling conflicts arise THEN the AI SHALL resolve conflicts automatically with executive coordination
  const resolveConflicts = useCallback(async (events: CalendarEvent[], executives: ExecutiveState[]) => {
    try {
      const result = await dispatch(detectAndResolveConflicts({ events, executives })).unwrap()
      return result
    } catch (error) {
      console.error('Failed to resolve conflicts:', error)
      throw error
    }
  }, [dispatch])

  const addNewConflict = useCallback((conflict: any) => {
    dispatch(addConflict(conflict))
  }, [dispatch])

  const resolveSpecificConflict = useCallback((conflictId: string, resolution: any) => {
    dispatch(resolveConflict({ conflictId, resolution }))
  }, [dispatch])

  // Video Call Management
  // Requirement 3.5: IF executives join video calls THEN they SHALL do so autonomously with meeting notes generation
  const joinVideoCall = useCallback(async (meetingId: string, executives: string[]) => {
    try {
      const session = await dispatch(handleVideoCallJoin({ meetingId, executives })).unwrap()
      return session
    } catch (error) {
      console.error('Failed to join video call:', error)
      throw error
    }
  }, [dispatch])

  const addVideoCallSession = useCallback((session: any) => {
    dispatch(addVideoSession(session))
  }, [dispatch])

  const updateVideoCallSession = useCallback((id: string, updates: any) => {
    dispatch(updateVideoSession({ id, updates }))
  }, [dispatch])

  // Action Item and Follow-up Management
  // Requirement 3.7: WHEN meetings conclude THEN executives SHALL handle automatic follow-ups and action item extraction
  const concludeMeeting = useCallback(async (meetingId: string, notes: MeetingNotes) => {
    try {
      const result = await dispatch(handleMeetingConclusion({ meetingId, notes })).unwrap()
      return result
    } catch (error) {
      console.error('Failed to handle meeting conclusion:', error)
      throw error
    }
  }, [dispatch])

  const addNewActionItem = useCallback((actionItem: any) => {
    dispatch(addActionItem(actionItem))
  }, [dispatch])

  const updateActionItemStatus = useCallback((id: string, updates: any) => {
    dispatch(updateActionItem({ id, updates }))
  }, [dispatch])

  const addFollowUpTask = useCallback((followUp: any) => {
    dispatch(addFollowUp(followUp))
  }, [dispatch])

  const updateFollowUpTask = useCallback((id: string, updates: any) => {
    dispatch(updateFollowUp({ id, updates }))
  }, [dispatch])

  // Analytics and Monitoring
  const refreshAnalytics = useCallback(async () => {
    try {
      await dispatch(getSchedulingAnalytics()).unwrap()
    } catch (error) {
      console.error('Failed to get analytics:', error)
      throw error
    }
  }, [dispatch])

  const addAIDecision = useCallback((decision: any) => {
    dispatch(addDecision(decision))
  }, [dispatch])

  const clearSchedulingError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  // Computed values
  const activeConflicts = scheduling.conflicts.filter(c => !c.resolved)
  const resolvedConflicts = scheduling.conflicts.filter(c => c.resolved)
  const pendingActionItems = scheduling.actionItems.filter(item => item.status === 'pending')
  const completedActionItems = scheduling.actionItems.filter(item => item.status === 'completed')
  const activeVideoSessions = scheduling.videoSessions.filter(session => session.status === 'active')
  const pendingFollowUps = scheduling.followUps.filter(followUp => followUp.status === 'pending')

  return {
    // State
    conflicts: scheduling.conflicts,
    resolutions: scheduling.resolutions,
    actionItems: scheduling.actionItems,
    followUps: scheduling.followUps,
    videoSessions: scheduling.videoSessions,
    decisions: scheduling.decisions,
    analytics: scheduling.analytics,
    isLoading: scheduling.isLoading,
    error: scheduling.error,

    // Computed values
    activeConflicts,
    resolvedConflicts,
    pendingActionItems,
    completedActionItems,
    activeVideoSessions,
    pendingFollowUps,

    // Actions
    resolveConflicts,
    addNewConflict,
    resolveSpecificConflict,
    joinVideoCall,
    addVideoCallSession,
    updateVideoCallSession,
    concludeMeeting,
    addNewActionItem,
    updateActionItemStatus,
    addFollowUpTask,
    updateFollowUpTask,
    refreshAnalytics,
    addAIDecision,
    clearSchedulingError
  }
} 