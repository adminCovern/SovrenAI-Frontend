import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// RAFT consensus algorithm states
export type RaftNodeRole = 'follower' | 'candidate' | 'leader';

interface LogEntry {
  term: number;
  command: any;
  index: number;
}

interface RaftState {
  // RAFT state
  currentTerm: number;
  votedFor: string | null;
  log: LogEntry[];
  
  // Volatile state
  commitIndex: number;
  lastApplied: number;
  
  // Leader state
  nextIndex: Record<string, number>;
  matchIndex: Record<string, number>;
  
  // Node state
  role: RaftNodeRole;
  leaderId: string | null;
  
  // Election state
  electionTimeout: number;
  lastHeartbeat: number;
  
  // Cluster state
  nodes: string[];
  nodeStatus: Record<string, boolean>;
}

const initialState: RaftState = {
  currentTerm: 0,
  votedFor: null,
  log: [],
  
  commitIndex: 0,
  lastApplied: 0,
  
  nextIndex: {},
  matchIndex: {},
  
  role: 'follower',
  leaderId: null,
  
  electionTimeout: 300 + Math.floor(Math.random() * 150), // 300-450ms
  lastHeartbeat: Date.now(),
  
  nodes: [],
  nodeStatus: {}
};

const raftSlice = createSlice({
  name: 'raft',
  initialState,
  reducers: {
    // Term and voting
    incrementTerm: (state) => {
      state.currentTerm += 1;
      state.votedFor = null;
    },
    setVotedFor: (state, action: PayloadAction<string | null>) => {
      state.votedFor = action.payload;
    },
    
    // Log management
    appendLogEntry: (state, action: PayloadAction<Omit<LogEntry, 'index'>>) => {
      const { term, command } = action.payload;
      state.log.push({
        term,
        command,
        index: state.log.length
      });
    },
    setCommitIndex: (state, action: PayloadAction<number>) => {
      state.commitIndex = action.payload;
    },
    applyLogEntry: (state) => {
      if (state.lastApplied < state.commitIndex) {
        state.lastApplied += 1;
      }
    },
    
    // Role management
    setRole: (state, action: PayloadAction<RaftNodeRole>) => {
      state.role = action.payload;
      
      // Reset leader-specific state when becoming a follower
      if (action.payload === 'follower') {
        state.nextIndex = {};
        state.matchIndex = {};
      }
      
      // Reset election timeout when role changes
      state.electionTimeout = 300 + Math.floor(Math.random() * 150);
    },
    setLeader: (state, action: PayloadAction<string>) => {
      state.leaderId = action.payload;
    },
    
    // Heartbeat and timeout
    resetHeartbeat: (state) => {
      state.lastHeartbeat = Date.now();
    },
    setElectionTimeout: (state, action: PayloadAction<number>) => {
      state.electionTimeout = action.payload;
    },
    
    // Cluster management
    setNodes: (state, action: PayloadAction<string[]>) => {
      state.nodes = action.payload;
      
      // Initialize nextIndex and matchIndex for all nodes
      if (state.role === 'leader') {
        const nextLogIndex = state.log.length;
        action.payload.forEach(nodeId => {
          state.nextIndex[nodeId] = nextLogIndex;
          state.matchIndex[nodeId] = 0;
        });
      }
    },
    updateNodeStatus: (state, action: PayloadAction<{nodeId: string, isOnline: boolean}>) => {
      const { nodeId, isOnline } = action.payload;
      state.nodeStatus[nodeId] = isOnline;
    },
    
    // Leader-specific actions
    updateNextIndex: (state, action: PayloadAction<{nodeId: string, index: number}>) => {
      const { nodeId, index } = action.payload;
      if (state.role === 'leader') {
        state.nextIndex[nodeId] = index;
      }
    },
    updateMatchIndex: (state, action: PayloadAction<{nodeId: string, index: number}>) => {
      const { nodeId, index } = action.payload;
      if (state.role === 'leader') {
        state.matchIndex[nodeId] = index;
      }
    },
    
    // Reset state (for testing or recovery)
    resetRaftState: (state) => {
      return initialState;
    }
  }
});

export const {
  incrementTerm,
  setVotedFor,
  appendLogEntry,
  setCommitIndex,
  applyLogEntry,
  setRole,
  setLeader,
  resetHeartbeat,
  setElectionTimeout,
  setNodes,
  updateNodeStatus,
  updateNextIndex,
  updateMatchIndex,
  resetRaftState
} = raftSlice.actions;

export default raftSlice.reducer;