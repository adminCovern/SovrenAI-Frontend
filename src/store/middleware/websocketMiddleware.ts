import { Middleware } from '@reduxjs/toolkit';
import { WebSocketManager } from '../../services/WebSocketManager';
import { 
  setExecutiveStates, 
  updateExecutiveState, 
  setExecutiveActivity 
} from '../slices/executiveSlice';
import { addActivity } from '../slices/activitySlice';
import { updateMetrics } from '../slices/performanceSlice';
import { MessageType } from '../../types';

// Create a WebSocket middleware that connects Redux to the WebSocketManager
export const createWebSocketMiddleware = (wsManager: WebSocketManager): Middleware => {
  return store => {
    // Set up message handlers when the middleware is created
    wsManager.onMessage('executive_update', (payload) => {
      if (payload.id) {
        store.dispatch(updateExecutiveState({
          id: payload.id,
          updates: payload.updates
        }));
      } else if (payload.states) {
        store.dispatch(setExecutiveStates(payload.states));
      }
    });

    wsManager.onMessage('activity_event', (payload) => {
      store.dispatch(addActivity(payload));
      
      // If the activity is associated with an executive, update their state too
      if (payload.executiveId) {
        store.dispatch(setExecutiveActivity({
          id: payload.executiveId,
          activity: payload.type
        }));
      }
    });

    wsManager.onMessage('performance_update', (payload) => {
      store.dispatch(updateMetrics(payload));
    });

    // Connect to WebSocket when middleware is initialized
    wsManager.connect();

    // Return the next handler
    return next => (action: any) => {
      // Handle actions that should be sent over WebSocket
      if (action.type === 'executives/sendStateUpdate') {
        wsManager.send('executive_update', action.payload.updates, action.payload.id);
      } else if (action.type === 'activities/sendActivity') {
        wsManager.send('activity_event', action.payload);
      }

      return next(action);
    };
  };
};