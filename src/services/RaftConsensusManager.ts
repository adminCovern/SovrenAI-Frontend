import { store } from '../store';
import { wsManager } from '../store';
import {
  incrementTerm,
  setVotedFor,
  appendLogEntry,
  setCommitIndex,
  applyLogEntry,
  setRole,
  setLeader,
  resetHeartbeat,
  setNodes,
  updateNodeStatus,
  updateNextIndex,
  updateMatchIndex,
  RaftNodeRole
} from '../store/slices/raftSlice';
import { RaftStateMachine } from './RaftStateMachine';

export class RaftConsensusManager {
  private timerId: NodeJS.Timeout | null = null;
  private heartbeatTimerId: NodeJS.Timeout | null = null;
  private nodeId: string;
  private stateMachine: RaftStateMachine;
  
  constructor(nodeId: string = `node_${Math.random().toString(36).substr(2, 9)}`) {
    this.nodeId = nodeId;
    this.stateMachine = new RaftStateMachine();
  }
  
  /**
   * Initialize the RAFT consensus manager
   */
  public initialize(nodes: string[]): void {
    // Set the known nodes in the cluster
    store.dispatch(setNodes([...nodes, this.nodeId]));
    
    // Start as a follower
    store.dispatch(setRole('follower'));
    
    // Start the election timeout
    this.resetElectionTimeout();
    
    // Set up WebSocket message handlers
    this.setupMessageHandlers();
  }
  
  /**
   * Set up WebSocket message handlers for RAFT messages
   */
  private setupMessageHandlers(): void {
    // Handle vote requests
    wsManager.onMessage('raft_request_vote', (payload) => {
      const { candidateId, term, lastLogIndex, lastLogTerm } = payload;
      const state = store.getState().raft;
      
      let voteGranted = false;
      
      // If the candidate's term is greater than our current term, update our term
      if (term > state.currentTerm) {
        store.dispatch(incrementTerm());
        store.dispatch(setRole('follower'));
        store.dispatch(setVotedFor(null));
      }
      
      // Decide whether to vote for the candidate
      if (
        term >= state.currentTerm && 
        (state.votedFor === null || state.votedFor === candidateId) &&
        (lastLogTerm > state.log[state.log.length - 1]?.term || 
          (lastLogTerm === state.log[state.log.length - 1]?.term && 
           lastLogIndex >= state.log.length - 1))
      ) {
        store.dispatch(setVotedFor(candidateId));
        voteGranted = true;
        
        // Reset election timeout when granting vote
        this.resetElectionTimeout();
      }
      
      // Send vote response
      wsManager.send('raft_vote_response', {
        term: state.currentTerm,
        voteGranted,
        nodeId: this.nodeId
      });
    });
    
    // Handle vote responses
    wsManager.onMessage('raft_vote_response', (payload) => {
      const { term, voteGranted, nodeId } = payload;
      const state = store.getState().raft;
      
      // If we're not a candidate, ignore
      if (state.role !== 'candidate') {
        return;
      }
      
      // If the responder's term is greater than ours, become a follower
      if (term > state.currentTerm) {
        store.dispatch(incrementTerm());
        store.dispatch(setRole('follower'));
        store.dispatch(setVotedFor(null));
        return;
      }
      
      // Count votes if we're still a candidate
      if (voteGranted) {
        // In a real implementation, we would count votes here
        // For simplicity, we'll just become leader if we get any vote
        store.dispatch(setRole('leader'));
        store.dispatch(setLeader(this.nodeId));
        
        // Start sending heartbeats
        this.startHeartbeats();
      }
    });
    
    // Handle append entries (heartbeats and log replication)
    wsManager.onMessage('raft_append_entries', (payload) => {
      const { 
        term, leaderId, prevLogIndex, prevLogTerm, 
        entries, leaderCommit 
      } = payload;
      const state = store.getState().raft;
      
      let success = false;
      
      // If the leader's term is greater than ours, update our term
      if (term > state.currentTerm) {
        store.dispatch(incrementTerm());
        store.dispatch(setRole('follower'));
        store.dispatch(setVotedFor(null));
      }
      
      // Accept the leader if term is valid
      if (term >= state.currentTerm) {
        store.dispatch(setLeader(leaderId));
        store.dispatch(resetHeartbeat());
        
        // Check if log matches at prevLogIndex
        const logMatches = 
          prevLogIndex === -1 || 
          (state.log[prevLogIndex] && state.log[prevLogIndex].term === prevLogTerm);
        
        if (logMatches) {
          success = true;
          
          // Append new entries (if any)
          if (entries && entries.length > 0) {
            // In a real implementation, we would handle conflicts here
            entries.forEach((entry: any) => {
              store.dispatch(appendLogEntry({
                term: entry.term,
                command: entry.command
              }));
            });
          }
          
          // Update commit index
          if (leaderCommit > state.commitIndex) {
            const newCommitIndex = Math.min(leaderCommit, state.log.length - 1);
            store.dispatch(setCommitIndex(newCommitIndex));
            
            // Apply committed entries
            while (state.lastApplied < newCommitIndex) {
              store.dispatch(applyLogEntry());
              
              // Apply the command to the state machine
              const entryToApply = state.log[state.lastApplied + 1];
              if (entryToApply && entryToApply.command) {
                this.stateMachine.applyCommand(entryToApply.command);
              }
            }
          }
        }
      }
      
      // Send response
      wsManager.send('raft_append_response', {
        term: state.currentTerm,
        success,
        nodeId: this.nodeId,
        lastLogIndex: state.log.length - 1
      });
    });
    
    // Handle append entries responses
    wsManager.onMessage('raft_append_response', (payload) => {
      const { term, success, nodeId, lastLogIndex } = payload;
      const state = store.getState().raft;
      
      // If we're not a leader, ignore
      if (state.role !== 'leader') {
        return;
      }
      
      // If the responder's term is greater than ours, become a follower
      if (term > state.currentTerm) {
        store.dispatch(incrementTerm());
        store.dispatch(setRole('follower'));
        store.dispatch(setVotedFor(null));
        return;
      }
      
      // Update nextIndex and matchIndex for the node
      if (success) {
        store.dispatch(updateNextIndex({
          nodeId,
          index: lastLogIndex + 1
        }));
        
        store.dispatch(updateMatchIndex({
          nodeId,
          index: lastLogIndex
        }));
        
        // Check if we can commit more entries
        this.updateCommitIndex();
      } else {
        // Decrement nextIndex and try again
        const nextIndex = Math.max(1, state.nextIndex[nodeId] - 1);
        store.dispatch(updateNextIndex({
          nodeId,
          index: nextIndex
        }));
        
        // Send append entries again with earlier index
        this.sendAppendEntries(nodeId);
      }
    });
  }
  
  /**
   * Start the election timeout
   */
  private resetElectionTimeout(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    
    const state = store.getState().raft;
    
    this.timerId = setTimeout(() => {
      // Only start election if we're a follower or candidate
      if (state.role !== 'leader') {
        this.startElection();
      }
    }, state.electionTimeout);
  }
  
  /**
   * Start an election
   */
  private startElection(): void {
    const state = store.getState().raft;
    
    // Increment term and vote for self
    store.dispatch(incrementTerm());
    store.dispatch(setRole('candidate'));
    store.dispatch(setVotedFor(this.nodeId));
    
    // Reset election timeout
    this.resetElectionTimeout();
    
    // Request votes from all nodes
    wsManager.send('raft_request_vote', {
      term: state.currentTerm + 1, // We just incremented
      candidateId: this.nodeId,
      lastLogIndex: state.log.length - 1,
      lastLogTerm: state.log[state.log.length - 1]?.term || 0
    });
  }
  
  /**
   * Start sending heartbeats (empty AppendEntries)
   */
  private startHeartbeats(): void {
    if (this.heartbeatTimerId) {
      clearInterval(this.heartbeatTimerId);
    }
    
    // Send initial heartbeats
    this.sendHeartbeats();
    
    // Send heartbeats periodically
    this.heartbeatTimerId = setInterval(() => {
      this.sendHeartbeats();
    }, 100); // 100ms heartbeat interval
  }
  
  /**
   * Send heartbeats to all nodes
   */
  private sendHeartbeats(): void {
    const state = store.getState().raft;
    
    // Only send heartbeats if we're the leader
    if (state.role !== 'leader') {
      if (this.heartbeatTimerId) {
        clearInterval(this.heartbeatTimerId);
        this.heartbeatTimerId = null;
      }
      return;
    }
    
    // Send AppendEntries to all nodes
    state.nodes.forEach(nodeId => {
      if (nodeId !== this.nodeId) {
        this.sendAppendEntries(nodeId);
      }
    });
  }
  
  /**
   * Send AppendEntries RPC to a specific node
   */
  private sendAppendEntries(nodeId: string): void {
    const state = store.getState().raft;
    const nextIndex = state.nextIndex[nodeId] || state.log.length;
    const prevLogIndex = nextIndex - 1;
    const prevLogTerm = prevLogIndex >= 0 ? state.log[prevLogIndex]?.term || 0 : 0;
    
    // Get entries to send
    const entries = state.log.slice(nextIndex);
    
    // Send AppendEntries RPC
    wsManager.send('raft_append_entries', {
      term: state.currentTerm,
      leaderId: this.nodeId,
      prevLogIndex,
      prevLogTerm,
      entries,
      leaderCommit: state.commitIndex
    }, nodeId);
  }
  
  /**
   * Update the commit index based on matchIndex values
   */
  private updateCommitIndex(): void {
    const state = store.getState().raft;
    
    // Only update commit index if we're the leader
    if (state.role !== 'leader') {
      return;
    }
    
    // Find the highest index that is replicated on a majority of nodes
    for (let n = state.commitIndex + 1; n < state.log.length; n++) {
      // Count nodes that have replicated this entry
      const replicatedCount = Object.values(state.matchIndex)
        .filter(index => index >= n)
        .length + 1; // +1 for self
      
      // Check if we have a majority
      if (replicatedCount > state.nodes.length / 2) {
        // Only commit if entry is from current term
        if (state.log[n].term === state.currentTerm) {
          store.dispatch(setCommitIndex(n));
        }
      }
    }
  }
  
  /**
   * Submit a command to the distributed log
   */
  public submitCommand(command: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const state = store.getState().raft;
      
      // Only accept commands if we're the leader
      if (state.role !== 'leader') {
        reject(new Error(`Not the leader, current leader is ${state.leaderId}`));
        return;
      }
      
      // Append to local log
      store.dispatch(appendLogEntry({
        term: state.currentTerm,
        command
      }));
      
      // Send AppendEntries to all nodes
      this.sendHeartbeats();
      
      // In a real implementation, we would wait for the command to be committed
      // For simplicity, we'll just resolve immediately
      resolve(true);
    });
  }
  
  /**
   * Get the state machine
   */
  public getStateMachine(): RaftStateMachine {
    return this.stateMachine;
  }
  
  /**
   * Get the current executive states from the state machine
   */
  public getExecutiveStates() {
    return this.stateMachine.getExecutiveStates();
  }
  
  /**
   * Get a specific executive state from the state machine
   */
  public getExecutiveState(id: string) {
    return this.stateMachine.getExecutiveState(id);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    
    if (this.heartbeatTimerId) {
      clearInterval(this.heartbeatTimerId);
      this.heartbeatTimerId = null;
    }
  }
}