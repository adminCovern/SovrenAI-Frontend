import { configureStore } from '@reduxjs/toolkit'
import executiveReducer from './slices/executiveSlice'
import activityReducer from './slices/activitySlice'
import performanceReducer from './slices/performanceSlice'
import connectionReducer from './slices/connectionSlice'
import raftReducer from './slices/raftSlice'
import emailAuthReducer from './slices/emailAuthSlice'
import emailReducer from './slices/emailSlice'
import approvalReducer from './slices/approvalSlice'
import calendarReducer from './slices/calendarSlice'
import schedulingReducer from './slices/schedulingSlice'
import { createWebSocketMiddleware } from './middleware/websocketMiddleware'
import { WebSocketManager } from '../services/WebSocketManager'

// Create WebSocket manager instance
const wsManager = new WebSocketManager(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001')

export const store = configureStore({
  reducer: {
    executives: executiveReducer,
    activities: activityReducer,
    performance: performanceReducer,
    connection: connectionReducer,
    raft: raftReducer,
    emailAuth: emailAuthReducer,
    email: emailReducer,
    approvals: approvalReducer,
    calendar: calendarReducer,
    scheduling: schedulingReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in state
        ignoredActions: [
          'executives/updateExecutiveState', 
          'activities/addActivity',
          'raft/appendLogEntry'
        ],
        ignoredPaths: [
          'executives.states',
          'raft.log'
        ]
      }
    }).concat(createWebSocketMiddleware(wsManager))
})

// Export the WebSocket manager for direct use when needed
export { wsManager }

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch