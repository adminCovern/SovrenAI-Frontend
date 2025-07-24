import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Executive, ExecutiveState, ExecutiveAction } from '../../types'
import { blockchainAuditChain } from '../../services/BlockchainAuditChain'

interface ExecutiveSliceState {
  states: ExecutiveState[]
  loading: boolean
  error: string | null
}

const initialState: ExecutiveSliceState = {
  states: [],
  loading: false,
  error: null
}

const executiveSlice = createSlice({
  name: 'executives',
  initialState,
  reducers: {
    setExecutiveStates: (state, action: PayloadAction<ExecutiveState[]>) => {
      state.states = action.payload
      state.loading = false
      state.error = null
    },
    updateExecutiveState: (state, action: PayloadAction<{ id: string, updates: Partial<ExecutiveState> }>) => {
      const { id, updates } = action.payload
      const index = state.states.findIndex(s => s.executive.id === id)
      
      if (index !== -1) {
        state.states[index] = { ...state.states[index], ...updates }
      }
    },
    setExecutiveActivity: (state, action: PayloadAction<{ id: string, activity: string }>) => {
      const { id, activity } = action.payload
      const index = state.states.findIndex(s => s.executive.id === id)
      
      if (index !== -1) {
        state.states[index].executive.currentActivity = activity as any
        state.states[index].isActive = activity !== 'idle'
      }
    },
    recordExecutiveAction: (state, action: PayloadAction<{ 
      executiveId: string, 
      action: ExecutiveAction, 
      context?: any 
    }>) => {
      const { executiveId, action: execAction, context } = action.payload
      const executiveState = state.states.find(s => s.executive.id === executiveId)
      
      if (executiveState) {
        // Record the action in the blockchain audit chain
        try {
          blockchainAuditChain.addAuditRecord(
            executiveState.executive,
            execAction,
            context
          )
          console.log(`✅ Recorded executive action in audit chain: ${execAction.type}`)
        } catch (error) {
          console.error('❌ Failed to record executive action in audit chain:', error)
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    }
  }
})

export const {
  setExecutiveStates,
  updateExecutiveState,
  setExecutiveActivity,
  recordExecutiveAction,
  setLoading,
  setError
} = executiveSlice.actions

export default executiveSlice.reducer