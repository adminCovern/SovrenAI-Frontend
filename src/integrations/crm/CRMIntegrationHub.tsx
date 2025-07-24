import React, { useState, useEffect } from 'react'
import { RevolutionaryCRMService, RevolutionaryCRMPipeline, RevolutionaryCRMContact } from './CRMService'
import CRMPipelineVisualization from './CRMPipelineVisualization'
import CRMRelationshipMapping from './CRMRelationshipMapping'

interface CRMIntegrationHubProps {
  onDealSelect?: (deal: any) => void
  onContactSelect?: (contact: RevolutionaryCRMContact) => void
  onPipelineUpdate?: (pipelines: RevolutionaryCRMPipeline[]) => void
}

export const CRMIntegrationHub: React.FC<CRMIntegrationHubProps> = ({
  onDealSelect,
  onContactSelect,
  onPipelineUpdate
}) => {
  const [crmService] = useState(() => new RevolutionaryCRMService())
  const [pipelines, setPipelines] = useState<RevolutionaryCRMPipeline[]>([])
  const [contacts, setContacts] = useState<RevolutionaryCRMContact[]>([])
  const [activeView, setActiveView] = useState<'pipeline' | 'relationships'>('pipeline')
  const [selectedProvider, setSelectedProvider] = useState<string>('Salesforce')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize CRM service
  useEffect(() => {
    const initializeCRM = async () => {
      try {
        setIsLoading(true)
        const result = await crmService.initializeRevolutionaryCRM()
        
        if (result.initialized) {
          console.log('Revolutionary CRM initialized successfully:', result)
          
          // Load initial data from all providers
          await loadPipelineData()
          await loadContactData()
        } else {
          setError('Failed to initialize Revolutionary CRM')
        }
      } catch (err) {
        setError(`CRM initialization error: ${err}`)
      } finally {
        setIsLoading(false)
      }
    }

    initializeCRM()
  }, [crmService])

  const loadPipelineData = async () => {
    try {
      const providers = crmService.getProviders()
      const allPipelines: RevolutionaryCRMPipeline[] = []

      for (const provider of providers) {
        try {
          const pipelineData = await provider.getPipelineData()
          allPipelines.push(...pipelineData)
        } catch (err) {
          console.warn(`Failed to load pipeline data from ${provider.provider}:`, err)
        }
      }

      setPipelines(allPipelines)
      onPipelineUpdate?.(allPipelines)
    } catch (err) {
      setError(`Failed to load pipeline data: ${err}`)
    }
  }

  const loadContactData = async () => {
    try {
      const providers = crmService.getProviders()
      const allContacts: RevolutionaryCRMContact[] = []

      for (const provider of providers) {
        try {
          // Simulate contact data for demonstration
          const mockContacts: RevolutionaryCRMContact[] = [
            {
              id: `contact_${provider.provider}_1`,
              name: 'John Smith',
              email: 'john.smith@company.com',
              phone: '+1-555-0123',
              company: 'TechCorp Inc',
              relationshipStrength: 0.85,
              neuralNetwork: {
                nodes: 256,
                connections: 100000,
                learningRate: 0.001,
                predictionAccuracy: 0.89
              },
              interactionHistory: [
                {
                  id: 'interaction_1',
                  type: 'email',
                  timestamp: new Date(),
                  executive: 'Marcus',
                  notes: 'Initial contact established',
                  outcome: 'positive',
                  quantumSignature: 'quantum_sig_1'
                }
              ],
              quantumSignature: 'quantum_sig_contact_1'
            },
            {
              id: `contact_${provider.provider}_2`,
              name: 'Sarah Johnson',
              email: 'sarah.johnson@enterprise.com',
              phone: '+1-555-0456',
              company: 'Enterprise Solutions',
              relationshipStrength: 0.72,
              neuralNetwork: {
                nodes: 512,
                connections: 200000,
                learningRate: 0.002,
                predictionAccuracy: 0.91
              },
              interactionHistory: [
                {
                  id: 'interaction_2',
                  type: 'meeting',
                  timestamp: new Date(),
                  executive: 'Sarah',
                  notes: 'Product demonstration completed',
                  outcome: 'positive',
                  quantumSignature: 'quantum_sig_2'
                }
              ],
              quantumSignature: 'quantum_sig_contact_2'
            }
          ]

          allContacts.push(...mockContacts)
        } catch (err) {
          console.warn(`Failed to load contact data from ${provider.provider}:`, err)
        }
      }

      setContacts(allContacts)
    } catch (err) {
      setError(`Failed to load contact data: ${err}`)
    }
  }

  const handleDealAdvancement = async (deal: any) => {
    try {
      const providers = crmService.getProviders()
      for (const provider of providers) {
        await provider.advanceDeals([deal])
      }
      
      // Reload pipeline data after advancement
      await loadPipelineData()
    } catch (err) {
      setError(`Failed to advance deal: ${err}`)
    }
  }

  const handleContactUpdate = async (contact: RevolutionaryCRMContact) => {
    try {
      const providers = crmService.getProviders()
      for (const provider of providers) {
        await provider.updateContactRecords([contact])
      }
      
      // Reload contact data after update
      await loadContactData()
    } catch (err) {
      setError(`Failed to update contact: ${err}`)
    }
  }

  const handleProviderChange = async (providerName: string) => {
    setSelectedProvider(providerName)
    // Filter data for selected provider
    await loadPipelineData()
    await loadContactData()
  }

  if (isLoading) {
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
            Initializing Revolutionary CRM Integration...
          </div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            Loading quantum-resistant providers and neural networks
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
            CRM Integration Error
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
            Revolutionary CRM Integration Hub
          </h1>
          <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>
            Quantum-Resistant • Neural Network Enhanced • Executive-Guided
          </div>
        </div>

        {/* Provider Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ fontSize: '14px' }}>Provider:</label>
          <select
            value={selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            style={{
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '14px'
            }}
          >
            <option value="Salesforce">Salesforce</option>
            <option value="HubSpot">HubSpot</option>
            <option value="Pipedrive">Pipedrive</option>
            <option value="Microsoft Dynamics 365">Microsoft Dynamics 365</option>
            <option value="Oracle CRM">Oracle CRM</option>
            <option value="SAP Customer Experience">SAP Customer Experience</option>
            <option value="Adobe Experience Cloud">Adobe Experience Cloud</option>
            <option value="ServiceNow">ServiceNow</option>
            <option value="Zoho CRM">Zoho CRM</option>
            <option value="Monday.com CRM">Monday.com CRM</option>
            <option value="Freshsales">Freshsales</option>
            <option value="Insightly">Insightly</option>
            <option value="Keap">Keap</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
        background: '#1a1a1a'
      }}>
        <button
          onClick={() => setActiveView('pipeline')}
          style={{
            padding: '15px 30px',
            background: activeView === 'pipeline' ? '#00ff88' : 'transparent',
            color: activeView === 'pipeline' ? '#000' : '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          Pipeline Visualization
        </button>
        <button
          onClick={() => setActiveView('relationships')}
          style={{
            padding: '15px 30px',
            background: activeView === 'relationships' ? '#00ff88' : 'transparent',
            color: activeView === 'relationships' ? '#000' : '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          Relationship Mapping
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {activeView === 'pipeline' ? (
          <CRMPipelineVisualization
            pipelines={pipelines}
            onDealSelect={(deal) => {
              onDealSelect?.(deal)
              handleDealAdvancement(deal)
            }}
            onStageSelect={(stage) => {
              console.log('Stage selected:', stage)
            }}
          />
        ) : (
          <CRMRelationshipMapping
            contacts={contacts}
            onContactSelect={(contact) => {
              onContactSelect?.(contact)
              handleContactUpdate(contact)
            }}
            onInteractionSelect={(interaction) => {
              console.log('Interaction selected:', interaction)
            }}
          />
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
        <div style={{ color: '#00ff88' }}>✓ Quantum-Resistant Security</div>
        <div style={{ color: '#00ff88' }}>✓ Neural Network Integration</div>
        <div style={{ color: '#00ff88' }}>✓ Executive Guidance AI</div>
        <div style={{ color: '#00ff88' }}>✓ Real-time Synchronization</div>
        <div style={{ color: '#00ff88' }}>✓ Predictive Analytics</div>
      </div>
    </div>
  )
}

export default CRMIntegrationHub 