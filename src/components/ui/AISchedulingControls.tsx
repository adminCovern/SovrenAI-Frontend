import React, { useState, useEffect } from 'react'
import { useAIScheduling } from '../../hooks/useAIScheduling'
import { SchedulingConflict, VideoCallSession, MeetingActionItem } from '../../types/scheduling'

/**
 * AI Scheduling Controls Component
 * Provides UI controls for managing AI scheduling functionality
 * Requirements: 3.3, 3.5, 3.7
 */
export const AISchedulingControls: React.FC = () => {
  const {
    activeConflicts,
    resolvedConflicts,
    activeVideoSessions,
    pendingActionItems,
    completedActionItems,
    analytics,
    isLoading,
    error,
    resolveConflicts,
    joinVideoCall,
    concludeMeeting,
    addNewActionItem,
    updateActionItemStatus,
    addFollowUpTask,
    refreshAnalytics,
    clearSchedulingError
  } = useAIScheduling()

  const [selectedConflict, setSelectedConflict] = useState<SchedulingConflict | null>(null)
  const [selectedSession, setSelectedSession] = useState<VideoCallSession | null>(null)
  const [selectedActionItem, setSelectedActionItem] = useState<MeetingActionItem | null>(null)
  const [showConflictDetails, setShowConflictDetails] = useState(false)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const [showActionItemDetails, setShowActionItemDetails] = useState(false)

  // Auto-refresh analytics
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAnalytics()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [refreshAnalytics])

  const handleConflictResolution = async () => {
    if (selectedConflict) {
      try {
        // Simulate conflict resolution
        const mockEvents: any[] = [] // Would be real calendar events
        const mockExecutives: any[] = [] // Would be real executive states
        await resolveConflicts(mockEvents, mockExecutives)
        setShowConflictDetails(false)
        setSelectedConflict(null)
      } catch (error) {
        console.error('Failed to resolve conflict:', error)
      }
    }
  }

  const handleVideoCallJoin = async () => {
    if (selectedSession) {
      try {
        await joinVideoCall(selectedSession.meetingId, selectedSession.executives)
        setShowSessionDetails(false)
        setSelectedSession(null)
      } catch (error) {
        console.error('Failed to join video call:', error)
      }
    }
  }

  const handleActionItemUpdate = (itemId: string, status: 'pending' | 'in_progress' | 'completed') => {
    updateActionItemStatus(itemId, { status })
  }

  const handleMeetingConclusion = async () => {
    if (selectedSession) {
      try {
        // Simulate meeting notes
        const mockNotes = {
          id: 'notes-1',
          meetingId: selectedSession.meetingId,
          executiveId: selectedSession.executives[0],
          content: 'Meeting concluded successfully with action items extracted.',
          keyPoints: ['Key point 1', 'Key point 2'],
          decisions: ['Decision 1', 'Decision 2'],
          actionItems: [],
          sentiment: 'positive' as const,
          confidence: 0.9,
          createdAt: new Date()
        }
        
        await concludeMeeting(selectedSession.meetingId, mockNotes)
        setShowSessionDetails(false)
        setSelectedSession(null)
      } catch (error) {
        console.error('Failed to conclude meeting:', error)
      }
    }
  }

  return (
    <div className="ai-scheduling-controls bg-gray-900 text-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-blue-400">AI Scheduling Controls</h3>
        <div className="flex space-x-2">
          <button
            onClick={refreshAnalytics}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          {error && (
            <button
              onClick={clearSchedulingError}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Clear Error
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Conflict Resolution Section */}
      {/* Requirement 3.3: WHEN scheduling conflicts arise THEN the AI SHALL resolve conflicts automatically */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-red-400 mb-3">Conflict Resolution</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-900/30 p-3 rounded">
            <h5 className="font-medium text-red-300">Active Conflicts: {activeConflicts.length}</h5>
            <div className="space-y-2 mt-2">
              {activeConflicts.slice(0, 3).map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-2 bg-red-800/50 rounded cursor-pointer hover:bg-red-800/70"
                  onClick={() => {
                    setSelectedConflict(conflict)
                    setShowConflictDetails(true)
                  }}
                >
                  <div className="text-sm font-medium">{conflict.type}</div>
                  <div className="text-xs text-red-200">{conflict.description}</div>
                  <div className="text-xs text-red-300">Severity: {conflict.severity}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-green-900/30 p-3 rounded">
            <h5 className="font-medium text-green-300">Resolved: {resolvedConflicts.length}</h5>
            <div className="text-sm text-green-200">
              AI has successfully resolved {analytics.conflictsResolved} conflicts
            </div>
          </div>
        </div>
      </div>

      {/* Video Call Management Section */}
      {/* Requirement 3.5: IF executives join video calls THEN they SHALL do so autonomously */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-blue-400 mb-3">Video Call Management</h4>
        <div className="bg-blue-900/30 p-3 rounded">
          <h5 className="font-medium text-blue-300">Active Sessions: {activeVideoSessions.length}</h5>
          <div className="space-y-2 mt-2">
            {activeVideoSessions.map((session) => (
              <div
                key={session.id}
                className="p-2 bg-blue-800/50 rounded cursor-pointer hover:bg-blue-800/70"
                onClick={() => {
                  setSelectedSession(session)
                  setShowSessionDetails(true)
                }}
              >
                <div className="text-sm font-medium">{session.platform}</div>
                <div className="text-xs text-blue-200">Status: {session.status}</div>
                <div className="text-xs text-blue-300">Executives: {session.executives.length}</div>
              </div>
            ))}
            {activeVideoSessions.length === 0 && (
              <div className="text-sm text-blue-200">No active video calls</div>
            )}
          </div>
        </div>
      </div>

      {/* Action Items Management Section */}
      {/* Requirement 3.7: WHEN meetings conclude THEN executives SHALL handle automatic follow-ups */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-green-400 mb-3">Action Items Management</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-900/30 p-3 rounded">
            <h5 className="font-medium text-yellow-300">Pending: {pendingActionItems.length}</h5>
            <div className="space-y-2 mt-2">
              {pendingActionItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-yellow-800/50 rounded cursor-pointer hover:bg-yellow-800/70"
                  onClick={() => {
                    setSelectedActionItem(item)
                    setShowActionItemDetails(true)
                  }}
                >
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-yellow-200">Priority: {item.priority}</div>
                  <div className="text-xs text-yellow-300">Assigned: {item.assignedTo}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-green-900/30 p-3 rounded">
            <h5 className="font-medium text-green-300">Completed: {completedActionItems.length}</h5>
            <div className="text-sm text-green-200">
              {completedActionItems.length} action items completed
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-purple-400 mb-3">AI Performance Analytics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-purple-900/30 p-3 rounded text-center">
            <div className="text-2xl font-bold text-purple-300">{analytics.conflictsResolved}</div>
            <div className="text-sm text-purple-200">Conflicts Resolved</div>
          </div>
          <div className="bg-blue-900/30 p-3 rounded text-center">
            <div className="text-2xl font-bold text-blue-300">{(analytics.aiAccuracy * 100).toFixed(1)}%</div>
            <div className="text-sm text-blue-200">AI Accuracy</div>
          </div>
          <div className="bg-green-900/30 p-3 rounded text-center">
            <div className="text-2xl font-bold text-green-300">{(analytics.userSatisfaction * 100).toFixed(1)}%</div>
            <div className="text-sm text-green-200">User Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Modal Dialogs */}
      {showConflictDetails && selectedConflict && (
        <ConflictDetailsModal
          conflict={selectedConflict}
          onResolve={handleConflictResolution}
          onClose={() => {
            setShowConflictDetails(false)
            setSelectedConflict(null)
          }}
        />
      )}

      {showSessionDetails && selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onJoin={handleVideoCallJoin}
          onConclude={handleMeetingConclusion}
          onClose={() => {
            setShowSessionDetails(false)
            setSelectedSession(null)
          }}
        />
      )}

      {showActionItemDetails && selectedActionItem && (
        <ActionItemDetailsModal
          item={selectedActionItem}
          onUpdate={handleActionItemUpdate}
          onClose={() => {
            setShowActionItemDetails(false)
            setSelectedActionItem(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * Conflict Details Modal Component
 */
const ConflictDetailsModal: React.FC<{
  conflict: SchedulingConflict
  onResolve: () => void
  onClose: () => void
}> = ({ conflict, onResolve, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Conflict Details</h3>
        <div className="space-y-2 mb-4">
          <div><strong>Type:</strong> {conflict.type}</div>
          <div><strong>Severity:</strong> {conflict.severity}</div>
          <div><strong>Description:</strong> {conflict.description}</div>
          <div><strong>Events:</strong> {conflict.events.length}</div>
          <div><strong>Executives:</strong> {conflict.executives.length}</div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onResolve}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Resolve with AI
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Session Details Modal Component
 */
const SessionDetailsModal: React.FC<{
  session: VideoCallSession
  onJoin: () => void
  onConclude: () => void
  onClose: () => void
}> = ({ session, onJoin, onConclude, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Video Call Session</h3>
        <div className="space-y-2 mb-4">
          <div><strong>Platform:</strong> {session.platform}</div>
          <div><strong>Status:</strong> {session.status}</div>
          <div><strong>Executives:</strong> {session.executives.length}</div>
          {session.notes && <div><strong>Notes:</strong> Available</div>}
        </div>
        <div className="flex space-x-2">
          {session.status === 'scheduled' && (
            <button
              onClick={onJoin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Join Call
            </button>
          )}
          {session.status === 'active' && (
            <button
              onClick={onConclude}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
            >
              Conclude Meeting
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Action Item Details Modal Component
 */
const ActionItemDetailsModal: React.FC<{
  item: MeetingActionItem
  onUpdate: (id: string, status: 'pending' | 'in_progress' | 'completed') => void
  onClose: () => void
}> = ({ item, onUpdate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Action Item Details</h3>
        <div className="space-y-2 mb-4">
          <div><strong>Title:</strong> {item.title}</div>
          <div><strong>Description:</strong> {item.description}</div>
          <div><strong>Priority:</strong> {item.priority}</div>
          <div><strong>Status:</strong> {item.status}</div>
          <div><strong>Assigned:</strong> {item.assignedTo}</div>
          {item.dueDate && <div><strong>Due:</strong> {item.dueDate.toLocaleDateString()}</div>}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onUpdate(item.id, 'in_progress')}
            disabled={item.status === 'in_progress'}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded"
          >
            Start
          </button>
          <button
            onClick={() => onUpdate(item.id, 'completed')}
            disabled={item.status === 'completed'}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
          >
            Complete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AISchedulingControls 