'use client'

import React, { useState, useEffect } from 'react'
import { useCalendar } from '../../hooks/useCalendar'
import { CalendarProvider } from '../../types/calendar'

interface CalendarControlsProps {
  className?: string
}

const CalendarControls: React.FC<CalendarControlsProps> = ({ className }) => {
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  const {
    calendars,
    events,
    credentials,
    isLoading,
    error,
    authenticateProvider,
    removeAuthentication,
    isProviderAuthenticated,
    getAuthenticatedProviders,
    syncAllCalendars,
    loadAnalytics,
    loadAvailability
  } = useCalendar('user-1') // TODO: Get actual user ID

  const [selectedDate, setSelectedDate] = useState(new Date())

  // Handle provider authentication
  const handleAuthenticateProvider = async (provider: CalendarProvider) => {
    setIsAuthenticating(true)
    try {
      await authenticateProvider(provider)
      // The auth flow will redirect to the provider's OAuth page
    } catch (error) {
      console.error('Authentication failed:', error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Handle provider removal
  const handleRemoveProvider = async (provider: CalendarProvider) => {
    try {
      await removeAuthentication(provider)
    } catch (error) {
      console.error('Failed to remove provider:', error)
    }
  }

  // Handle calendar sync
  const handleSyncCalendars = async () => {
    try {
      await syncAllCalendars()
    } catch (error) {
      console.error('Failed to sync calendars:', error)
    }
  }

  // Handle analytics load
  const handleLoadAnalytics = async () => {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = new Date()
    
    try {
      await loadAnalytics(startDate, endDate)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  // Handle availability load
  const handleLoadAvailability = async () => {
    const executiveIds = ['exec-1', 'exec-2', 'exec-3', 'exec-4', 'exec-5', 'exec-6', 'exec-7', 'exec-8']
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)
    
    try {
      await loadAvailability(executiveIds, startDate, endDate)
    } catch (error) {
      console.error('Failed to load availability:', error)
    }
  }

  return (
    <div className={`calendar-controls ${className || ''}`} style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(5, 5, 32, 0.9)',
      border: '1px solid #4d7cff',
      borderRadius: '8px',
      padding: '16px',
      color: 'white',
      minWidth: '300px',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#4d7cff' }}>Calendar Controls</h3>
      
      {/* View Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          View:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['month', 'week', 'day'] as const).map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              style={{
                background: selectedView === view ? '#4d7cff' : 'transparent',
                color: 'white',
                border: '1px solid #4d7cff',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize'
              }}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Authentication */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Calendar Providers:
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(['Google', 'Outlook', 'Exchange', 'CalDAV'] as CalendarProvider[]).map(provider => {
            const isAuthenticated = isProviderAuthenticated(provider)
            
            return (
              <div key={provider} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: isAuthenticated ? '#44ff44' : '#ff4444' 
                }} />
                <span style={{ flex: 1, fontSize: '12px' }}>{provider}</span>
                {isAuthenticated ? (
                  <button
                    onClick={() => handleRemoveProvider(provider)}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => handleAuthenticateProvider(provider)}
                    disabled={isAuthenticating}
                    style={{
                      background: '#4d7cff',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                      fontSize: '10px',
                      opacity: isAuthenticating ? 0.5 : 1
                    }}
                  >
                    {isAuthenticating ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Calendar Actions */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Actions:
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleSyncCalendars}
            disabled={isLoading}
            style={{
              background: '#4d7cff',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Syncing...' : 'Sync All Calendars'}
          </button>
          
          <button
            onClick={handleLoadAnalytics}
            style={{
              background: '#44ff44',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Load Analytics
          </button>
          
          <button
            onClick={handleLoadAvailability}
            style={{
              background: '#ff8844',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Load Availability
          </button>
        </div>
      </div>

      {/* Status Information */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Status:
        </label>
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          <div>Calendars: {calendars.length}</div>
          <div>Events: {events.length}</div>
          <div>Connected: {getAuthenticatedProviders().length}</div>
          {error && (
            <div style={{ color: '#ff4444', marginTop: '8px' }}>
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Date Navigation */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Selected Date:
        </label>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          style={{
            background: 'transparent',
            border: '1px solid #4d7cff',
            color: 'white',
            padding: '6px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            width: '100%'
          }}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Quick Actions:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSelectedDate(new Date())}
            style={{
              background: 'transparent',
              color: '#4d7cff',
              border: '1px solid #4d7cff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Today
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              setSelectedDate(tomorrow)
            }}
            style={{
              background: 'transparent',
              color: '#4d7cff',
              border: '1px solid #4d7cff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Tomorrow
          </button>
          <button
            onClick={() => {
              const nextWeek = new Date()
              nextWeek.setDate(nextWeek.getDate() + 7)
              setSelectedDate(nextWeek)
            }}
            style={{
              background: 'transparent',
              color: '#4d7cff',
              border: '1px solid #4d7cff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Next Week
          </button>
        </div>
      </div>
    </div>
  )
}

export default CalendarControls 