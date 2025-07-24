import { useEffect, useCallback } from 'react';
import { useAppDispatch } from './useAppStore';
import { EmailService } from '../integrations/email/EmailService';
import { EmailDraft } from '../types';
import { setActiveComposition, updateEmailDraft } from '../store/slices/emailSlice';

/**
 * Hook for managing real-time email composition visualization
 * @param executiveId Optional executive ID to filter compositions
 */
export const useEmailComposition = (executiveId?: string) => {
  const dispatch = useAppDispatch();
  
  // Handle real-time composition updates
  const handleCompositionUpdate = useCallback((draft: EmailDraft) => {
    // Update the draft in the store
    dispatch(updateEmailDraft(draft));
    
    // Set as active composition
    dispatch(setActiveComposition(draft));
  }, [dispatch]);
  
  // Register composition callback
  useEffect(() => {
    const emailService = EmailService.getInstance();
    
    if (executiveId) {
      // Register callback for specific executive
      emailService.registerCompositionCallback(executiveId, handleCompositionUpdate);
      
      return () => {
        emailService.unregisterCompositionCallback(executiveId);
      };
    } else {
      // Register callbacks for all executives
      const executives = ['ceo', 'cfo', 'cto', 'cmo', 'coo', 'chro', 'clo', 'cso'];
      
      executives.forEach(exec => {
        emailService.registerCompositionCallback(exec, handleCompositionUpdate);
      });
      
      return () => {
        executives.forEach(exec => {
          emailService.unregisterCompositionCallback(exec);
        });
      };
    }
  }, [executiveId, handleCompositionUpdate]);
  
  // Simulate email composition for demo purposes
  const simulateEmailComposition = useCallback((
    executiveId: string,
    to: string[],
    subject: string,
    body: string,
    duration?: number
  ) => {
    const emailService = EmailService.getInstance();
    
    emailService.simulateEmailComposition(
      executiveId,
      to,
      subject,
      body,
      duration
    );
  }, []);
  
  return {
    simulateEmailComposition
  };
};