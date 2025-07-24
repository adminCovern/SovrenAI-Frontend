'use client'

import React from 'react';
import { useAppSelector } from '../../hooks/useReduxStore';

const ConnectionStatus: React.FC = () => {
  const { isConnected, connectionError, latency } = useAppSelector(state => state.connection);
  const raftState = useAppSelector(state => state.raft);

  return (
    <div className="fixed bottom-4 right-4 bg-black/70 text-white p-2 rounded-md text-xs font-mono">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        {isConnected && <span>({latency}ms)</span>}
      </div>
      
      {connectionError && (
        <div className="text-red-400 mt-1">
          Error: {connectionError}
        </div>
      )}
      
      <div className="mt-1 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          raftState.role === 'leader' ? 'bg-purple-500' : 
          raftState.role === 'candidate' ? 'bg-yellow-500' : 'bg-blue-500'
        }`} />
        <span>RAFT: {raftState.role}</span>
        {raftState.leaderId && raftState.role !== 'leader' && (
          <span>(Leader: {raftState.leaderId.split('_').pop()})</span>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;