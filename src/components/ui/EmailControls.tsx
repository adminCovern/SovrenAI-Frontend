'use client'

import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore'
import { useEmailComposition } from '../../hooks/useEmailComposition'
import { fetchEmails, fetchEmailsByExecutive } from '../../store/slices/emailSlice'

const EmailControls: React.FC = () => {
  const dispatch = useAppDispatch()
  const { simulateEmailComposition } = useEmailComposition()
  const executiveStates = useAppSelector(state => state.executives.states)
  const filteredExecutiveId = useAppSelector(state => state.email.filteredExecutiveId)
  
  const [selectedExecutive, setSelectedExecutive] = useState('ceo')
  const [emailSubject, setEmailSubject] = useState('Important update regarding our strategy')
  const [emailBody, setEmailBody] = useState('I wanted to share some thoughts on our current strategic direction. After analyzing the market trends and our competitive position, I believe we should focus more on AI-driven solutions for enterprise customers. This would allow us to leverage our core strengths while addressing the growing demand in this sector.')
  
  // Load emails
  const handleLoadEmails = () => {
    dispatch(fetchEmails('default-user'))
  }
  
  // Filter emails by executive
  const handleFilterByExecutive = (executiveId: string) => {
    dispatch(fetchEmailsByExecutive({ userId: 'default-user', executiveId }))
  }
  
  // Simulate email composition
  const handleSimulateComposition = () => {
    simulateEmailComposition(
      selectedExecutive,
      ['you@company.com'],
      emailSubject,
      emailBody,
      8000 // 8 seconds
    )
  }
  
  // Simulate high-stakes emails for testing approval workflow
  const handleSimulateHighStakesEmail = (type: string) => {
    let subject = ''
    let body = ''
    let recipients = ['board@company.com', 'legal@company.com']
    
    switch (type) {
      case 'contract':
        subject = 'URGENT: Contract Amendment Required - $2.5M Deal'
        body = 'We need to execute an amendment to the Acme Corp contract immediately. The deal value has increased to $2.5 million and includes additional intellectual property licensing terms. Please review the attached legal documents and authorize the signing. This is time-sensitive as the deadline is tomorrow.'
        break
      case 'acquisition':
        subject = 'Confidential: Strategic Acquisition Proposal'
        body = 'I have received a confidential proposal for acquiring TechStart Inc. for $15 million. This would give us access to their proprietary AI algorithms and expand our market presence significantly. The board needs to approve this investment before we can proceed with due diligence.'
        recipients = ['board@company.com', 'investors@company.com']
        break
      case 'legal':
        subject = 'Legal Notice: Potential Litigation Risk'
        body = 'Our legal counsel has advised that we may face litigation from a former employee regarding non-compete violations. The potential liability could reach $500,000 in damages plus legal fees. We need to authorize settlement negotiations immediately to avoid court proceedings.'
        recipients = ['legal@company.com', 'hr@company.com']
        break
      case 'financial':
        subject = 'Critical: Budget Authorization for Q4 Marketing Campaign'
        body = 'We need immediate approval for the Q4 marketing budget increase to $750,000. This investment is critical for our product launch and will directly impact our revenue targets. The campaign includes digital advertising, trade shows, and partnership agreements that require upfront payments.'
        recipients = ['cfo@company.com', 'marketing@agency.com']
        break
      default:
        subject = 'High-Stakes Email Test'
        body = 'This is a test email containing high-stakes keywords like contract, million dollars, urgent approval, and confidential information.'
    }
    
    simulateEmailComposition(
      selectedExecutive,
      recipients,
      subject,
      body,
      6000 // 6 seconds
    )
  }
  
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 10, 30, 0.8)',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #4d7cff60',
      boxShadow: '0 0 15px #4d7cff40',
      color: '#ffffff',
      width: '300px',
      zIndex: 100
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0', 
        color: '#4d7cff',
        borderBottom: '1px solid #4d7cff40',
        paddingBottom: '5px'
      }}>
        Email Controls
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={handleLoadEmails}
          style={{
            backgroundColor: '#4d7cff',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          Load All Emails
        </button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#4d7cff' }}>Filter by Executive</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {executiveStates.map(state => (
            <button
              key={state.executive.id}
              onClick={() => handleFilterByExecutive(state.executive.id)}
              style={{
                backgroundColor: filteredExecutiveId === state.executive.id ? '#4d7cff' : 'rgba(77, 124, 255, 0.2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {state.executive.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#4d7cff' }}>Simulate Email Composition</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
            Executive:
          </label>
          <select
            value={selectedExecutive}
            onChange={(e) => setSelectedExecutive(e.target.value)}
            style={{
              backgroundColor: 'rgba(77, 124, 255, 0.2)',
              color: '#ffffff',
              border: '1px solid #4d7cff60',
              borderRadius: '4px',
              padding: '5px',
              width: '100%'
            }}
          >
            {executiveStates.map(state => (
              <option key={state.executive.id} value={state.executive.id}>
                {state.executive.name} ({state.executive.role})
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
            Subject:
          </label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            style={{
              backgroundColor: 'rgba(77, 124, 255, 0.2)',
              color: '#ffffff',
              border: '1px solid #4d7cff60',
              borderRadius: '4px',
              padding: '5px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>
            Body:
          </label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={4}
            style={{
              backgroundColor: 'rgba(77, 124, 255, 0.2)',
              color: '#ffffff',
              border: '1px solid #4d7cff60',
              borderRadius: '4px',
              padding: '5px',
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>
        
        <button
          onClick={handleSimulateComposition}
          style={{
            backgroundColor: '#00aaff',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            width: '100%',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          Simulate Composition
        </button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#ff6622' }}>Test High-Stakes Emails</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          <button
            onClick={() => handleSimulateHighStakesEmail('contract')}
            style={{
              backgroundColor: '#ff6622',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Contract ($2.5M)
          </button>
          
          <button
            onClick={() => handleSimulateHighStakesEmail('acquisition')}
            style={{
              backgroundColor: '#ff2222',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Acquisition ($15M)
          </button>
          
          <button
            onClick={() => handleSimulateHighStakesEmail('legal')}
            style={{
              backgroundColor: '#ff4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Legal Risk
          </button>
          
          <button
            onClick={() => handleSimulateHighStakesEmail('financial')}
            style={{
              backgroundColor: '#ff8822',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Budget ($750K)
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailControls