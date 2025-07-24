'use client'

import React, { useState } from 'react';
import WebSocketMonitor from './WebSocketMonitor';
import RaftConsensusMonitor from './RaftConsensusMonitor';
import RaftLogViewer from './RaftLogViewer';
import ConnectionStatus from './ConnectionStatus';

const SystemMonitor: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <>
      {/* Always visible connection status */}
      <ConnectionStatus />
      
      {/* Expandable system monitor */}
      <div className="fixed bottom-4 left-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-black/70 text-white p-2 rounded-md text-xs font-mono flex items-center"
        >
          <span className="mr-1">{isExpanded ? '▼' : '▶'}</span>
          System Monitor
        </button>
        
        {isExpanded && (
          <div className="absolute bottom-10 left-0 w-96 space-y-2 p-2 bg-black/50 backdrop-blur-sm rounded-md">
            <WebSocketMonitor />
            <RaftConsensusMonitor />
            <RaftLogViewer />
          </div>
        )}
      </div>
    </>
  );
};

export default SystemMonitor;