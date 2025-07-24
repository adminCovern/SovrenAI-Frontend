import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConnectionState {
  isConnected: boolean;
  lastConnected: number | null;
  reconnectAttempts: number;
  connectionError: string | null;
  latency: number;
}

const initialState: ConnectionState = {
  isConnected: false,
  lastConnected: null,
  reconnectAttempts: 0,
  connectionError: null,
  latency: 0
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.lastConnected = Date.now();
        state.reconnectAttempts = 0;
        state.connectionError = null;
      }
    },
    setReconnectAttempt: (state) => {
      state.reconnectAttempts += 1;
    },
    setConnectionError: (state, action: PayloadAction<string>) => {
      state.connectionError = action.payload;
      state.isConnected = false;
    },
    updateLatency: (state, action: PayloadAction<number>) => {
      state.latency = action.payload;
    },
    resetConnection: (state) => {
      state.isConnected = false;
      state.reconnectAttempts = 0;
      state.connectionError = null;
    }
  }
});

export const {
  setConnected,
  setReconnectAttempt,
  setConnectionError,
  updateLatency,
  resetConnection
} = connectionSlice.actions;

export default connectionSlice.reducer;