'use client'

import React, { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppStore'
import { 
  fetchPendingApprovals, 
  approveRequest, 
  rejectRequest, 
  clearError 
} from '../../store/slices/approvalSlice'
import { ApprovalRequest } from '../../types'

interface ApprovalInterfaceProps {
  className?: string
}

const ApprovalInterface: React.FC<ApprovalInterfaceProps> = ({ className }) => {
  const dispatch = useAppDispatch()
  const { pendingApprovals, isLoading, error } = useAppSelector(state => state.approvals || { 
    pendingApprovals: [], 
    isLoading: false, 
    error: null 
  })
  
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Fetch pending approvals on mount
  useEffect(() => {
    dispatch(fetchPendingApprovals())
  }, [dispatch])
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])
  
  const handleApprove = async (approvalId: string) => {
    try {
      await dispatch(approveRequest(approvalId)).unwrap()
      setSelectedApproval(null)
      setShowDetails(false)
    } catch (err) {
      console.error('Failed to approve request:', err)
    }
  }
  
  const handleReject = async (approvalId: string) => {
    try {
      await dispatch(rejectRequest(approvalId)).unwrap()
      setSelectedApproval(null)
      setShowDetails(false)
    } catch (err) {
      console.error('Failed to reject request:', err)
    }
  }
  
  const handleShowDetails = (approval: ApprovalRequest) => {
    setSelectedApproval(approval)
    setShowDetails(true)
  }
  
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '#ff2222'
      case 'high': return '#ff6622'
      case 'medium': return '#ffaa22'
      default: return '#4d7cff'
    }
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }
  
  if (pendingApprovals.length === 0 && !isLoading) {
    return null // Don't render if no approvals
  }
  
  return (
    <div className={`approval-interface ${className || ''}`} style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '350px',
      maxHeight: '80vh',
      backgroundColor: 'rgba(0, 10, 30, 0.95)',
      border: '1px solid #4d7cff',
      borderRadius: '8px',
      boxShadow: '0 0 20px rgba(77, 124, 255, 0.3)',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #4d7cff',
        backgroundColor: 'rgba(77, 124, 255, 0.1)'
      }}>
        <h3 style={{
          margin: 0,
          color: '#4d7cff',
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          Pending Approvals
          {pendingApprovals.length > 0 && (
            <span style={{
              backgroundColor: '#ff4444',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {pendingApprovals.length}
            </span>
          )}
        </h3>
      </div>
      
      {/* Error display */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid #ff4444',
          margin: '10px',
          borderRadius: '4px',
          color: '#ff4444',
          fontSize: '12px'
        }}>
          Error: {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#4d7cff'
        }}>
          Loading approvals...
        </div>
      )}
      
      {/* Approval list */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '10px'
      }}>
        {pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${getRiskColor(approval.riskLevel)}`,
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleShowDetails(approval)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(77, 124, 255, 0.1)'
              e.currentTarget.style.transform = 'translateX(2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            {/* Risk level badge */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                backgroundColor: getRiskColor(approval.riskLevel),
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {approval.riskLevel}
              </span>
              <span style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {formatCurrency(approval.estimatedValue)}
              </span>
            </div>
            
            {/* Action description */}
            <div style={{
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              {approval.action.description}
            </div>
            
            {/* Executive info */}
            <div style={{
              color: '#cccccc',
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              Executive: {approval.executive.name} ({approval.executive.role})
            </div>
            
            {/* Email details for email approvals */}
            {approval.action.type === 'email_send' && approval.visualRepresentation.content.type === 'email_approval' && (
              <div style={{
                fontSize: '11px',
                color: '#aaaaaa',
                marginBottom: '8px'
              }}>
                <div><strong>To:</strong> {approval.visualRepresentation.content.draft.to.join(', ')}</div>
                <div style={{ 
                  marginTop: '4px',
                  maxHeight: '40px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {approval.visualRepresentation.content.draft.body}
                </div>
              </div>
            )}
            
            {/* Quick action buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleReject(approval.id)
                }}
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff6666'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff4444'
                }}
              >
                REJECT
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleApprove(approval.id)
                }}
                style={{
                  backgroundColor: '#44ff44',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#66ff66'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#44ff44'
                }}
              >
                APPROVE
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Detailed view modal */}
      {showDetails && selectedApproval && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 10, 30, 0.98)',
            border: `2px solid ${getRiskColor(selectedApproval.riskLevel)}`,
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: `0 0 30px ${getRiskColor(selectedApproval.riskLevel)}60`
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: `1px solid ${getRiskColor(selectedApproval.riskLevel)}`
            }}>
              <h2 style={{
                margin: 0,
                color: getRiskColor(selectedApproval.riskLevel),
                fontSize: '18px'
              }}>
                Approval Details
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Detailed content */}
            <div style={{ color: '#ffffff' }}>
              <div style={{ marginBottom: '15px' }}>
                <strong>Action:</strong> {selectedApproval.action.description}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Executive:</strong> {selectedApproval.executive.name} ({selectedApproval.executive.role})
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Estimated Value:</strong> {formatCurrency(selectedApproval.estimatedValue)}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Risk Level:</strong> 
                <span style={{
                  backgroundColor: getRiskColor(selectedApproval.riskLevel),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  marginLeft: '8px'
                }}>
                  {selectedApproval.riskLevel}
                </span>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Business Impact:</strong> {selectedApproval.context.businessImpact}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Timeline:</strong> {selectedApproval.context.timeline}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <strong>Stakeholders:</strong> {selectedApproval.context.stakeholders.join(', ')}
              </div>
              
              {/* Email specific details */}
              {selectedApproval.action.type === 'email_send' && selectedApproval.visualRepresentation.content.type === 'email_approval' && (
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#4d7cff' }}>Email Details</h4>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>From:</strong> {selectedApproval.visualRepresentation.content.draft.from}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>To:</strong> {selectedApproval.visualRepresentation.content.draft.to.join(', ')}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Subject:</strong> {selectedApproval.visualRepresentation.content.draft.subject}
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '10px',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    fontSize: '12px',
                    lineHeight: '1.4'
                  }}>
                    {selectedApproval.visualRepresentation.content.draft.body}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => handleReject(selectedApproval.id)}
                  style={{
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minWidth: '100px'
                  }}
                >
                  REJECT
                </button>
                
                <button
                  onClick={() => handleApprove(selectedApproval.id)}
                  style={{
                    backgroundColor: '#44ff44',
                    color: 'black',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minWidth: '100px'
                  }}
                >
                  APPROVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalInterface