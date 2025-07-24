import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useAppStore';
import { 
  fetchPendingApprovals, 
  approveRequest, 
  rejectRequest 
} from '../store/slices/approvalSlice';
import { EmailApprovalService } from '../services/EmailApprovalService';

/**
 * Hook for managing email approvals
 */
export const useEmailApproval = () => {
  const dispatch = useAppDispatch();
  const pendingApprovals = useAppSelector(state => state.approvals?.pendingApprovals || []);
  const isLoading = useAppSelector(state => state.approvals?.isLoading || false);
  const error = useAppSelector(state => state.approvals?.error || null);
  
  // Load pending approvals on mount
  useEffect(() => {
    dispatch(fetchPendingApprovals());
    
    // Poll for new approvals every 5 seconds
    const interval = setInterval(() => {
      dispatch(fetchPendingApprovals());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dispatch]);
  
  /**
   * Approve an email request
   * @param approvalId The ID of the approval request
   */
  const handleApprove = (approvalId: string) => {
    dispatch(approveRequest(approvalId));
  };
  
  /**
   * Reject an email request
   * @param approvalId The ID of the approval request
   */
  const handleReject = (approvalId: string) => {
    dispatch(rejectRequest(approvalId));
  };
  
  /**
   * Check if an email requires approval based on content
   * @param subject Email subject
   * @param body Email body
   * @returns Object containing detection results
   */
  const checkEmailRequiresApproval = (subject: string, body: string) => {
    const approvalService = EmailApprovalService.getInstance();
    const mockDraft = {
      id: 'temp-draft',
      from: 'user@example.com',
      to: ['recipient@example.com'],
      subject,
      body,
      executiveId: 'user'
    };
    
    return approvalService.detectHighStakesEmail(mockDraft);
  };
  
  return {
    pendingApprovals,
    isLoading,
    error,
    handleApprove,
    handleReject,
    checkEmailRequiresApproval
  };
};