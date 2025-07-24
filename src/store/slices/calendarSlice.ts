import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CalendarService } from '../../integrations/calendar/CalendarService';
import { CalendarAuthService } from '../../integrations/calendar/CalendarAuthService';
import { 
  CalendarEvent, 
  Calendar, 
  CalendarProvider, 
  CalendarCredentials,
  CalendarIntegrationState,
  CalendarFilterOptions,
  CalendarSearchOptions,
  CalendarAnalytics,
  CalendarAvailability
} from '../../types/calendar';

// Async thunks
export const fetchCalendars = createAsyncThunk(
  'calendar/fetchCalendars',
  async (userId: string, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const calendars = await calendarService.getCalendars(userId);
      return calendars;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchEvents = createAsyncThunk(
  'calendar/fetchEvents',
  async ({ 
    userId, 
    startDate, 
    endDate, 
    calendarIds 
  }: { 
    userId: string; 
    startDate: Date; 
    endDate: Date; 
    calendarIds?: string[] 
  }, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const events = await calendarService.getEvents(userId, startDate, endDate, calendarIds);
      return { events, startDate, endDate };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createEvent = createAsyncThunk(
  'calendar/createEvent',
  async ({ 
    userId, 
    event, 
    calendarId 
  }: { 
    userId: string; 
    event: Omit<CalendarEvent, 'id'>; 
    calendarId: string 
  }, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const newEvent = await calendarService.createEvent(userId, event, calendarId);
      return newEvent;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateEvent = createAsyncThunk(
  'calendar/updateEvent',
  async ({ 
    userId, 
    eventId, 
    updates, 
    calendarId 
  }: { 
    userId: string; 
    eventId: string; 
    updates: Partial<CalendarEvent>; 
    calendarId: string 
  }, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const updatedEvent = await calendarService.updateEvent(userId, eventId, updates, calendarId);
      return updatedEvent;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'calendar/deleteEvent',
  async ({ 
    userId, 
    eventId, 
    calendarId 
  }: { 
    userId: string; 
    eventId: string; 
    calendarId: string 
  }, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const success = await calendarService.deleteEvent(userId, eventId, calendarId);
      return { success, eventId };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const searchEvents = createAsyncThunk(
  'calendar/searchEvents',
  async ({ 
    userId, 
    searchOptions 
  }: { 
    userId: string; 
    searchOptions: CalendarSearchOptions 
  }, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const events = await calendarService.searchEvents(userId, searchOptions);
      return { events, searchOptions };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getAnalytics = createAsyncThunk(
  'calendar/getAnalytics',
  async ({ 
    userId, 
    startDate, 
    endDate 
  }: { 
    userId: string; 
    startDate: Date; 
    endDate: Date 
  }, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const analytics = await calendarService.getAnalytics(userId, startDate, endDate);
      return { analytics, startDate, endDate };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getAvailability = createAsyncThunk(
  'calendar/getAvailability',
  async ({ 
    userId, 
    executiveIds, 
    startDate, 
    endDate 
  }: { 
    userId: string; 
    executiveIds: string[]; 
    startDate: Date; 
    endDate: Date 
  }, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const availability = await calendarService.getAvailability(userId, executiveIds, startDate, endDate);
      return { availability, startDate, endDate };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const syncCalendars = createAsyncThunk(
  'calendar/syncCalendars',
  async (userId: string, { rejectWithValue }) => {
    try {
      const calendarService = CalendarService.getInstance();
      const result = await calendarService.syncCalendars(userId);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const authenticateCalendarProvider = createAsyncThunk(
  'calendar/authenticateProvider',
  async ({ 
    provider, 
    userId 
  }: { 
    provider: CalendarProvider; 
    userId: string 
  }, { rejectWithValue }) => {
    try {
      const authService = CalendarAuthService.getInstance();
      const authUrl = authService.startAuthFlow(provider, userId);
      return { authUrl, provider };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const handleCalendarAuthCallback = createAsyncThunk(
  'calendar/handleAuthCallback',
  async (code: string, { rejectWithValue }) => {
    try {
      const authService = CalendarAuthService.getInstance();
      const credentials = await authService.handleAuthCallback(code);
      return credentials;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const removeCalendarAuthentication = createAsyncThunk(
  'calendar/removeAuthentication',
  async ({ 
    provider, 
    userId 
  }: { 
    provider: CalendarProvider; 
    userId: string 
  }, { rejectWithValue }) => {
    try {
      const authService = CalendarAuthService.getInstance();
      const success = authService.removeAuthentication(provider, userId);
      return { success, provider };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Initial state
const initialState: CalendarIntegrationState = {
  credentials: [],
  events: [],
  calendars: [],
  availability: [],
  syncState: {
    isSyncing: false,
    lastSyncTime: new Date(),
    syncErrors: [],
    pendingChanges: [],
    syncProgress: 0
  },
  isLoading: false,
  error: null,
  activeCalendarId: null,
  selectedDateRange: null
};

// Calendar slice
const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set active calendar
    setActiveCalendar: (state, action: PayloadAction<string | null>) => {
      state.activeCalendarId = action.payload;
    },

    // Set selected date range
    setSelectedDateRange: (state, action: PayloadAction<{ start: Date; end: Date } | null>) => {
      state.selectedDateRange = action.payload;
    },

    // Add event to state
    addEvent: (state, action: PayloadAction<CalendarEvent>) => {
      state.events.push(action.payload);
    },

    // Update event in state
    updateEventInState: (state, action: PayloadAction<CalendarEvent>) => {
      const index = state.events.findIndex(event => event.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },

    // Remove event from state
    removeEventFromState: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter(event => event.id !== action.payload);
    },

    // Add calendar to state
    addCalendar: (state, action: PayloadAction<Calendar>) => {
      state.calendars.push(action.payload);
    },

    // Update calendar in state
    updateCalendarInState: (state, action: PayloadAction<Calendar>) => {
      const index = state.calendars.findIndex(calendar => calendar.id === action.payload.id);
      if (index !== -1) {
        state.calendars[index] = action.payload;
      }
    },

    // Remove calendar from state
    removeCalendarFromState: (state, action: PayloadAction<string>) => {
      state.calendars = state.calendars.filter(calendar => calendar.id !== action.payload);
    },

    // Add credentials to state
    addCredentials: (state, action: PayloadAction<CalendarCredentials>) => {
      state.credentials.push(action.payload);
    },

    // Update credentials in state
    updateCredentialsInState: (state, action: PayloadAction<CalendarCredentials>) => {
      const index = state.credentials.findIndex(cred => cred.id === action.payload.id);
      if (index !== -1) {
        state.credentials[index] = action.payload;
      }
    },

    // Remove credentials from state
    removeCredentialsFromState: (state, action: PayloadAction<string>) => {
      state.credentials = state.credentials.filter(cred => cred.id !== action.payload);
    },

    // Update sync state
    updateSyncState: (state, action: PayloadAction<Partial<typeof state.syncState>>) => {
      state.syncState = { ...state.syncState, ...action.payload };
    },

    // Clear all calendar data
    clearCalendarData: (state) => {
      state.events = [];
      state.calendars = [];
      state.availability = [];
      state.activeCalendarId = null;
      state.selectedDateRange = null;
    },

    // Filter events
    filterEvents: (state, action: PayloadAction<CalendarFilterOptions>) => {
      // This would typically trigger a new fetch with the filter options
      // For now, we'll just store the filter options
      state.selectedDateRange = action.payload.dateRange || null;
    }
  },
  extraReducers: (builder) => {
    // Fetch calendars
    builder
      .addCase(fetchCalendars.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCalendars.fulfilled, (state, action) => {
        state.isLoading = false;
        state.calendars = action.payload;
      })
      .addCase(fetchCalendars.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch events
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.events;
        state.selectedDateRange = {
          start: action.payload.startDate,
          end: action.payload.endDate
        };
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create event
    builder
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events.push(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update event
    builder
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete event
    builder
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.events = state.events.filter(event => event.id !== action.payload.eventId);
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search events
    builder
      .addCase(searchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.events;
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get analytics
    builder
      .addCase(getAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        // Analytics would typically be stored in a separate analytics state
        // For now, we'll just mark it as loaded
      })
      .addCase(getAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get availability
    builder
      .addCase(getAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availability = action.payload.availability;
      })
      .addCase(getAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Sync calendars
    builder
      .addCase(syncCalendars.pending, (state) => {
        state.syncState.isSyncing = true;
        state.syncState.syncProgress = 0;
        state.error = null;
      })
      .addCase(syncCalendars.fulfilled, (state, action) => {
        state.syncState.isSyncing = false;
        state.syncState.lastSyncTime = new Date();
        state.syncState.syncProgress = 100;
        if (!action.payload.success) {
          state.syncState.syncErrors = action.payload.errors;
        }
      })
      .addCase(syncCalendars.rejected, (state, action) => {
        state.syncState.isSyncing = false;
        state.syncState.syncErrors = [action.payload as string];
        state.error = action.payload as string;
      });

    // Authenticate provider
    builder
      .addCase(authenticateCalendarProvider.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticateCalendarProvider.fulfilled, (state, action) => {
        state.isLoading = false;
        // The auth URL would typically be handled by the UI to redirect the user
      })
      .addCase(authenticateCalendarProvider.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Handle auth callback
    builder
      .addCase(handleCalendarAuthCallback.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(handleCalendarAuthCallback.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.credentials.push(action.payload);
        }
      })
      .addCase(handleCalendarAuthCallback.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove authentication
    builder
      .addCase(removeCalendarAuthentication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeCalendarAuthentication.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.credentials = state.credentials.filter(
            cred => cred.provider !== action.payload.provider
          );
        }
      })
      .addCase(removeCalendarAuthentication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions
export const {
  setLoading,
  setError,
  clearError,
  setActiveCalendar,
  setSelectedDateRange,
  addEvent,
  updateEventInState,
  removeEventFromState,
  addCalendar,
  updateCalendarInState,
  removeCalendarFromState,
  addCredentials,
  updateCredentialsInState,
  removeCredentialsFromState,
  updateSyncState,
  clearCalendarData,
  filterEvents
} = calendarSlice.actions;

// Export reducer
export default calendarSlice.reducer;

// Export selectors
export const selectCalendarState = (state: { calendar: CalendarIntegrationState }) => state.calendar;
export const selectCalendars = (state: { calendar: CalendarIntegrationState }) => state.calendar.calendars;
export const selectEvents = (state: { calendar: CalendarIntegrationState }) => state.calendar.events;
export const selectCredentials = (state: { calendar: CalendarIntegrationState }) => state.calendar.credentials;
export const selectAvailability = (state: { calendar: CalendarIntegrationState }) => state.calendar.availability;
export const selectSyncState = (state: { calendar: CalendarIntegrationState }) => state.calendar.syncState;
export const selectIsLoading = (state: { calendar: CalendarIntegrationState }) => state.calendar.isLoading;
export const selectError = (state: { calendar: CalendarIntegrationState }) => state.calendar.error;
export const selectActiveCalendarId = (state: { calendar: CalendarIntegrationState }) => state.calendar.activeCalendarId;
export const selectSelectedDateRange = (state: { calendar: CalendarIntegrationState }) => state.calendar.selectedDateRange; 