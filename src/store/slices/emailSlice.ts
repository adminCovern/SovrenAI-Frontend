import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Email, EmailDraft, EmailThread } from '../../types';
import { EmailService } from '../../integrations/email/EmailService';

// Define the state interface
interface EmailState {
  emails: Email[];
  threads: EmailThread[];
  drafts: EmailDraft[];
  activeComposition: EmailDraft | null;
  filteredExecutiveId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: EmailState = {
  emails: [],
  threads: [],
  drafts: [],
  activeComposition: null,
  filteredExecutiveId: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchEmails = createAsyncThunk(
  'email/fetchEmails',
  async (userId: string, { rejectWithValue }) => {
    try {
      const emailService = EmailService.getInstance();
      const emails = await emailService.getEmails(userId);
      return emails;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchEmailsByExecutive = createAsyncThunk(
  'email/fetchEmailsByExecutive',
  async ({ userId, executiveId }: { userId: string; executiveId: string }, { rejectWithValue }) => {
    try {
      const emailService = EmailService.getInstance();
      const emails = await emailService.getEmailsByExecutive(userId, executiveId);
      return { emails, executiveId };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchEmailThreads = createAsyncThunk(
  'email/fetchEmailThreads',
  async (userId: string, { rejectWithValue }) => {
    try {
      const emailService = EmailService.getInstance();
      const threads = await emailService.getEmailThreads(userId);
      return threads;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchEmailDrafts = createAsyncThunk(
  'email/fetchEmailDrafts',
  async (userId: string, { rejectWithValue }) => {
    try {
      const emailService = EmailService.getInstance();
      const drafts = await emailService.getEmailDrafts(userId);
      return drafts;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createEmailDraft = createAsyncThunk(
  'email/createEmailDraft',
  async (draft: EmailDraft, { rejectWithValue }) => {
    try {
      const emailService = EmailService.getInstance();
      const newDraft = await emailService.createDraft(draft);
      return newDraft;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateEmailDraft = createAsyncThunk(
  'email/updateEmailDraft',
  async (draft: EmailDraft, { rejectWithValue }) => {
    try {
      const emailService = EmailService.getInstance();
      const updatedDraft = await emailService.updateDraft(draft);
      return updatedDraft;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const sendEmail = createAsyncThunk(
  'email/sendEmail',
  async (draft: EmailDraft, { rejectWithValue }) => {
    try {
      const emailService = EmailService.getInstance();
      const email = await emailService.sendEmail(draft);
      return { email, draftId: draft.id };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const simulateEmailComposition = createAsyncThunk(
  'email/simulateEmailComposition',
  async (
    {
      executiveId,
      to,
      subject,
      body,
      duration
    }: {
      executiveId: string;
      to: string[];
      subject: string;
      body: string;
      duration?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const emailService = EmailService.getInstance();
      const draft = await emailService.simulateEmailComposition(
        executiveId,
        to,
        subject,
        body,
        duration
      );
      return draft;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Create the slice
const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    setFilteredExecutiveId: (state, action: PayloadAction<string | null>) => {
      state.filteredExecutiveId = action.payload;
    },
    setActiveComposition: (state, action: PayloadAction<EmailDraft | null>) => {
      state.activeComposition = action.payload;
    },
    updateActiveComposition: (state, action: PayloadAction<Partial<EmailDraft>>) => {
      if (state.activeComposition) {
        state.activeComposition = {
          ...state.activeComposition,
          ...action.payload
        };
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchEmails
      .addCase(fetchEmails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.emails = action.payload;
      })
      .addCase(fetchEmails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchEmailsByExecutive
      .addCase(fetchEmailsByExecutive.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmailsByExecutive.fulfilled, (state, action) => {
        state.isLoading = false;
        state.emails = action.payload.emails;
        state.filteredExecutiveId = action.payload.executiveId;
      })
      .addCase(fetchEmailsByExecutive.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchEmailThreads
      .addCase(fetchEmailThreads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmailThreads.fulfilled, (state, action) => {
        state.isLoading = false;
        state.threads = action.payload;
      })
      .addCase(fetchEmailThreads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchEmailDrafts
      .addCase(fetchEmailDrafts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmailDrafts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drafts = action.payload;
      })
      .addCase(fetchEmailDrafts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // createEmailDraft
      .addCase(createEmailDraft.fulfilled, (state, action) => {
        state.drafts.push(action.payload);
      })
      .addCase(createEmailDraft.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // updateEmailDraft
      .addCase(updateEmailDraft.fulfilled, (state, action) => {
        const index = state.drafts.findIndex(draft => draft.id === action.payload.id);
        if (index >= 0) {
          state.drafts[index] = action.payload;
        }
        
        // Update active composition if it's the same draft
        if (state.activeComposition && state.activeComposition.id === action.payload.id) {
          state.activeComposition = action.payload;
        }
      })
      .addCase(updateEmailDraft.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // sendEmail
      .addCase(sendEmail.fulfilled, (state, action) => {
        // Add the new email
        state.emails.push(action.payload.email);
        
        // Update the thread
        const threadIndex = state.threads.findIndex(thread => thread.id === action.payload.email.thread.id);
        if (threadIndex >= 0) {
          state.threads[threadIndex] = action.payload.email.thread;
        } else {
          state.threads.push(action.payload.email.thread);
        }
        
        // Remove the draft
        const draftIndex = state.drafts.findIndex(draft => draft.id === action.payload.draftId);
        if (draftIndex >= 0) {
          state.drafts.splice(draftIndex, 1);
        }
        
        // Clear active composition if it's the same draft
        if (state.activeComposition && state.activeComposition.id === action.payload.draftId) {
          state.activeComposition = null;
        }
      })
      .addCase(sendEmail.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // simulateEmailComposition
      .addCase(simulateEmailComposition.fulfilled, (state, action) => {
        // Update the draft
        const index = state.drafts.findIndex(draft => draft.id === action.payload.id);
        if (index >= 0) {
          state.drafts[index] = action.payload;
        } else {
          state.drafts.push(action.payload);
        }
        
        // Update active composition
        state.activeComposition = action.payload;
      });
  }
});

// Export actions and reducer
export const {
  setFilteredExecutiveId,
  setActiveComposition,
  updateActiveComposition,
  clearError
} = emailSlice.actions;

export default emailSlice.reducer;