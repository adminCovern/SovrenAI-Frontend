import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ActivityEvent } from '../../types'

interface ActivitySliceState {
  activities: ActivityEvent[]
  filteredActivities: ActivityEvent[]
  filter: {
    executiveId: string | null
    type: string | null
    impact: string | null
  }
}

const initialState: ActivitySliceState = {
  activities: [],
  filteredActivities: [],
  filter: {
    executiveId: null,
    type: null,
    impact: null
  }
}

const activitySlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    setActivities: (state, action: PayloadAction<ActivityEvent[]>) => {
      state.activities = action.payload
      state.filteredActivities = applyFilter(action.payload, state.filter)
    },
    addActivity: (state, action: PayloadAction<ActivityEvent>) => {
      state.activities.push(action.payload)
      
      // Keep only last 1000 activities to prevent memory issues
      if (state.activities.length > 1000) {
        state.activities = state.activities.slice(-1000)
      }
      
      state.filteredActivities = applyFilter(state.activities, state.filter)
    },
    setFilter: (state, action: PayloadAction<Partial<ActivitySliceState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload }
      state.filteredActivities = applyFilter(state.activities, state.filter)
    },
    clearFilter: (state) => {
      state.filter = {
        executiveId: null,
        type: null,
        impact: null
      }
      state.filteredActivities = [...state.activities]
    }
  }
})

// Helper function to apply filters
function applyFilter(activities: ActivityEvent[], filter: ActivitySliceState['filter']): ActivityEvent[] {
  return activities.filter(activity => {
    if (filter.executiveId && activity.executiveId !== filter.executiveId) {
      return false
    }
    
    if (filter.type && activity.type !== filter.type) {
      return false
    }
    
    if (filter.impact && activity.impact !== filter.impact) {
      return false
    }
    
    return true
  })
}

export const {
  setActivities,
  addActivity,
  setFilter,
  clearFilter
} = activitySlice.actions

export default activitySlice.reducer