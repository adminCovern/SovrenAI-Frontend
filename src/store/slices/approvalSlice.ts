import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApprovalRequest } from '../../types';
import { EmailApprovalService } from '../../services/EmailApprovalService';

// Define the state interface
interface ApprovalState {
  pendingApprovals: ApprovalRequest[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: ApprovalState = {
  pendingApprovals: [],
  isLoading: false,
  error: null
};

// Async thunks
export const fetchPendingApprovals = createAsyncThunk(
  'approval/fetchPendingApprovals',
  async (_, { rejectWithValue }) => {
    try {
      const approvalService = EmailApprovalService.getInstance();
      const approvals = approvalService.getPendingApprovals();
      return approvals;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const approveRequest = createAsyncThunk(
  'approval/approveRequest',
  async (approvalId: string, { rejectWithValue }) => {
    try {
      const approvalService = EmailApprovalService.getInstance();
      const success = approvalService.processApproval(approvalId, true);
      if (!success) {
        throw new Error('Failed to process approval');
      }
      return approvalId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const rejectRequest = createAsyncThunk(
  'approval/rejectRequest',
  async (approvalId: string, { rejectWithValue }) => {
    try {
      const approvalService = EmailApprovalService.getInstance();
      const success = approvalService.processApproval(approvalId, false);
      if (!success) {
        throw new Error('Failed to process rejection');
      }
      return approvalId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Create the slice
const approvalSlice = createSlice({
  name: 'approval',
  initialState,
  reducers: {
    addApprovalRequest: (state, action: PayloadAction<ApprovalRequest>) => {
      state.pendingApprovals.push(action.payload);
    },
    removeApprovalRequest: (state, action: PayloadAction<string>) => {
      state.pendingApprovals = state.pendingApprovals.filter(
        approval => approval.id !== action.payload
      );
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchPendingApprovals
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingApprovals = action.payload;
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // approveRequest
      .addCase(approveRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingApprovals = state.pendingApprovals.filter(
          approval => approval.id !== action.payload
        );
      })
      .addCase(approveRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // rejectRequest
      .addCase(rejectRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingApprovals = state.pendingApprovals.filter(
          approval => approval.id !== action.payload
        );
      })
      .addCase(rejectRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions and reducer
export const {
  addApprovalRequest,
  removeApprovalRequest,
  clearError
} = approvalSlice.actions;

export default approvalSlice.reducer;