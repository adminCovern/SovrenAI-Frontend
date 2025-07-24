// Email Provider Types
export type EmailProvider = 'Gmail' | 'Outlook' | 'Exchange';

// OAuth2 Authentication Types
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  provider: EmailProvider;
}

export interface OAuth2Token {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp in milliseconds
  tokenType: string;
  scope: string;
  provider: EmailProvider;
}

export interface EmailCredentials {
  id: string;
  userId: string;
  provider: EmailProvider;
  email: string;
  tokens: OAuth2Token;
  lastSynced?: Date;
}

// Email Data Types
export interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  attachments: Attachment[];
  thread: EmailThread;
  executiveHandler: string; // Executive ID
  isHighStakes: boolean;
  requiresApproval: boolean;
  timestamp: Date;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  messages: string[]; // Email IDs
  lastUpdated: Date;
}

export interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  url: string;
}

export interface EmailDraft {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Attachment[];
  executiveId: string;
  isHighStakes?: boolean;
  requiresApproval?: boolean;
}

// Email Activity Types
export interface EmailActivity {
  id: string;
  type: EmailActivityType;
  emailId?: string;
  threadId?: string;
  executiveId: string;
  timestamp: Date;
  details: any;
}

export type EmailActivityType = 
  | 'read' 
  | 'compose' 
  | 'send' 
  | 'reply' 
  | 'forward' 
  | 'archive' 
  | 'delete';