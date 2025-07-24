import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchCalendars,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  getAnalytics,
  getAvailability,
  syncCalendars,
  authenticateCalendarProvider,
  handleCalendarAuthCallback,
  removeCalendarAuthentication,
  setActiveCalendar,
  setSelectedDateRange,
  clearCalendarData,
  filterEvents
} from '../store/slices/calendarSlice';
import {
  selectCalendarState,
  selectCalendars,
  selectEvents,
  selectCredentials,
  selectAvailability,
  selectSyncState,
  selectIsLoading,
  selectError,
  selectActiveCalendarId,
  selectSelectedDateRange
} from '../store/slices/calendarSlice';
import { CalendarProvider } from '../types/calendar';
import { CalendarEvent, Calendar, CalendarSearchOptions, CalendarFilterOptions } from '../types/calendar';

/**
 * Custom hook for calendar integration
 * Provides easy access to calendar functionality and state management
 */
export const useCalendar = (userId?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const calendarState = useSelector(selectCalendarState);
  const calendars = useSelector(selectCalendars);
  const events = useSelector(selectEvents);
  const credentials = useSelector(selectCredentials);
  const availability = useSelector(selectAvailability);
  const syncState = useSelector(selectSyncState);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const activeCalendarId = useSelector(selectActiveCalendarId);
  const selectedDateRange = useSelector(selectSelectedDateRange);

  // Local state for managing authentication flow
  const [authInProgress, setAuthInProgress] = useState<CalendarProvider | null>(null);

  /**
   * Fetch all calendars for the user
   */
  const loadCalendars = useCallback(() => {
    if (!userId) return;
    dispatch(fetchCalendars(userId));
  }, [dispatch, userId]);

  /**
   * Fetch events for a specific date range
   */
  const loadEvents = useCallback((
    startDate: Date,
    endDate: Date,
    calendarIds?: string[]
  ) => {
    if (!userId) return;
    dispatch(fetchEvents({ userId, startDate, endDate, calendarIds }));
  }, [dispatch, userId]);

  /**
   * Create a new calendar event
   */
  const createCalendarEvent = useCallback((
    event: Omit<CalendarEvent, 'id'>,
    calendarId: string
  ) => {
    if (!userId) return;
    return dispatch(createEvent({ userId, event, calendarId }));
  }, [dispatch, userId]);

  /**
   * Update an existing calendar event
   */
  const updateCalendarEvent = useCallback((
    eventId: string,
    updates: Partial<CalendarEvent>,
    calendarId: string
  ) => {
    if (!userId) return;
    return dispatch(updateEvent({ userId, eventId, updates, calendarId }));
  }, [dispatch, userId]);

  /**
   * Delete a calendar event
   */
  const deleteCalendarEvent = useCallback((
    eventId: string,
    calendarId: string
  ) => {
    if (!userId) return;
    return dispatch(deleteEvent({ userId, eventId, calendarId }));
  }, [dispatch, userId]);

  /**
   * Search for calendar events
   */
  const searchCalendarEvents = useCallback((
    searchOptions: CalendarSearchOptions
  ) => {
    if (!userId) return;
    return dispatch(searchEvents({ userId, searchOptions }));
  }, [dispatch, userId]);

  /**
   * Get calendar analytics
   */
  const loadAnalytics = useCallback((
    startDate: Date,
    endDate: Date
  ) => {
    if (!userId) return;
    return dispatch(getAnalytics({ userId, startDate, endDate }));
  }, [dispatch, userId]);

  /**
   * Get availability for executives
   */
  const loadAvailability = useCallback((
    executiveIds: string[],
    startDate: Date,
    endDate: Date
  ) => {
    if (!userId) return;
    return dispatch(getAvailability({ userId, executiveIds, startDate, endDate }));
  }, [dispatch, userId]);

  /**
   * Sync all calendars
   */
  const syncAllCalendars = useCallback(() => {
    if (!userId) return;
    return dispatch(syncCalendars(userId));
  }, [dispatch, userId]);

  /**
   * Start authentication flow for a calendar provider
   */
  const authenticateProvider = useCallback((
    provider: CalendarProvider
  ) => {
    if (!userId) return;
    setAuthInProgress(provider);
    return dispatch(authenticateCalendarProvider({ provider, userId }));
  }, [dispatch, userId]);

  /**
   * Handle authentication callback
   */
  const handleAuthCallback = useCallback((code: string) => {
    return dispatch(handleCalendarAuthCallback(code));
  }, [dispatch]);

  /**
   * Remove authentication for a calendar provider
   */
  const removeAuthentication = useCallback((
    provider: CalendarProvider
  ) => {
    if (!userId) return;
    return dispatch(removeCalendarAuthentication({ provider, userId }));
  }, [dispatch, userId]);

  /**
   * Set the active calendar
   */
  const setActiveCalendarId = useCallback((calendarId: string | null) => {
    dispatch(setActiveCalendar(calendarId));
  }, [dispatch]);

  /**
   * Set the selected date range
   */
  const setDateRange = useCallback((
    startDate: Date,
    endDate: Date
  ) => {
    dispatch(setSelectedDateRange({ start: startDate, end: endDate }));
  }, [dispatch]);

  /**
   * Clear the selected date range
   */
  const clearDateRange = useCallback(() => {
    dispatch(setSelectedDateRange(null));
  }, [dispatch]);

  /**
   * Filter events
   */
  const filterCalendarEvents = useCallback((
    filterOptions: CalendarFilterOptions
  ) => {
    dispatch(filterEvents(filterOptions));
  }, [dispatch]);

  /**
   * Clear all calendar data
   */
  const clearData = useCallback(() => {
    dispatch(clearCalendarData());
  }, [dispatch]);

  /**
   * Check if a provider is authenticated
   */
  const isProviderAuthenticated = useCallback((provider: CalendarProvider): boolean => {
    return credentials.some(cred => cred.provider === provider);
  }, [credentials]);

  /**
   * Get authenticated providers
   */
  const getAuthenticatedProviders = useCallback((): CalendarProvider[] => {
    return credentials.map(cred => cred.provider);
  }, [credentials]);

  /**
   * Get events for a specific calendar
   */
  const getEventsForCalendar = useCallback((
    calendarId: string
  ): CalendarEvent[] => {
    return events.filter(event => {
      // This is a simplified filter - in a real app, you'd need to map events to calendars
      return true;
    });
  }, [events]);

  /**
   * Get events for a specific date range
   */
  const getEventsForDateRange = useCallback((
    startDate: Date,
    endDate: Date
  ): CalendarEvent[] => {
    return events.filter(event => {
      return event.startTime >= startDate && event.endTime <= endDate;
    });
  }, [events]);

  /**
   * Get events for today
   */
  const getTodayEvents = useCallback((): CalendarEvent[] => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return getEventsForDateRange(startOfDay, endOfDay);
  }, [getEventsForDateRange]);

  /**
   * Get events for this week
   */
  const getThisWeekEvents = useCallback((): CalendarEvent[] => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return getEventsForDateRange(startOfWeek, endOfWeek);
  }, [getEventsForDateRange]);

  /**
   * Get events for this month
   */
  const getThisMonthEvents = useCallback((): CalendarEvent[] => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    return getEventsForDateRange(startOfMonth, endOfMonth);
  }, [getEventsForDateRange]);

  /**
   * Check if there are any conflicts in the current events
   */
  const hasConflicts = useCallback((): boolean => {
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (events[i].startTime < events[j].endTime && events[j].startTime < events[i].endTime) {
          return true;
        }
      }
    }
    return false;
  }, [events]);

  /**
   * Get the next event
   */
  const getNextEvent = useCallback((): CalendarEvent | null => {
    const now = new Date();
    const upcomingEvents = events
      .filter(event => event.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    return upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  }, [events]);

  /**
   * Get events by priority
   */
  const getEventsByPriority = useCallback((
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): CalendarEvent[] => {
    return events.filter(event => event.priority === priority);
  }, [events]);

  /**
   * Get events by status
   */
  const getEventsByStatus = useCallback((
    status: 'confirmed' | 'tentative' | 'cancelled' | 'needsAction'
  ): CalendarEvent[] => {
    return events.filter(event => event.status === status);
  }, [events]);

  // Auto-load calendars when userId is available
  useEffect(() => {
    if (userId) {
      loadCalendars();
    }
  }, [userId, loadCalendars]);

  return {
    // State
    calendars,
    events,
    credentials,
    availability,
    syncState,
    isLoading,
    error,
    activeCalendarId,
    selectedDateRange,
    authInProgress,

    // Actions
    loadCalendars,
    loadEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    searchCalendarEvents,
    loadAnalytics,
    loadAvailability,
    syncAllCalendars,
    authenticateProvider,
    handleAuthCallback,
    removeAuthentication,
    setActiveCalendarId,
    setDateRange,
    clearDateRange,
    filterCalendarEvents,
    clearData,

    // Computed values
    isProviderAuthenticated,
    getAuthenticatedProviders,
    getEventsForCalendar,
    getEventsForDateRange,
    getTodayEvents,
    getThisWeekEvents,
    getThisMonthEvents,
    hasConflicts,
    getNextEvent,
    getEventsByPriority,
    getEventsByStatus,

    // State object for direct access
    state: calendarState
  };
}; 