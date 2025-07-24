import React, { useState, useEffect } from 'react'
import { RevolutionaryVoiceSystemService, CallData, CallRoutingDecision } from './VoiceSystemService'

interface CallRoutingManagerProps {
  voiceService: RevolutionaryVoiceSystemService
  onCallRouted?: (decision: CallRoutingDecision) => void
  onCallTransferred?: (callId: string, fromExecutive: string, toExecutive: string) => void
  onConferenceCreated?: (conferenceId: string, participants: string[]) => void
}

interface ExecutiveAvailability {
  executive: string
  available: boolean
  currentCalls: number
  maxCalls: number
  skills: string[]
  performance: number
}

interface ConferenceCall {
  id: string
  participants: string[]
  startTime: Date
  duration: number
  status: 'active' | 'ended'
  recordingUrl?: string
  transcription?: string
}

export const CallRoutingManager: React.FC<CallRoutingManagerProps> = ({
  voiceService,
  onCallRouted,
  onCallTransferred,
  onConferenceCreated
}) => {
  const [executiveAvailability, setExecutiveAvailability] = useState<ExecutiveAvailability[]>([])
  const [conferenceCalls, setConferenceCalls] = useState<ConferenceCall[]>([])
  const [routingHistory, setRoutingHistory] = useState<CallRoutingDecision[]>([])
  const [selectedExecutive, setSelectedExecutive] = useState<string | null>(null)

  const executives = ['Marcus', 'Sarah', 'David', 'Emily', 'James', 'Lisa', 'Michael', 'Rachel']

  useEffect(() => {
    // Initialize executive availability
    const availability: ExecutiveAvailability[] = executives.map(executive => ({
      executive,
      available: true,
      currentCalls: 0,
      maxCalls: 2,
      skills: getExecutiveSkills(executive),
      performance: Math.random() * 0.3 + 0.7 // 70-100% performance
    }))
    setExecutiveAvailability(availability)

    // Set up interval to update availability
    const interval = setInterval(updateExecutiveAvailability, 5000)
    return () => clearInterval(interval)
  }, [])

  const getExecutiveSkills = (executive: string): string[] => {
    const skillsMap: { [key: string]: string[] } = {
      'Marcus': ['sales', 'negotiation', 'enterprise'],
      'Sarah': ['technical', 'support', 'implementation'],
      'David': ['finance', 'pricing', 'contracts'],
      'Emily': ['marketing', 'partnerships', 'growth'],
      'James': ['operations', 'logistics', 'efficiency'],
      'Lisa': ['customer_success', 'onboarding', 'retention'],
      'Michael': ['product', 'development', 'innovation'],
      'Rachel': ['strategy', 'consulting', 'transformation']
    }
    return skillsMap[executive] || ['general']
  }

  const updateExecutiveAvailability = () => {
    const activeCalls = voiceService.getActiveCalls()
    
    setExecutiveAvailability(prev => prev.map(exec => ({
      ...exec,
      currentCalls: activeCalls.filter(call => call.executive === exec.executive).length,
      available: activeCalls.filter(call => call.executive === exec.executive).length < exec.maxCalls
    })))
  }

  const handleIncomingCall = async (callData: { from: string; to: string; context?: string }) => {
    try {
      // Route the call using the voice service
      const routingDecision = await voiceService.routeIncomingCall(callData)
      
      // Update routing history
      setRoutingHistory(prev => [routingDecision, ...prev.slice(0, 9)]) // Keep last 10
      
      // Update executive availability
      updateExecutiveAvailability()
      
      // Notify parent component
      onCallRouted?.(routingDecision)
      
      console.log('Call routed successfully:', routingDecision)
    } catch (error) {
      console.error('Failed to route incoming call:', error)
    }
  }

  const handleCallTransfer = async (callId: string, toExecutive: string) => {
    try {
      const call = voiceService.getActiveCalls().find(c => c.id === callId)
      if (!call) {
        throw new Error('Call not found')
      }

      const fromExecutive = call.executive
      const success = await voiceService.transferCall(callId, toExecutive)
      
      if (success) {
        // Update executive availability
        updateExecutiveAvailability()
        
        // Notify parent component
        onCallTransferred?.(callId, fromExecutive, toExecutive)
        
        console.log(`Call ${callId} transferred from ${fromExecutive} to ${toExecutive}`)
      }
    } catch (error) {
      console.error('Failed to transfer call:', error)
    }
  }

  const createConferenceCall = async (participants: string[]) => {
    try {
      const conferenceId = `conference_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const conference: ConferenceCall = {
        id: conferenceId,
        participants,
        startTime: new Date(),
        duration: 0,
        status: 'active'
      }
      
      setConferenceCalls(prev => [...prev, conference])
      
      // Notify parent component
      onConferenceCreated?.(conferenceId, participants)
      
      console.log('Conference call created:', conference)
      
      return conferenceId
    } catch (error) {
      console.error('Failed to create conference call:', error)
      throw error
    }
  }

  const endConferenceCall = (conferenceId: string) => {
    setConferenceCalls(prev => prev.map(conf => 
      conf.id === conferenceId 
        ? { ...conf, status: 'ended', duration: Date.now() - conf.startTime.getTime() }
        : conf
    ))
  }

  const getOptimalExecutive = (callContext: string): string => {
    // AI-based executive selection based on context and availability
    const availableExecutives = executiveAvailability.filter(exec => exec.available)
    
    if (availableExecutives.length === 0) {
      return executives[0] // Fallback
    }
    
    // Score executives based on context match and performance
    const scoredExecutives = availableExecutives.map(exec => {
      const contextMatch = exec.skills.some(skill => 
        callContext.toLowerCase().includes(skill.toLowerCase())
      ) ? 1.0 : 0.3
      
      const performanceScore = exec.performance
      const availabilityScore = 1 - (exec.currentCalls / exec.maxCalls)
      
      const totalScore = (contextMatch * 0.5) + (performanceScore * 0.3) + (availabilityScore * 0.2)
      
      return {
        executive: exec.executive,
        score: totalScore
      }
    })
    
    // Return highest scoring executive
    scoredExecutives.sort((a, b) => b.score - a.score)
    return scoredExecutives[0].executive
  }

  const getExecutivePerformance = (executive: string): number => {
    const exec = executiveAvailability.find(e => e.executive === executive)
    return exec?.performance || 0
  }

  const getCallVolume = (executive: string): number => {
    const activeCalls = voiceService.getActiveCalls()
    return activeCalls.filter(call => call.executive === executive).length
  }

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: 'white',
      height: '100vh',
      overflowY: 'auto'
    }}>
      <h2 style={{ 
        marginBottom: '20px',
        background: 'linear-gradient(45deg, #00ff88, #00ccff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Revolutionary Call Routing Manager
      </h2>

      {/* Executive Availability Grid */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Executive Availability & Performance</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginTop: '15px'
        }}>
          {executiveAvailability.map(exec => (
            <div
              key={exec.executive}
              style={{
                background: exec.available ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 102, 102, 0.1)',
                border: `2px solid ${exec.available ? '#00ff88' : '#ff6666'}`,
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setSelectedExecutive(exec.executive)}
            >
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
                {exec.executive}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                Status: {exec.available ? 'Available' : 'Busy'}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                Calls: {exec.currentCalls}/{exec.maxCalls}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                Performance: {(exec.performance * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Skills: {exec.skills.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call Routing History */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Recent Routing Decisions</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {routingHistory.map((decision, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #333',
                borderRadius: '4px',
                padding: '10px',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {decision.executive} ({(decision.confidence * 100).toFixed(1)}% confidence)
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Reasoning: {decision.reasoning}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Revenue Impact: ${decision.neuralPrediction.revenueImpact.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conference Call Management */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Conference Calls</h3>
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => createConferenceCall(['Marcus', 'Sarah', 'David'])}
            style={{
              background: '#00ff88',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Create Conference Call
          </button>
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {conferenceCalls.map(conference => (
            <div
              key={conference.id}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #333',
                borderRadius: '4px',
                padding: '10px',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                Conference {conference.id}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Participants: {conference.participants.join(', ')}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Status: {conference.status}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Duration: {Math.floor(conference.duration / 1000)}s
              </div>
              {conference.status === 'active' && (
                <button
                  onClick={() => endConferenceCall(conference.id)}
                  style={{
                    background: '#ff6666',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}
                >
                  End Conference
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Routing Insights */}
      <div style={{ marginBottom: '30px' }}>
        <h3>AI Routing Insights</h3>
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Optimal Executive Selection:</strong> AI analyzes call context, executive skills, and availability
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Performance Optimization:</strong> Routes calls to executives with highest success rates
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Load Balancing:</strong> Distributes calls evenly across available executives
          </div>
          <div>
            <strong>Neural Prediction:</strong> Predicts call outcomes and revenue impact in real-time
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3>Quick Actions</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          <button
            onClick={() => handleIncomingCall({ from: '+1-555-0123', to: '+1-555-0456', context: 'sales_inquiry' })}
            style={{
              background: '#0066cc',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Simulate Incoming Call
          </button>
          <button
            onClick={() => createConferenceCall(['Marcus', 'Sarah'])}
            style={{
              background: '#cc6600',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create 2-Person Conference
          </button>
          <button
            onClick={() => updateExecutiveAvailability()}
            style={{
              background: '#66cc00',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Availability
          </button>
        </div>
      </div>

      {/* Selected Executive Details */}
      {selectedExecutive && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.95)',
          border: '2px solid #00ff88',
          borderRadius: '8px',
          padding: '20px',
          zIndex: 1000,
          minWidth: '300px'
        }}>
          <h3>{selectedExecutive} - Executive Details</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Performance:</strong> {(getExecutivePerformance(selectedExecutive) * 100).toFixed(1)}%
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Current Calls:</strong> {getCallVolume(selectedExecutive)}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Skills:</strong> {getExecutiveSkills(selectedExecutive).join(', ')}
          </div>
          <button
            onClick={() => setSelectedExecutive(null)}
            style={{
              background: '#ff6666',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export default CallRoutingManager 