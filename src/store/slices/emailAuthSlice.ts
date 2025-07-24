import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { EmailProvider, EmailCredentials } from '../../types';
import { EmailAuthService } from '../../integrations/email/EmailAuthService';

// Define the state interface
interface EmailAuthState {
  authenticatedProviders: Record<EmailProvider, boolean>;
  isAuthenticating: boolean;
  authError: string | null;
  currentUserId: string;
}

// Initial state
const initialState: EmailAuthState = {
  authenticatedProviders: {
    Gmail: false,
    Outlook: false,
    Exchange: false
  },
  isAuthenticating: false,
  authError: null,
  currentUserId: 'default-user' // In a real app, this would come from user authentication
};

// Async thunks
export const startAuthFlow = createAsyncThunk(
  'emailAuth/startAuthFlow',
  async (provider: EmailProvider, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { emailAuth: EmailAuthState };
      const userId = state.emailAuth.currentUserId;
      
      const authService = EmailAuthService.getInstance();
      const authUrl = authService.startAuthFlow(provider, userId);
      
      // In a real app, you would redirect the user to this URL
      // For this implementation, we'll just return it
      window.location.href = authUrl;
      return { provider };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const handleAuthCallback = createAsyncThunk(
  'emailAuth/handleAuthCallback',
  async (code: string, { rejectWithValue }) => {
    try {
      const authService = EmailAuthService.getInstance();
      const credentials = await authService.handleAuthCallback(code);
      
      if (!credentials) {
        return rejectWithValue('Failed to authenticate');
      }
      
      return credentials;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const removeAuthentication = createAsyncThunk(
  'emailAuth/removeAuthentication',
  async (provider: EmailProvider, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { emailAuth: EmailAuthState };
      const userId = state.emailAuth.currentUserId;
      
      const authService = EmailAuthService.getInstance();
      const success = authService.removeAuthentication(provider, userId);
      
      if (!success) {
        return rejectWithValue('Failed to remove authentication');
      }
      
      return { provider };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Create the slice
const emailAuthSlice = createSlice({
  name: 'emailAuth',
  initialState,
  reducers: {
    setCurrentUserId: (state, action: PayloadAction<string>) => {
      state.currentUserId = action.payload;
    },
    clearAuthError: (state) => {
      state.authError = null;
    },
    initializeAuthState: (state) => {
      // Initialize the auth state from storage
      const authService = EmailAuthService.getInstance();
      const providers = authService.getAuthenticatedProviders(state.currentUserId);
      
      // Reset all providers to false
      state.authenticatedProviders = {
        Gmail: false,
        Outlook: false,
        Exchange: false
      };
      
      // Set authenticated providers to true
      providers.forEach(provider => {
        state.authenticatedProviders[provider] = true;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // startAuthFlow
      .addCase(startAuthFlow.pending, (state) => {
        state.isAuthenticating = true;
        state.authError = null;
      })
      .addCase(startAuthFlow.fulfilled, (state, action) => {
        state.isAuthenticating = false;
      })
      .addCase(startAuthFlow.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.authError = action.payload as string;
      })
      
      // handleAuthCallback
      .addCase(handleAuthCallback.pending, (state) => {
        state.isAuthenticating = true;
        state.authError = null;
      })
      .addCase(handleAuthCallback.fulfilled, (state, action) => {
        state.isAuthenticating = false;
        state.authenticatedProviders[action.payload.provider] = true;
      })
      .addCase(handleAuthCallback.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.authError = action.payload as string;
      })
      
      // removeAuthentication
      .addCase(removeAuthentication.fulfilled, (state, action) => {
        state.authenticatedProviders[action.payload.provider] = false;
      })
      .addCase(removeAuthentication.rejected, (state, action) => {
        state.authError = action.payload as string;
      });
  }
});

// Export actions and reducer
export const { setCurrentUserId, clearAuthError, initializeAuthState } = emailAuthSlice.actions;
export default emailAuthSlice.reducer;