import { v4 as uuidv4 } from 'uuid';
import { EmailAuthService } from './EmailAuthService';
import { Email, EmailDraft, EmailProvider, EmailThread, Attachment } from '../../types';
import { EmailApprovalService } from '../../services/EmailApprovalService';
import { NotificationManager } from '../../services/NotificationManager';
import { store } from '../../store';
import { addApprovalRequest } from '../../store/slices/approvalSlice';

/**
 * Service for handling email operations
 */
export class EmailService {
  private static instance: EmailService;
  private emailAuthService: EmailAuthService;
  private mockEmails: Map<string, Email[]> = new Map(); // userId -> emails
  private mockThreads: Map<string, EmailThread[]> = new Map(); // userId -> threads
  private mockDrafts: Map<string, EmailDraft[]> = new Map(); // userId -> drafts
  private compositionCallbacks: Map<string, (draft: EmailDraft) => void> = new Map(); // executiveId -> callback

  private emailApprovalService: EmailApprovalService;
  private notificationManager: NotificationManager | null = null;

  private constructor() {
    this.emailAuthService = EmailAuthService.getInstance();
    this.emailApprovalService = EmailApprovalService.getInstance();
    this.initializeMockData();
  }
  
  /**
   * Set the notification manager for creating notifications
   * @param notificationManager The notification manager instance
   */
  public setNotificationManager(notificationManager: NotificationManager): void {
    this.notificationManager = notificationManager;
  }

  /**
   * Get the singleton instance of EmailService
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize mock email data for demo purposes
   */
  private initializeMockData(): void {
    // Create some mock emails for the default user
    const userId = 'default-user';
    const mockEmails: Email[] = [];
    const mockThreads: EmailThread[] = [];
    
    // Create mock threads
    const thread1: EmailThread = {
      id: uuidv4(),
      subject: 'Q3 Financial Review',
      participants: ['cfo@sovren.ai', 'ceo@sovren.ai', 'finance@company.com'],
      messages: [],
      lastUpdated: new Date(Date.now() - 3600000) // 1 hour ago
    };
    
    const thread2: EmailThread = {
      id: uuidv4(),
      subject: 'New Marketing Campaign Proposal',
      participants: ['cmo@sovren.ai', 'marketing@company.com', 'you@company.com'],
      messages: [],
      lastUpdated: new Date(Date.now() - 7200000) // 2 hours ago
    };
    
    const thread3: EmailThread = {
      id: uuidv4(),
      subject: 'System Architecture Update',
      participants: ['cto@sovren.ai', 'engineering@company.com', 'you@company.com'],
      messages: [],
      lastUpdated: new Date(Date.now() - 1800000) // 30 minutes ago
    };
    
    mockThreads.push(thread1, thread2, thread3);
    
    // Create mock emails in threads
    const email1: Email = {
      id: uuidv4(),
      from: 'cfo@sovren.ai',
      to: ['ceo@sovren.ai', 'finance@company.com'],
      subject: 'Q3 Financial Review',
      body: 'I\'ve analyzed the Q3 financial data and prepared a summary for the board meeting. Our revenue is up 15% compared to Q2, and expenses are down 8%. EBITDA has improved by 22%.',
      attachments: [{
        id: uuidv4(),
        name: 'Q3_Financial_Summary.pdf',
        contentType: 'application/pdf',
        size: 2456000,
        url: '#'
      }],
      thread: thread1,
      executiveHandler: 'cfo',
      isHighStakes: true,
      requiresApproval: false,
      timestamp: new Date(Date.now() - 3600000) // 1 hour ago
    };
    
    const email2: Email = {
      id: uuidv4(),
      from: 'marketing@company.com',
      to: ['cmo@sovren.ai', 'you@company.com'],
      subject: 'New Marketing Campaign Proposal',
      body: 'I\'d like to propose a new marketing campaign for Q4. The campaign will focus on our new AI features and target enterprise customers. I\'ve attached a draft proposal for your review.',
      attachments: [{
        id: uuidv4(),
        name: 'Q4_Marketing_Proposal.pptx',
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 4567000,
        url: '#'
      }],
      thread: thread2,
      executiveHandler: 'cmo',
      isHighStakes: false,
      requiresApproval: false,
      timestamp: new Date(Date.now() - 7200000) // 2 hours ago
    };
    
    const email3: Email = {
      id: uuidv4(),
      from: 'cmo@sovren.ai',
      to: ['marketing@company.com', 'you@company.com'],
      subject: 'Re: New Marketing Campaign Proposal',
      body: 'I\'ve reviewed the proposal and have some suggestions. Let\'s focus more on the ROI metrics and customer success stories. Also, we should consider increasing the budget for digital advertising.',
      attachments: [],
      thread: thread2,
      executiveHandler: 'cmo',
      isHighStakes: false,
      requiresApproval: false,
      timestamp: new Date(Date.now() - 5400000) // 1.5 hours ago
    };
    
    const email4: Email = {
      id: uuidv4(),
      from: 'cto@sovren.ai',
      to: ['engineering@company.com', 'you@company.com'],
      subject: 'System Architecture Update',
      body: 'We\'re planning to update our system architecture to improve scalability and performance. The update will include moving to a microservices architecture and implementing Kubernetes for container orchestration.',
      attachments: [{
        id: uuidv4(),
        name: 'Architecture_Diagram.png',
        contentType: 'image/png',
        size: 1234000,
        url: '#'
      }],
      thread: thread3,
      executiveHandler: 'cto',
      isHighStakes: true,
      requiresApproval: true,
      timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
    };
    
    const email5: Email = {
      id: uuidv4(),
      from: 'ceo@sovren.ai',
      to: ['board@company.com', 'you@company.com'],
      subject: 'Strategic Partnership Opportunity',
      body: 'I\'ve been in discussions with Acme Corp about a potential strategic partnership. They\'re interested in integrating our AI technology into their product suite. This could be a significant opportunity for us.',
      attachments: [],
      thread: {
        id: uuidv4(),
        subject: 'Strategic Partnership Opportunity',
        participants: ['ceo@sovren.ai', 'board@company.com', 'you@company.com'],
        messages: [],
        lastUpdated: new Date(Date.now() - 900000) // 15 minutes ago
      },
      executiveHandler: 'ceo',
      isHighStakes: true,
      requiresApproval: true,
      timestamp: new Date(Date.now() - 900000) // 15 minutes ago
    };
    
    // Add emails to threads
    thread1.messages.push(email1.id);
    thread2.messages.push(email2.id, email3.id);
    thread3.messages.push(email4.id);
    mockThreads[3] = email5.thread;
    
    // Add emails to mock data
    mockEmails.push(email1, email2, email3, email4, email5);
    
    // Store mock data
    this.mockEmails.set(userId, mockEmails);
    this.mockThreads.set(userId, mockThreads);
    this.mockDrafts.set(userId, []);
  }

  /**
   * Get all emails for a user
   * @param userId The user ID
   * @returns Promise resolving to an array of emails
   */
  public async getEmails(userId: string): Promise<Email[]> {
    // In a real implementation, this would call the email provider's API
    // For this implementation, we'll use mock data
    
    return this.mockEmails.get(userId) || [];
  }

  /**
   * Get emails for a specific executive
   * @param userId The user ID
   * @param executiveId The executive ID
   * @returns Promise resolving to an array of emails
   */
  public async getEmailsByExecutive(userId: string, executiveId: string): Promise<Email[]> {
    const emails = this.mockEmails.get(userId) || [];
    return emails.filter(email => email.executiveHandler === executiveId);
  }

  /**
   * Get all email threads for a user
   * @param userId The user ID
   * @returns Promise resolving to an array of email threads
   */
  public async getEmailThreads(userId: string): Promise<EmailThread[]> {
    // In a real implementation, this would call the email provider's API
    // For this implementation, we'll use mock data
    
    return this.mockThreads.get(userId) || [];
  }

  /**
   * Get email drafts for a user
   * @param userId The user ID
   * @returns Promise resolving to an array of email drafts
   */
  public async getEmailDrafts(userId: string): Promise<EmailDraft[]> {
    return this.mockDrafts.get(userId) || [];
  }

  /**
   * Create a new email draft
   * @param draft The email draft to create
   * @returns Promise resolving to the created draft
   */
  public async createDraft(draft: EmailDraft): Promise<EmailDraft> {
    const userId = 'default-user'; // In a real app, this would come from authentication
    const drafts = this.mockDrafts.get(userId) || [];
    
    // Create a new draft with ID
    const newDraft: EmailDraft = {
      ...draft,
      id: draft.id || uuidv4()
    };
    
    // Add to drafts
    drafts.push(newDraft);
    this.mockDrafts.set(userId, drafts);
    
    // Notify composition callback if registered
    if (this.compositionCallbacks.has(draft.executiveId)) {
      const callback = this.compositionCallbacks.get(draft.executiveId);
      if (callback) {
        callback(newDraft);
      }
    }
    
    return newDraft;
  }

  /**
   * Update an existing email draft
   * @param draft The email draft to update
   * @returns Promise resolving to the updated draft
   */
  public async updateDraft(draft: EmailDraft): Promise<EmailDraft> {
    const userId = 'default-user'; // In a real app, this would come from authentication
    const drafts = this.mockDrafts.get(userId) || [];
    
    // Find and update the draft
    const index = drafts.findIndex(d => d.id === draft.id);
    if (index >= 0) {
      drafts[index] = draft;
      this.mockDrafts.set(userId, drafts);
      
      // Notify composition callback if registered
      if (this.compositionCallbacks.has(draft.executiveId)) {
        const callback = this.compositionCallbacks.get(draft.executiveId);
        if (callback) {
          callback(draft);
        }
      }
      
      return draft;
    }
    
    throw new Error('Draft not found');
  }

  /**
   * Send an email
   * @param draft The email draft to send
   * @returns Promise resolving to the sent email
   */
  public async sendEmail(draft: EmailDraft): Promise<Email> {
    const userId = 'default-user'; // In a real app, this would come from authentication
    
    // Analyze email for high-stakes content if not already analyzed
    if (draft.isHighStakes === undefined || draft.requiresApproval === undefined) {
      const analysis = this.emailApprovalService.detectHighStakesEmail(draft);
      draft.isHighStakes = analysis.isHighStakes;
      draft.requiresApproval = analysis.requiresApproval;
      
      // Create notification for high-stakes email
      if (analysis.isHighStakes && this.notificationManager) {
        this.notificationManager.createNotification(
          draft.executiveId,
          'activity_update',
          'High-Stakes Email Detected',
          `Email "${draft.subject}" contains sensitive content: ${analysis.reason}`,
          analysis.requiresApproval ? 'high' : 'medium'
        );
      }
    }
    
    // If email requires approval, create approval request and wait for approval
    if (draft.requiresApproval) {
      return new Promise((resolve, reject) => {
        // Find executive data (in a real app, this would come from a service)
        const executive = {
          id: draft.executiveId,
          name: `${draft.executiveId.charAt(0).toUpperCase() + draft.executiveId.slice(1)}`,
          role: draft.executiveId.toUpperCase()
        };
        
        // Create approval request
        const approvalRequest = this.emailApprovalService.createApprovalRequest(
          draft,
          executive,
          draft.isHighStakes ? 'high' : 'medium'
        );
        
        // Add approval request to Redux store
        store.dispatch(addApprovalRequest(approvalRequest));
        
        // Create notification for approval request
        if (this.notificationManager) {
          this.notificationManager.createNotification(
            draft.executiveId,
            'approval_required',
            'Email Approval Required',
            `Email "${draft.subject}" requires your approval before sending`,
            'urgent',
            { approvalId: approvalRequest.id }
          );
        }
        
        // Register callback for when approval is processed
        this.emailApprovalService.registerApprovalCallback(
          approvalRequest.id,
          (approved) => {
            if (approved) {
              // If approved, send the email
              this.processSendEmail(draft)
                .then(email => resolve(email))
                .catch(error => reject(error));
              
              // Create notification for approved email
              if (this.notificationManager) {
                this.notificationManager.createNotification(
                  draft.executiveId,
                  'activity_update',
                  'Email Approved and Sent',
                  `Email "${draft.subject}" was approved and sent to ${draft.to.join(', ')}`,
                  'medium'
                );
              }
            } else {
              // If rejected, create notification and reject promise
              if (this.notificationManager) {
                this.notificationManager.createNotification(
                  draft.executiveId,
                  'activity_update',
                  'Email Rejected',
                  `Email "${draft.subject}" was rejected and not sent`,
                  'medium'
                );
              }
              reject(new Error('Email approval was rejected'));
            }
          }
        );
      });
    }
    
    // If no approval required, send immediately
    return this.processSendEmail(draft);
  }
  
  /**
   * Process sending an email after approval checks
   * @param draft The email draft to send
   * @returns Promise resolving to the sent email
   */
  private async processSendEmail(draft: EmailDraft): Promise<Email> {
    const userId = 'default-user'; // In a real app, this would come from authentication
    
    // Create a new thread or use existing
    let thread: EmailThread;
    const threads = this.mockThreads.get(userId) || [];
    
    // Check if this is a reply to an existing thread
    const existingThread = threads.find(t => t.subject === draft.subject);
    
    if (existingThread) {
      thread = existingThread;
    } else {
      thread = {
        id: uuidv4(),
        subject: draft.subject,
        participants: [...draft.to, draft.from],
        messages: [],
        lastUpdated: new Date()
      };
      threads.push(thread);
    }
    
    // Create the email
    const email: Email = {
      id: uuidv4(),
      from: draft.from,
      to: draft.to,
      subject: draft.subject,
      body: draft.body,
      attachments: draft.attachments || [],
      thread,
      executiveHandler: draft.executiveId,
      isHighStakes: draft.isHighStakes || false,
      requiresApproval: draft.requiresApproval || false,
      timestamp: new Date()
    };
    
    // Add email to thread
    thread.messages.push(email.id);
    thread.lastUpdated = new Date();
    
    // Add email to emails
    const emails = this.mockEmails.get(userId) || [];
    emails.push(email);
    
    // Update storage
    this.mockEmails.set(userId, emails);
    this.mockThreads.set(userId, threads);
    
    // Remove from drafts
    const drafts = this.mockDrafts.get(userId) || [];
    const draftIndex = drafts.findIndex(d => d.id === draft.id);
    if (draftIndex >= 0) {
      drafts.splice(draftIndex, 1);
      this.mockDrafts.set(userId, drafts);
    }
    
    return email;
  }

  /**
   * Register a callback for real-time email composition updates
   * @param executiveId The executive ID
   * @param callback The callback function
   */
  public registerCompositionCallback(executiveId: string, callback: (draft: EmailDraft) => void): void {
    this.compositionCallbacks.set(executiveId, callback);
  }

  /**
   * Unregister a composition callback
   * @param executiveId The executive ID
   */
  public unregisterCompositionCallback(executiveId: string): void {
    this.compositionCallbacks.delete(executiveId);
  }

  /**
   * Simulate an executive composing an email in real-time
   * @param executiveId The executive ID
   * @param to Recipients
   * @param subject Email subject
   * @param body Email body
   * @param duration Duration of the composition in milliseconds
   * @returns Promise that resolves when composition is complete
   */
  public simulateEmailComposition(
    executiveId: string,
    to: string[],
    subject: string,
    body: string,
    duration: number = 5000
  ): Promise<EmailDraft> {
    return new Promise((resolve) => {
      const draft: EmailDraft = {
        id: uuidv4(),
        from: `${executiveId.toLowerCase()}@sovren.ai`,
        to,
        subject,
        body: '',
        executiveId
      };
      
      // Create initial draft
      this.createDraft(draft);
      
      // Split the body into chunks to simulate typing
      const words = body.split(' ');
      const chunkSize = Math.max(1, Math.floor(words.length / 10));
      const chunks: string[] = [];
      
      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
      }
      
      // Simulate typing
      let currentBody = '';
      let chunkIndex = 0;
      
      const interval = setInterval(() => {
        if (chunkIndex >= chunks.length) {
          clearInterval(interval);
          resolve(draft);
          return;
        }
        
        currentBody += (chunkIndex > 0 ? ' ' : '') + chunks[chunkIndex];
        chunkIndex++;
        
        // Update draft
        draft.body = currentBody;
        this.updateDraft(draft);
      }, duration / chunks.length);
      
      // When composition is complete, analyze for high-stakes content
      setTimeout(() => {
        const analysis = this.emailApprovalService.detectHighStakesEmail(draft);
        draft.isHighStakes = analysis.isHighStakes;
        draft.requiresApproval = analysis.requiresApproval;
        
        // Update draft with analysis results
        this.updateDraft(draft);
        
        // Create notification for high-stakes email
        if (analysis.isHighStakes && this.notificationManager) {
          this.notificationManager.createNotification(
            executiveId,
            'activity_update',
            'High-Stakes Email Detected',
            `Email "${subject}" contains sensitive content: ${analysis.reason}`,
            analysis.requiresApproval ? 'high' : 'medium'
          );
        }
      }, duration);
    });
  }
}