import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { RaftConsensusManager } from '../services/RaftConsensusManager';
import WebSocketProvider from './WebSocketProvider';

// Create a singleton instance of the RAFT consensus manager
const raftManager = new RaftConsensusManager();

interface StateProviderProps {
  children: React.ReactNode;
}

export const StateProvider: React.FC<StateProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize RAFT consensus manager with node IDs
    // In a real app, these would come from a configuration or discovery service
    raftManager.initialize([
      'node_executive_ceo',
      'node_executive_cfo',
      'node_executive_cto',
      'node_executive_cmo',
      'node_executive_coo',
      'node_executive_chro',
      'node_executive_clo',
      'node_executive_cso'
    ]);

    // Clean up on unmount
    return () => {
      raftManager.dispose();
    };
  }, []);

  return (
    <Provider store={store}>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </Provider>
  );
};

// Export the RAFT manager for direct use when needed
export { raftManager };