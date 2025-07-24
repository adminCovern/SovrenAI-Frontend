import { OAuth2Token } from './index';

// Calendar Types and Interfaces
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees: CalendarAttendee[];
  organizer: CalendarAttendee;
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  status: EventStatus;
  priority: EventPriority;
  executiveId?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface CalendarAttendee {
  email: string;
  name: string;
  responseStatus: ResponseStatus;
  isOrganizer: boolean;
  executiveId?: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
  occurrences?: number;
  byDay?: string[];
  byMonth?: number[];
  byMonthDay?: number[];
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  isPrimary: boolean;
  isVisible: boolean;
  provider: CalendarProvider;
  permissions: CalendarPermission[];
  syncStatus: SyncStatus;
  lastSync: Date;
}

export interface CalendarPermission {
  role: PermissionRole;
  scope: PermissionScope;
  grantedTo: string;
}

export interface CalendarCredentials {
  id: string;
  userId: string;
  provider: CalendarProvider;
  email: string;
  tokens: OAuth2Token;
  calendars: Calendar[];
  lastSynced: Date;
  syncEnabled: boolean;
}

export interface CalendarSyncState {
  isSyncing: boolean;
  lastSyncTime: Date;
  syncErrors: string[];
  pendingChanges: CalendarChange[];
  syncProgress: number;
}

export interface CalendarChange {
  id: string;
  type: ChangeType;
  eventId: string;
  data: Partial<CalendarEvent>;
  timestamp: Date;
  status: ChangeStatus;
}

export interface CalendarAvailability {
  executiveId: string;
  timeSlots: TimeSlot[];
  busyTimes: TimeSlot[];
  preferences: AvailabilityPreferences;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  priority: SlotPriority;
}

export interface AvailabilityPreferences {
  workingHours: WorkingHours;
  timezone: string;
  bufferTime: number; // minutes
  maxMeetingsPerDay: number;
  preferredMeetingDuration: number; // minutes
}

export interface WorkingHours {
  start: string; // HH:MM format
  end: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
}

// Enums and Types
export type CalendarProvider = 'Google' | 'Outlook' | 'CalDAV' | 'Exchange';

export type EventStatus = 'confirmed' | 'tentative' | 'cancelled' | 'needsAction';

export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

export type ResponseStatus = 'accepted' | 'declined' | 'tentative' | 'needsAction';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type PermissionRole = 'owner' | 'writer' | 'reader' | 'freeBusy';

export type PermissionScope = 'user' | 'group' | 'domain' | 'public';

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'disabled';

export type ChangeType = 'create' | 'update' | 'delete';

export type ChangeStatus = 'pending' | 'synced' | 'failed';

export type SlotPriority = 'high' | 'medium' | 'low' | 'unavailable';

// Calendar API Response Types
export interface CalendarApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  errors?: string[];
}

export interface CalendarListResponse {
  calendars: Calendar[];
  nextPageToken?: string;
}

export interface EventListResponse {
  events: CalendarEvent[];
  nextPageToken?: string;
  timeZone: string;
  updated: Date;
}

// Calendar Integration State
export interface CalendarIntegrationState {
  credentials: CalendarCredentials[];
  events: CalendarEvent[];
  calendars: Calendar[];
  availability: CalendarAvailability[];
  syncState: CalendarSyncState;
  isLoading: boolean;
  error: string | null;
  activeCalendarId: string | null;
  selectedDateRange: {
    start: Date;
    end: Date;
  } | null;
}

// Calendar Filter Options
export interface CalendarFilterOptions {
  calendarIds?: string[];
  executiveIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  eventTypes?: string[];
  priorities?: EventPriority[];
  statuses?: EventStatus[];
}

// Calendar Search Options
export interface CalendarSearchOptions {
  query: string;
  searchFields: ('title' | 'description' | 'location' | 'attendees')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

// Calendar Analytics
export interface CalendarAnalytics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByExecutive: Record<string, number>;
  averageMeetingDuration: number;
  mostActiveTimeSlots: TimeSlot[];
  conflictCount: number;
  utilizationRate: number;
}

// Calendar Notification Types
export interface CalendarNotification {
  id: string;
  type: 'event_reminder' | 'conflict_detected' | 'availability_change' | 'sync_error';
  title: string;
  message: string;
  eventId?: string;
  executiveId?: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
} 