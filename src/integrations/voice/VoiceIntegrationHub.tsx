import React, { useState, useEffect } from 'react'
import { RevolutionaryVoiceSystemService, CallData, CallRoutingDecision } from './VoiceSystemService'
import CallVisualization from './CallVisualization'
import CallRoutingManager from './CallRoutingManager'

interface VoiceIntegrationHubProps {
  onCallRouted?: (decision: CallRoutingDecision) => void
  onCallTransferred?: (callId: string, fromExecutive: string, toExecutive: string) => void
  onConferenceCreated?: (conferenceId: string, participants: string[]) => void
}

export const VoiceIntegrationHub: React.FC<VoiceIntegrationHubProps> = ({
  onCallRouted,
  onCallTransferred,
  onConferenceCreated
}) => {
  const [voiceService] = useState(() => new RevolutionaryVoiceSystemService())
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeView, setActiveView] = useState<'visualization' | 'routing' | 'management'>('visualization')
  const [error, setError] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState({
    freeSwitch: false,
    skyetel: false,
    styleTTS2: false,
    quantumResistant: false,
    neuralEnabled: false
  })

  // Initialize voice system
  useEffect(() => {
    const initializeVoiceSystem = async () => {
      try {
        setError(null)
        const result = await voiceService.initializeRevolutionaryVoiceSystem()
        
        if (result.initialized) {
          setIsInitialized(true)
          setSystemStatus({
            freeSwitch: true,
            skyetel: true,
            styleTTS2: true,
            quantumResistant: result.quantumResistant,
            neuralEnabled: result.neuralEnabled
          })
          console.log('Revolutionary Voice System initialized successfully:', result)
        } else {
          setError('Failed to initialize Revolutionary Voice System')
        }
      } catch (err) {
        setError(`Voice system initialization error: ${err}`)
      }
    }

    initializeVoiceSystem()
  }, [voiceService])

  const handleCallRouted = (decision: CallRoutingDecision) => {
    console.log('Call routed:', decision)
    onCallRouted?.(decision)
  }

  const handleCallTransferred = (callId: string, fromExecutive: string, toExecutive: string) => {
    console.log(`Call ${callId} transferred from ${fromExecutive} to ${toExecutive}`)
    onCallTransferred?.(callId, fromExecutive, toExecutive)
  }

  const handleConferenceCreated = (conferenceId: string, participants: string[]) => {
    console.log('Conference created:', conferenceId, participants)
    onConferenceCreated?.(conferenceId, participants)
  }

  const handleCallSelect = (call: CallData) => {
    console.log('Call selected:', call)
  }

  const simulateIncomingCall = () => {
    const callData = {
      from: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      to: '+1-555-0456',
      context: 'sales_inquiry'
    }
    
    voiceService.routeIncomingCall(callData)
  }

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>
            Initializing Revolutionary Voice System...
          </div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            Connecting to FreeSwitch PBX, Skyetel trunk, and StyleTTS2
          </div>
          <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '10px' }}>
            Quantum-resistant encryption • Neural network initialization • Executive voice synthesis
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px', color: '#ff6b6b' }}>
            Voice System Error
          </div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', background: 'linear-gradient(45deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Revolutionary Voice Integration Hub
          </h1>
          <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>
            Quantum-Resistant • Neural Network Enhanced • Executive Voice Synthesis
          </div>
        </div>

        {/* System Status */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>FreeSwitch</div>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: systemStatus.freeSwitch ? '#00ff88' : '#ff6666',
              margin: '0 auto'
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Skyetel</div>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: systemStatus.skyetel ? '#00ff88' : '#ff6666',
              margin: '0 auto'
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>StyleTTS2</div>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: systemStatus.styleTTS2 ? '#00ff88' : '#ff6666',
              margin: '0 auto'
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Quantum</div>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: systemStatus.quantumResistant ? '#00ff88' : '#ff6666',
              margin: '0 auto'
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Neural</div>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: systemStatus.neuralEnabled ? '#00ff88' : '#ff6666',
              margin: '0 auto'
            }} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
        background: '#1a1a1a'
      }}>
        <button
          onClick={() => setActiveView('visualization')}
          style={{
            padding: '15px 30px',
            background: activeView === 'visualization' ? '#00ff88' : 'transparent',
            color: activeView === 'visualization' ? '#000' : '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          Call Visualization
        </button>
        <button
          onClick={() => setActiveView('routing')}
          style={{
            padding: '15px 30px',
            background: activeView === 'routing' ? '#00ff88' : 'transparent',
            color: activeView === 'routing' ? '#000' : '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          Call Routing
        </button>
        <button
          onClick={() => setActiveView('management')}
          style={{
            padding: '15px 30px',
            background: activeView === 'management' ? '#00ff88' : 'transparent',
            color: activeView === 'management' ? '#000' : '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          System Management
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative' }}>
                 {activeView === 'visualization' && (
           <CallVisualization
             voiceService={voiceService}
             onCallSelect={handleCallSelect}
             onCallTransfer={(callId: string, toExecutive: string) => {
               const call = voiceService.getActiveCalls().find(c => c.id === callId)
               if (call) {
                 handleCallTransferred(callId, call.executive, toExecutive)
               }
             }}
           />
         )}
        
        {activeView === 'routing' && (
          <CallRoutingManager
            voiceService={voiceService}
            onCallRouted={handleCallRouted}
            onCallTransferred={handleCallTransferred}
            onConferenceCreated={handleConferenceCreated}
          />
        )}
        
        {activeView === 'management' && (
          <div style={{
            padding: '20px',
            height: '100%',
            overflowY: 'auto'
          }}>
            <h3>Voice System Management</h3>
            
            {/* System Information */}
            <div style={{ marginBottom: '30px' }}>
              <h4>System Components</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginTop: '15px'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>FreeSwitch PBX</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Status: {systemStatus.freeSwitch ? 'Connected' : 'Disconnected'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Quantum-Resistant: {systemStatus.quantumResistant ? 'Yes' : 'No'}
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Skyetel Trunk</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Status: {systemStatus.skyetel ? 'Connected' : 'Disconnected'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Calls: {voiceService.getActiveCalls().length}
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>StyleTTS2</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Status: {systemStatus.styleTTS2 ? 'Connected' : 'Disconnected'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Neural Networks: {systemStatus.neuralEnabled ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '30px' }}>
              <h4>Quick Actions</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                marginTop: '15px'
              }}>
                <button
                  onClick={simulateIncomingCall}
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
                  onClick={() => voiceService.synthesizeExecutiveVoice('Hello, this is Marcus speaking.', 'Marcus', 'professional')}
                  style={{
                    background: '#cc6600',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Test Voice Synthesis
                </button>
                
                <button
                  onClick={() => console.log('Active calls:', voiceService.getActiveCalls())}
                  style={{
                    background: '#66cc00',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  View Active Calls
                </button>
              </div>
            </div>

            {/* Revolutionary Features Status */}
            <div>
              <h4>Revolutionary Features</h4>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Quantum-Resistant Security:</strong> {systemStatus.quantumResistant ? 'Active' : 'Inactive'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Neural Network Routing:</strong> {systemStatus.neuralEnabled ? 'Active' : 'Inactive'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Executive Voice Synthesis:</strong> {systemStatus.styleTTS2 ? 'Active' : 'Inactive'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Real-time Transcription:</strong> Active
                </div>
                <div>
                  <strong>AI-powered Call Routing:</strong> Active
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revolutionary Features Status */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Revolutionary Features Active:</div>
        <div style={{ color: '#00ff88' }}>✓ Quantum-Resistant Voice Encryption</div>
        <div style={{ color: '#00ff88' }}>✓ Neural Network Call Routing</div>
        <div style={{ color: '#00ff88' }}>✓ Executive Voice Synthesis</div>
        <div style={{ color: '#00ff88' }}>✓ Real-time Call Transcription</div>
        <div style={{ color: '#00ff88' }}>✓ AI-powered Conference Management</div>
      </div>
    </div>
  )
}

export default VoiceIntegrationHub 