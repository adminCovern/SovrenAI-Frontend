'use client'

import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks/useReduxStore';
import { wsManager } from '../../store';

const WebSocketMonitor: React.FC = () => {
  const { isConnected, reconnectAttempts, latency } = useAppSelector(state => state.connection);
  const [queuedMessages, setQueuedMessages] = useState(0);
  const [socketState, setSocketState] = useState('');

  useEffect(() => {
    // Update queued message count every second
    const interval = setInterval(() => {
      setQueuedMessages(wsManager.getQueuedMessageCount());
      
      // Update socket state
      switch (wsManager.getState()) {
        case WebSocket.CONNECTING:
          setSocketState('connecting');
          break;
        case WebSocket.OPEN:
          setSocketState('open');
          break;
        case WebSocket.CLOSING:
          setSocketState('closing');
          break;
        case WebSocket.CLOSED:
          setSocketState('closed');
          break;
        default:
          setSocketState('unknown');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/80 rounded-md p-4 text-sm">
      <h3 className="text-white font-medium mb-2">WebSocket Status</h3>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-gray-400">Connection:</div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-white">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        <div className="text-gray-400">State:</div>
        <div className="text-white">{socketState}</div>
        
        <div className="text-gray-400">Latency:</div>
        <div className="text-white">{latency}ms</div>
        
        <div className="text-gray-400">Reconnect Attempts:</div>
        <div className="text-white">{reconnectAttempts}</div>
        
        <div className="text-gray-400">Queued Messages:</div>
        <div className="text-white">{queuedMessages}</div>
      </div>
      
      <div className="mt-3 flex gap-2">
        <button 
          onClick={() => wsManager.reconnect()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
        >
          Reconnect
        </button>
        
        <button 
          onClick={() => wsManager.clearMessageQueue()}
          className="bg-gray-600 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded"
          disabled={queuedMessages === 0}
        >
          Clear Queue
        </button>
      </div>
    </div>
  );
};

export default WebSocketMonitor;