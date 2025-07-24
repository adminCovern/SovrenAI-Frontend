import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { 
  SchedulingConflict, 
  ConflictResolution, 
  MeetingActionItem,
  MeetingNotes,
  VideoCallSession,
  FollowUpTask,
  AISchedulingDecision,
  SchedulingAnalytics
} from '../../types/scheduling'
import { CalendarEvent } from '../../types/calendar'
import { ExecutiveState } from '../../types'
import { AISchedulingService } from '../../services/AISchedulingService'

// Create singleton instance
const aiSchedulingService = new AISchedulingService()

interface SchedulingState {
  conflicts: SchedulingConflict[]
  resolutions: ConflictResolution[]
  actionItems: MeetingActionItem[]
  followUps: FollowUpTask[]
  videoSessions: VideoCallSession[]
  decisions: AISchedulingDecision[]
  analytics: SchedulingAnalytics
  isLoading: boolean
  error: string | null
}

const initialState: SchedulingState = {
  conflicts: [],
  resolutions: [],
  actionItems: [],
  followUps: [],
  videoSessions: [],
  decisions: [],
  analytics: {
    conflictsResolved: 0,
    averageResolutionTime: 0,
    executiveUtilization: {},
    aiAccuracy: 0.85,
    userSatisfaction: 0.9
  },
  isLoading: false,
  error: null
}

// Async thunks
export const detectAndResolveConflicts = createAsyncThunk(
  'scheduling/detectAndResolveConflicts',
  async ({ events, executives }: { events: CalendarEvent[], executives: ExecutiveState[] }) => {
    const resolutions = await aiSchedulingService.detectAndResolveConflicts(events, executives)
    return resolutions
  }
)

export const handleVideoCallJoin = createAsyncThunk(
  'scheduling/handleVideoCallJoin',
  async ({ meetingId, executives }: { meetingId: string, executives: string[] }) => {
    const session = await aiSchedulingService.handleVideoCallJoin(meetingId, executives)
    return session
  }
)

export const handleMeetingConclusion = createAsyncThunk(
  'scheduling/handleMeetingConclusion',
  async ({ meetingId, notes }: { meetingId: string, notes: MeetingNotes }) => {
    const result = await aiSchedulingService.handleMeetingConclusion(meetingId, notes)
    return result
  }
)

export const getSchedulingAnalytics = createAsyncThunk(
  'scheduling/getAnalytics',
  async () => {
    return aiSchedulingService.getAnalytics()
  }
)

const schedulingSlice = createSlice({
  name: 'scheduling',
  initialState,
  reducers: {
    addConflict: (state, action: PayloadAction<SchedulingConflict>) => {
      state.conflicts.push(action.payload)
    },
    resolveConflict: (state, action: PayloadAction<{ conflictId: string, resolution: ConflictResolution }>) => {
      const conflict = state.conflicts.find(c => c.id === action.payload.conflictId)
      if (conflict) {
        conflict.resolved = true
        conflict.resolvedBy = 'ai'
        conflict.resolvedAt = new Date()
      }
      state.resolutions.push(action.payload.resolution)
    },
    addActionItem: (state, action: PayloadAction<MeetingActionItem>) => {
      state.actionItems.push(action.payload)
    },
    updateActionItem: (state, action: PayloadAction<{ id: string, updates: Partial<MeetingActionItem> }>) => {
      const item = state.actionItems.find(i => i.id === action.payload.id)
      if (item) {
        Object.assign(item, action.payload.updates)
        item.updatedAt = new Date()
      }
    },
    addFollowUp: (state, action: PayloadAction<FollowUpTask>) => {
      state.followUps.push(action.payload)
    },
    updateFollowUp: (state, action: PayloadAction<{ id: string, updates: Partial<FollowUpTask> }>) => {
      const followUp = state.followUps.find(f => f.id === action.payload.id)
      if (followUp) {
        Object.assign(followUp, action.payload.updates)
      }
    },
    addVideoSession: (state, action: PayloadAction<VideoCallSession>) => {
      state.videoSessions.push(action.payload)
    },
    updateVideoSession: (state, action: PayloadAction<{ id: string, updates: Partial<VideoCallSession> }>) => {
      const session = state.videoSessions.find(s => s.id === action.payload.id)
      if (session) {
        Object.assign(session, action.payload.updates)
      }
    },
    addDecision: (state, action: PayloadAction<AISchedulingDecision>) => {
      state.decisions.push(action.payload)
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Detect and resolve conflicts
      .addCase(detectAndResolveConflicts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(detectAndResolveConflicts.fulfilled, (state, action) => {
        state.isLoading = false
        state.resolutions.push(...action.payload)
      })
      .addCase(detectAndResolveConflicts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to resolve conflicts'
      })
      
      // Handle video call join
      .addCase(handleVideoCallJoin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(handleVideoCallJoin.fulfilled, (state, action) => {
        state.isLoading = false
        state.videoSessions.push(action.payload)
      })
      .addCase(handleVideoCallJoin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to join video call'
      })
      
      // Handle meeting conclusion
      .addCase(handleMeetingConclusion.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(handleMeetingConclusion.fulfilled, (state, action) => {
        state.isLoading = false
        state.actionItems.push(...action.payload.actionItems)
        state.followUps.push(...action.payload.followUps)
      })
      .addCase(handleMeetingConclusion.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to handle meeting conclusion'
      })
      
      // Get analytics
      .addCase(getSchedulingAnalytics.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getSchedulingAnalytics.fulfilled, (state, action) => {
        state.isLoading = false
        state.analytics = action.payload
      })
      .addCase(getSchedulingAnalytics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to get analytics'
      })
  }
})

export const {
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
} = schedulingSlice.actions

export default schedulingSlice.reducer 