'use client'

import React from 'react';
import { useRaftConsensus } from '../../hooks/useRaftConsensus';

const RaftConsensusMonitor: React.FC = () => {
  const { 
    raftState, 
    isLeader, 
    getLeaderId, 
    getRole 
  } = useRaftConsensus();
  
  const role = getRole();
  const leaderId = getLeaderId();
  const leaderName = leaderId ? leaderId.split('_').pop() : 'None';
  
  // Get node status
  const onlineNodes = Object.values(raftState.nodeStatus).filter(Boolean).length;
  const totalNodes = raftState.nodes.length;
  
  // Calculate log stats
  const logLength = raftState.log.length;
  const commitIndex = raftState.commitIndex;
  const uncommittedEntries = logLength - commitIndex - 1;
  
  return (
    <div className="bg-black/80 rounded-md p-4 text-sm">
      <h3 className="text-white font-medium mb-2">RAFT Consensus Status</h3>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-gray-400">Role:</div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            role === 'leader' ? 'bg-purple-500' : 
            role === 'candidate' ? 'bg-yellow-500' : 'bg-blue-500'
          }`} />
          <span className="text-white capitalize">{role}</span>
        </div>
        
        <div className="text-gray-400">Leader:</div>
        <div className="text-white">{leaderName}</div>
        
        <div className="text-gray-400">Term:</div>
        <div className="text-white">{raftState.currentTerm}</div>
        
        <div className="text-gray-400">Nodes:</div>
        <div className="text-white">{onlineNodes} / {totalNodes} online</div>
        
        <div className="text-gray-400">Log Entries:</div>
        <div className="text-white">{logLength}</div>
        
        <div className="text-gray-400">Committed:</div>
        <div className="text-white">{commitIndex + 1}</div>
        
        <div className="text-gray-400">Uncommitted:</div>
        <div className="text-white">{uncommittedEntries}</div>
        
        <div className="text-gray-400">Election Timeout:</div>
        <div className="text-white">{raftState.electionTimeout}ms</div>
      </div>
      
      {role === 'leader' && (
        <div className="mt-3">
          <h4 className="text-white text-xs font-medium mb-1">Node Indices</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(raftState.nextIndex).map(([nodeId, index]) => (
              <React.Fragment key={nodeId}>
                <div className="text-gray-400">{nodeId.split('_').pop()}:</div>
                <div className="text-white">
                  Next: {index}, Match: {raftState.matchIndex[nodeId] || 0}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RaftConsensusMonitor;