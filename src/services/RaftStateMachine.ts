import { store } from '../store';
import { Executive, ExecutiveState, ActivityEvent } from '../types';
import { setExecutiveStates, updateExecutiveState } from '../store/slices/executiveSlice';
import { addActivity } from '../store/slices/activitySlice';

/**
 * RaftStateMachine implements the state machine for the RAFT consensus algorithm
 * It handles applying committed log entries to the application state
 */
export class RaftStateMachine {
  // Cache of executive states to avoid unnecessary Redux updates
  private executiveStates: Map<string, ExecutiveState> = new Map();
  
  constructor() {
    // Initialize with current state from Redux
    const currentStates = store.getState().executives.states;
    currentStates.forEach(state => {
      this.executiveStates.set(state.executive.id, { ...state });
    });
  }
  
  /**
   * Apply a command to the state machine
   */
  public applyCommand(command: any): void {
    if (!command || !command.type) {
      console.error('Invalid command:', command);
      return;
    }
    
    switch (command.type) {
      case 'executive_update':
        this.handleExecutiveUpdate(command.payload);
        break;
      case 'activity_event':
        this.handleActivityEvent(command.payload);
        break;
      case 'executive_sync':
        this.handleExecutiveSync(command.payload);
        break;
      default:
        console.warn('Unknown command type:', command.type);
    }
  }
  
  /**
   * Handle executive update command
   */
  private handleExecutiveUpdate(payload: { id: string; updates: Partial<ExecutiveState> }): void {
    const { id, updates } = payload;
    
    // Get current state
    const currentState = this.executiveStates.get(id);
    
    if (!currentState) {
      console.warn(`Executive ${id} not found in state machine`);
      return;
    }
    
    // Update state
    const updatedState = { ...currentState, ...updates };
    this.executiveStates.set(id, updatedState);
    
    // Update Redux
    store.dispatch(updateExecutiveState({ id, updates }));
  }
  
  /**
   * Handle activity event command
   */
  private handleActivityEvent(payload: ActivityEvent): void {
    // Add activity to Redux
    store.dispatch(addActivity(payload));
    
    // Update executive state if needed
    if (payload.executiveId) {
      const currentState = this.executiveStates.get(payload.executiveId);
      
      if (currentState) {
        const updates = {
          executive: {
            ...currentState.executive,
            currentActivity: payload.type
          },
          isActive: payload.type !== 'idle'
        };
        
        this.executiveStates.set(payload.executiveId, {
          ...currentState,
          ...updates
        });
        
        // Update Redux
        store.dispatch(updateExecutiveState({
          id: payload.executiveId,
          updates
        }));
      }
    }
  }
  
  /**
   * Handle executive sync command (full state sync)
   */
  private handleExecutiveSync(payload: { states: ExecutiveState[] }): void {
    const { states } = payload;
    
    // Update cache
    states.forEach(state => {
      this.executiveStates.set(state.executive.id, { ...state });
    });
    
    // Update Redux
    store.dispatch(setExecutiveStates(states));
  }
  
  /**
   * Get the current state of all executives
   */
  public getExecutiveStates(): ExecutiveState[] {
    return Array.from(this.executiveStates.values());
  }
  
  /**
   * Get the current state of a specific executive
   */
  public getExecutiveState(id: string): ExecutiveState | undefined {
    return this.executiveStates.get(id);
  }
  
  /**
   * Reset the state machine
   */
  public reset(): void {
    this.executiveStates.clear();
    
    // Re-initialize with current state from Redux
    const currentStates = store.getState().executives.states;
    currentStates.forEach(state => {
      this.executiveStates.set(state.executive.id, { ...state });
    });
  }
}