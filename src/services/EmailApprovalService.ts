import { v4 as uuidv4 } from 'uuid';
import { 
  Email, 
  EmailDraft, 
  ApprovalRequest, 
  ExecutiveAction, 
  RiskLevel, 
  ActionContext,
  HolographicCard
} from '../types';

/**
 * Service for handling email approval workflows
 */
export class EmailApprovalService {
  private static instance: EmailApprovalService;
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvalCallbacks: Map<string, (approved: boolean) => void> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of EmailApprovalService
   */
  public static getInstance(): EmailApprovalService {
    if (!EmailApprovalService.instance) {
      EmailApprovalService.instance = new EmailApprovalService();
    }
    return EmailApprovalService.instance;
  }

  /**
   * Detect if an email is high-stakes and requires approval
   * @param draft The email draft to analyze
   * @returns Object containing detection results
   */
  public detectHighStakesEmail(draft: EmailDraft): { 
    isHighStakes: boolean; 
    requiresApproval: boolean;
    riskLevel: RiskLevel;
    reason: string;
  } {
    // Initialize result
    const result = {
      isHighStakes: false,
      requiresApproval: false,
      riskLevel: 'low' as RiskLevel,
      reason: ''
    };

    // Enhanced high-stakes keywords for subject
    const highStakesSubjectKeywords = [
      // Legal and contractual
      'contract', 'agreement', 'legal', 'lawsuit', 'litigation', 'settlement',
      'terms', 'conditions', 'clause', 'amendment', 'addendum', 'breach',
      
      // Financial and business
      'proposal', 'offer', 'deal', 'partnership', 'acquisition', 'merger',
      'investment', 'funding', 'budget', 'financial', 'revenue', 'profit',
      'loss', 'expense', 'cost', 'pricing', 'quote', 'invoice',
      
      // Corporate governance
      'board', 'investor', 'shareholder', 'strategic', 'termination',
      'resignation', 'appointment', 'director', 'executive', 'ceo', 'cfo',
      
      // Confidential and sensitive
      'confidential', 'private', 'sensitive', 'classified', 'restricted',
      'proprietary', 'trade secret', 'intellectual property', 'patent',
      
      // Urgency indicators
      'urgent', 'immediate', 'asap', 'deadline', 'time-sensitive', 'critical'
    ];

    // Enhanced high-stakes keywords for body
    const highStakesBodyKeywords = [
      // Monetary terms
      'million', 'billion', 'thousand', 'dollar', 'euro', 'pound', 'yen',
      'payment', 'transfer', 'wire', 'deposit', 'withdrawal', 'refund',
      'compensation', 'salary', 'bonus', 'commission', 'fee', 'penalty',
      
      // Authorization and commitment
      'approve', 'authorize', 'sign', 'execute', 'commit', 'bind',
      'obligation', 'liability', 'responsibility', 'guarantee', 'warranty',
      'indemnify', 'hold harmless', 'release', 'waive',
      
      // Risk and compliance
      'risk', 'exposure', 'compliance', 'regulation', 'audit', 'investigation',
      'violation', 'penalty', 'fine', 'sanction', 'embargo', 'restriction',
      
      // Confidentiality and IP
      'nda', 'non-disclosure', 'confidentiality', 'proprietary', 'copyright',
      'trademark', 'patent', 'trade secret', 'know-how', 'technology transfer',
      
      // Business operations
      'acquisition', 'divestiture', 'spin-off', 'joint venture', 'alliance',
      'outsourcing', 'insourcing', 'restructuring', 'reorganization',
      
      // HR and employment
      'termination', 'layoff', 'severance', 'non-compete', 'employment',
      'hiring', 'promotion', 'demotion', 'disciplinary', 'grievance'
    ];

    // Enhanced monetary value detection
    const moneyRegexes = [
      // Standard currency formats
      /\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi,
      /\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|usd)/gi,
      /€\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi,
      /\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:euros?|EUR|eur)/gi,
      /£\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi,
      /\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:pounds?|GBP|gbp)/gi,
      
      // Abbreviated formats
      /\d+(?:\.\d+)?\s*(?:million|mil|M|billion|bil|B|thousand|k|K)/gi,
      
      // Percentage values (for equity, interest rates, etc.)
      /\d+(?:\.\d+)?%/gi
    ];

    let allMoneyMatches: string[] = [];
    moneyRegexes.forEach(regex => {
      const matches = draft.body.match(regex) || [];
      allMoneyMatches = allMoneyMatches.concat(matches);
    });
    
    // Extract and normalize monetary values
    const monetaryValues = allMoneyMatches.map(match => {
      let value = 0;
      
      // Handle abbreviated formats
      if (match.toLowerCase().includes('billion') || match.toLowerCase().includes('bil') || match.includes('B')) {
        value = parseFloat(match.replace(/[^0-9.]/g, '')) * 1000000000;
      } else if (match.toLowerCase().includes('million') || match.toLowerCase().includes('mil') || match.includes('M')) {
        value = parseFloat(match.replace(/[^0-9.]/g, '')) * 1000000;
      } else if (match.toLowerCase().includes('thousand') || match.toLowerCase().includes('k')) {
        value = parseFloat(match.replace(/[^0-9.]/g, '')) * 1000;
      } else if (match.includes('%')) {
        // For percentages, treat as potential equity or interest rate
        const percentage = parseFloat(match.replace(/[^0-9.]/g, ''));
        value = percentage > 50 ? 100000 : percentage > 10 ? 50000 : 10000; // Estimated impact
      } else {
        value = parseFloat(match.replace(/[^0-9.]/g, ''));
      }
      
      return isNaN(value) ? 0 : value;
    });
    
    // Find maximum monetary value
    const maxMonetaryValue = monetaryValues.length > 0 ? Math.max(...monetaryValues) : 0;

    // Check for recipient patterns that indicate high stakes
    const highStakesRecipients = draft.to.some(email => {
      const domain = email.split('@')[1]?.toLowerCase() || '';
      const localPart = email.split('@')[0]?.toLowerCase() || '';
      
      // External domains (not company domains)
      const isExternal = !domain.includes('sovren.ai') && !domain.includes('company.com');
      
      // High-stakes recipient patterns
      const highStakesPatterns = [
        'board', 'investor', 'legal', 'counsel', 'attorney', 'lawyer',
        'ceo', 'cfo', 'cto', 'president', 'director', 'partner',
        'compliance', 'audit', 'regulatory', 'government', 'sec'
      ];
      
      return isExternal || highStakesPatterns.some(pattern => 
        localPart.includes(pattern) || domain.includes(pattern)
      );
    });

    // Check subject for high-stakes keywords
    const subjectKeywordMatches = highStakesSubjectKeywords.filter(keyword => 
      draft.subject.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check body for high-stakes keywords
    const bodyKeywordMatches = highStakesBodyKeywords.filter(keyword => 
      draft.body.toLowerCase().includes(keyword.toLowerCase())
    );

    // Check for attachment indicators
    const hasAttachments = draft.attachments && draft.attachments.length > 0;
    const attachmentKeywords = ['attached', 'attachment', 'document', 'file', 'pdf', 'contract', 'agreement'];
    const mentionsAttachments = attachmentKeywords.some(keyword => 
      draft.body.toLowerCase().includes(keyword)
    );

    // Determine if email is high-stakes
    const totalKeywordMatches = subjectKeywordMatches.length + bodyKeywordMatches.length;
    const hasMonetaryContent = allMoneyMatches.length > 0;
    const hasHighStakesRecipients = highStakesRecipients;
    const hasDocuments = hasAttachments || mentionsAttachments;

    if (totalKeywordMatches > 0 || hasMonetaryContent || hasHighStakesRecipients || 
        (hasDocuments && totalKeywordMatches > 0)) {
      result.isHighStakes = true;
      
      // Build comprehensive reason string
      const reasons = [];
      if (subjectKeywordMatches.length > 0) {
        reasons.push(`Subject contains high-stakes keywords: ${subjectKeywordMatches.slice(0, 3).join(', ')}${subjectKeywordMatches.length > 3 ? '...' : ''}`);
      }
      if (bodyKeywordMatches.length > 0) {
        reasons.push(`Body contains high-stakes keywords: ${bodyKeywordMatches.slice(0, 3).join(', ')}${bodyKeywordMatches.length > 3 ? '...' : ''}`);
      }
      if (hasMonetaryContent) {
        reasons.push(`Contains monetary values: ${allMoneyMatches.slice(0, 2).join(', ')}${allMoneyMatches.length > 2 ? '...' : ''}`);
      }
      if (hasHighStakesRecipients) {
        reasons.push('Sent to external or high-stakes recipients');
      }
      if (hasDocuments) {
        reasons.push('Contains or references important documents');
      }
      result.reason = reasons.join('. ');
      
      // Enhanced risk level determination
      let riskScore = 0;
      
      // Monetary value scoring
      if (maxMonetaryValue >= 1000000) riskScore += 4; // $1M+
      else if (maxMonetaryValue >= 100000) riskScore += 3; // $100K+
      else if (maxMonetaryValue >= 10000) riskScore += 2; // $10K+
      else if (maxMonetaryValue >= 1000) riskScore += 1; // $1K+
      
      // Keyword scoring
      if (totalKeywordMatches >= 5) riskScore += 3;
      else if (totalKeywordMatches >= 3) riskScore += 2;
      else if (totalKeywordMatches >= 1) riskScore += 1;
      
      // Recipient scoring
      if (hasHighStakesRecipients) riskScore += 2;
      
      // Document scoring
      if (hasDocuments) riskScore += 1;
      
      // Determine risk level based on score
      if (riskScore >= 7) {
        result.riskLevel = 'critical';
      } else if (riskScore >= 4) {
        result.riskLevel = 'high';
      } else if (riskScore >= 2) {
        result.riskLevel = 'medium';
      }
      
      // Determine if approval is required based on authorization thresholds
      // Critical: Always requires approval
      // High: Requires approval if value > $10K or contains legal/financial keywords
      // Medium: Requires approval if value > $50K
      if (result.riskLevel === 'critical') {
        result.requiresApproval = true;
      } else if (result.riskLevel === 'high') {
        const hasLegalFinancialKeywords = [...subjectKeywordMatches, ...bodyKeywordMatches]
          .some(keyword => ['legal', 'contract', 'agreement', 'financial', 'investment', 'acquisition'].includes(keyword.toLowerCase()));
        result.requiresApproval = maxMonetaryValue >= 10000 || hasLegalFinancialKeywords;
      } else if (result.riskLevel === 'medium') {
        result.requiresApproval = maxMonetaryValue >= 50000;
      }
    }

    return result;
  }

  /**
   * Create an approval request for an email
   * @param draft The email draft requiring approval
   * @param executive The executive sending the email
   * @param riskLevel The risk level of the email
   * @returns The created approval request
   */
  public createApprovalRequest(
    draft: EmailDraft, 
    executive: any, 
    riskLevel: RiskLevel
  ): ApprovalRequest {
    // Create executive action
    const action: ExecutiveAction = {
      id: uuidv4(),
      type: 'email_send',
      description: `Send email: "${draft.subject}"`,
      value: this.estimateEmailValue(draft),
      riskLevel,
      requiredApproval: true
    };

    // Create action context
    const context: ActionContext = {
      relatedEntities: draft.to,
      businessImpact: this.determineBusinessImpact(draft, riskLevel),
      timeline: 'Immediate',
      stakeholders: [executive.id, ...draft.to]
    };

    // Create holographic card representation
    const holographicCard: HolographicCard = {
      id: uuidv4(),
      position: { x: 0, y: 0, z: 0 },
      content: {
        type: 'email_approval',
        draft: {
          id: draft.id,
          subject: draft.subject,
          from: draft.from,
          to: draft.to,
          body: draft.body.substring(0, 200) + (draft.body.length > 200 ? '...' : '')
        }
      },
      glowIntensity: riskLevel === 'critical' ? 1.5 : riskLevel === 'high' ? 1.2 : 1.0,
      opacity: 0.8
    };

    // Create approval request
    const approvalRequest: ApprovalRequest = {
      id: uuidv4(),
      action,
      executive,
      estimatedValue: action.value,
      riskLevel,
      context,
      visualRepresentation: holographicCard
    };

    // Store approval request
    this.pendingApprovals.set(approvalRequest.id, approvalRequest);

    return approvalRequest;
  }

  /**
   * Get all pending approval requests
   * @returns Array of pending approval requests
   */
  public getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values());
  }

  /**
   * Process an approval decision
   * @param approvalId The ID of the approval request
   * @param approved Whether the request was approved
   * @returns True if the approval was processed successfully
   */
  public processApproval(approvalId: string, approved: boolean): boolean {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) return false;

    // Remove from pending approvals
    this.pendingApprovals.delete(approvalId);

    // Execute callback if registered
    const callback = this.approvalCallbacks.get(approvalId);
    if (callback) {
      callback(approved);
      this.approvalCallbacks.delete(approvalId);
    }

    return true;
  }

  /**
   * Register a callback for when an approval is processed
   * @param approvalId The ID of the approval request
   * @param callback The callback function
   */
  public registerApprovalCallback(approvalId: string, callback: (approved: boolean) => void): void {
    this.approvalCallbacks.set(approvalId, callback);
  }

  /**
   * Estimate the monetary value of an email
   * @param draft The email draft
   * @returns Estimated value in dollars
   */
  private estimateEmailValue(draft: EmailDraft): number {
    // Extract monetary values from email body
    const moneyRegex = /\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|USD|EUR|€)/gi;
    const moneyMatches = draft.body.match(moneyRegex) || [];
    
    // Extract numeric values
    const monetaryValues = moneyMatches.map(match => {
      const numericValue = parseFloat(match.replace(/[^0-9.]/g, ''));
      return isNaN(numericValue) ? 0 : numericValue;
    });
    
    // Return maximum value or default value based on email content
    if (monetaryValues.length > 0) {
      return Math.max(...monetaryValues);
    }
    
    // Default value based on keywords
    const highValueKeywords = [
      'contract', 'agreement', 'proposal', 'offer', 'deal', 'partnership',
      'acquisition', 'merger', 'investment', 'funding'
    ];
    
    const keywordMatches = highValueKeywords.filter(keyword => 
      draft.subject.toLowerCase().includes(keyword.toLowerCase()) || 
      draft.body.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Assign value based on keyword matches
    if (keywordMatches.length >= 3) {
      return 50000;
    } else if (keywordMatches.length >= 1) {
      return 10000;
    }
    
    return 1000; // Default value
  }

  /**
   * Determine the business impact of an email
   * @param draft The email draft
   * @param riskLevel The risk level
   * @returns Description of business impact
   */
  private determineBusinessImpact(draft: EmailDraft, riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case 'critical':
        return 'This email may have significant financial or legal implications for the company.';
      case 'high':
        return 'This email contains sensitive information or financial details that require careful review.';
      case 'medium':
        return 'This email contains business-relevant information that may impact operations.';
      default:
        return 'This email has minimal business impact but contains some sensitive keywords.';
    }
  }
}