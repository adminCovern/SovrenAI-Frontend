import { useAppSelector, useAppDispatch } from './useReduxStore';
import { wsManager } from '../store';
import { raftManager } from '../providers/StateProvider';
import { 
  setExecutiveStates, 
  updateExecutiveState, 
  setExecutiveActivity 
} from '../store/slices/executiveSlice';
import { addActivity } from '../store/slices/activitySlice';
import { MessageType, ExecutiveState, ActivityEvent } from '../types';

/**
 * Custom hook for state management operations
 */
export const useStateManagement = () => {
  const dispatch = useAppDispatch();
  const executives = useAppSelector(state => state.executives.states);
  const activities = useAppSelector(state => state.activities.filteredActivities);
  const connectionStatus = useAppSelector(state => state.connection.isConnected);
  const raftState = useAppSelector(state => state.raft);

  /**
   * Update an executive's state
   */
  const updateExecutive = (id: string, updates: Partial<ExecutiveState>) => {
    dispatch(updateExecutiveState({ id, updates }));
    
    // If we're connected, send the update over WebSocket
    if (connectionStatus) {
      wsManager.send('executive_update', { id, updates }, id);
    }
  };

  /**
   * Add a new activity event
   */
  const addActivityEvent = (activity: ActivityEvent) => {
    dispatch(addActivity(activity));
    
    // If we're connected, send the activity over WebSocket
    if (connectionStatus) {
      wsManager.send('activity_event', activity, activity.executiveId);
    }
  };

  /**
   * Submit a command to the RAFT consensus system
   */
  const submitConsensusCommand = async (command: any) => {
    try {
      return await raftManager.submitCommand(command);
    } catch (error) {
      console.error('Failed to submit command to RAFT consensus:', error);
      return false;
    }
  };

  /**
   * Check if the current node is the RAFT leader
   */
  const isRaftLeader = () => {
    return raftState.role === 'leader';
  };

  /**
   * Get the current RAFT leader ID
   */
  const getRaftLeaderId = () => {
    return raftState.leaderId;
  };

  return {
    executives,
    activities,
    connectionStatus,
    raftState,
    updateExecutive,
    addActivityEvent,
    submitConsensusCommand,
    isRaftLeader,
    getRaftLeaderId,
    wsManager
  };
};

export default useStateManagement;