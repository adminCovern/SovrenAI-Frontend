'use client'

import React, { useEffect } from 'react';
import { useAppDispatch } from '../hooks/useReduxStore';
import { wsManager } from '../store';
import { 
  setConnected, 
  setConnectionError, 
  setReconnectAttempt,
  updateLatency 
} from '../store/slices/connectionSlice';

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children,
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Set WebSocket URL if provided
    if (url) {
      wsManager.setUrl(url);
    }

    // Set up connection handlers
    wsManager.onOpen(() => {
      dispatch(setConnected(true));
      
      // Update latency
      dispatch(updateLatency(wsManager.getLatency()));
    });

    wsManager.onClose(() => {
      dispatch(setConnected(false));
    });

    wsManager.onError((error) => {
      dispatch(setConnectionError('Connection error'));
      dispatch(setReconnectAttempt());
    });

    // Set up latency monitoring
    const latencyInterval = setInterval(() => {
      if (wsManager.isConnected()) {
        dispatch(updateLatency(wsManager.getLatency()));
      }
    }, 5000);

    // Connect to WebSocket
    wsManager.connect();

    // Clean up on unmount
    return () => {
      clearInterval(latencyInterval);
    };
  }, [dispatch, url]);

  return <>{children}</>;
};

export default WebSocketProvider;