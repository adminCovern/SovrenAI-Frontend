import { useAppSelector } from './useReduxStore';
import { raftManager } from '../providers/StateProvider';
import { RaftNodeRole } from '../store/slices/raftSlice';
import { ExecutiveState } from '../types';

/**
 * Custom hook for RAFT consensus operations
 */
export const useRaftConsensus = () => {
  const raftState = useAppSelector(state => state.raft);
  
  /**
   * Submit a command to the RAFT consensus system
   */
  const submitCommand = async (command: any): Promise<boolean> => {
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
  const isLeader = (): boolean => {
    return raftState.role === 'leader';
  };
  
  /**
   * Get the current RAFT leader ID
   */
  const getLeaderId = (): string | null => {
    return raftState.leaderId;
  };
  
  /**
   * Get the current RAFT role
   */
  const getRole = (): RaftNodeRole => {
    return raftState.role;
  };
  
  /**
   * Get the current term
   */
  const getCurrentTerm = (): number => {
    return raftState.currentTerm;
  };
  
  /**
   * Get the executive states from the RAFT state machine
   */
  const getExecutiveStates = (): ExecutiveState[] => {
    return raftManager.getExecutiveStates();
  };
  
  /**
   * Get a specific executive state from the RAFT state machine
   */
  const getExecutiveState = (id: string): ExecutiveState | undefined => {
    return raftManager.getExecutiveState(id);
  };
  
  /**
   * Submit an executive update command
   */
  const updateExecutive = async (id: string, updates: Partial<ExecutiveState>): Promise<boolean> => {
    return submitCommand({
      type: 'executive_update',
      payload: { id, updates }
    });
  };
  
  /**
   * Submit an activity event command
   */
  const addActivity = async (activity: any): Promise<boolean> => {
    return submitCommand({
      type: 'activity_event',
      payload: activity
    });
  };
  
  return {
    raftState,
    submitCommand,
    isLeader,
    getLeaderId,
    getRole,
    getCurrentTerm,
    getExecutiveStates,
    getExecutiveState,
    updateExecutive,
    addActivity
  };
};

export default useRaftConsensus;