import { v4 as uuidv4 } from 'uuid';
import { OAuth2Service } from '../../services/OAuth2Service';
import { TokenStorageService } from '../../services/TokenStorageService';
import { EmailProvider, EmailCredentials, OAuth2Token } from '../../types';

/**
 * Service for handling email authentication
 */
export class EmailAuthService {
  private static instance: EmailAuthService;
  private oauth2Service: OAuth2Service;
  private tokenStorage: TokenStorageService;

  private constructor() {
    this.oauth2Service = OAuth2Service.getInstance();
    this.tokenStorage = TokenStorageService.getInstance();
  }

  /**
   * Get the singleton instance of EmailAuthService
   */
  public static getInstance(): EmailAuthService {
    if (!EmailAuthService.instance) {
      EmailAuthService.instance = new EmailAuthService();
    }
    return EmailAuthService.instance;
  }

  /**
   * Start the OAuth2 authentication flow for a specific provider
   * @param provider The email provider to authenticate with
   * @param userId The user ID
   * @returns The authorization URL to redirect the user to
   */
  public startAuthFlow(provider: EmailProvider, userId: string): string {
    try {
      // Store the user ID in session storage for retrieval after redirect
      sessionStorage.setItem('auth_in_progress', JSON.stringify({ provider, userId }));
      
      // Generate and return the authorization URL
      return this.oauth2Service.getAuthorizationUrl(provider);
    } catch (error) {
      console.error('Error starting auth flow:', error);
      throw error;
    }
  }

  /**
   * Handle the OAuth2 callback after user authorization
   * @param code The authorization code from the callback
   * @param state The state parameter from the callback (if any)
   * @returns Promise resolving to the email credentials
   */
  public async handleAuthCallback(code: string): Promise<EmailCredentials | null> {
    try {
      // Retrieve the stored provider and user ID
      const authData = sessionStorage.getItem('auth_in_progress');
      if (!authData) {
        throw new Error('No authentication in progress');
      }
      
      const { provider, userId } = JSON.parse(authData);
      
      // Exchange the code for tokens
      const tokens = await this.oauth2Service.exchangeCodeForTokens(provider, code);
      
      // Get user email (this would typically come from the token info or a user info endpoint)
      // For this implementation, we'll use a placeholder
      const email = await this.getUserEmail(tokens);
      
      // Create and save the credentials
      const credentials: EmailCredentials = {
        id: uuidv4(),
        userId,
        provider,
        email,
        tokens,
        lastSynced: new Date()
      };
      
      this.tokenStorage.saveCredentials(credentials);
      
      // Clear the session storage
      sessionStorage.removeItem('auth_in_progress');
      
      return credentials;
    } catch (error) {
      console.error('Error handling auth callback:', error);
      sessionStorage.removeItem('auth_in_progress');
      return null;
    }
  }

  /**
   * Get a valid access token for a specific provider and user
   * @param provider The email provider
   * @param userId The user ID
   * @returns Promise resolving to a valid access token or null if not found
   */
  public async getValidAccessToken(provider: EmailProvider, userId: string): Promise<string | null> {
    try {
      const credentials = this.tokenStorage.getCredentials(provider, userId);
      if (!credentials) {
        return null;
      }
      
      // Get a valid token, refreshing if necessary
      const validToken = await this.oauth2Service.getValidToken(credentials.tokens);
      
      // Update the stored token if it was refreshed
      if (validToken !== credentials.tokens) {
        this.tokenStorage.updateTokens(provider, userId, validToken);
      }
      
      return validToken.accessToken;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Check if a user is authenticated with a specific provider
   * @param provider The email provider
   * @param userId The user ID
   * @returns True if the user is authenticated, false otherwise
   */
  public isAuthenticated(provider: EmailProvider, userId: string): boolean {
    return this.tokenStorage.getCredentials(provider, userId) !== null;
  }

  /**
   * Remove authentication for a specific provider and user
   * @param provider The email provider
   * @param userId The user ID
   * @returns True if authentication was removed, false otherwise
   */
  public removeAuthentication(provider: EmailProvider, userId: string): boolean {
    return this.tokenStorage.deleteCredentials(provider, userId);
  }

  /**
   * Get all authenticated email providers for a user
   * @param userId The user ID
   * @returns Array of authenticated email providers
   */
  public getAuthenticatedProviders(userId: string): EmailProvider[] {
    return this.tokenStorage.getAllCredentials()
      .filter(cred => cred.userId === userId)
      .map(cred => cred.provider);
  }

  /**
   * Get user email from tokens
   * This is a placeholder implementation
   * In a real implementation, you would call the provider's API to get the user's email
   * @param tokens The OAuth2 tokens
   * @returns Promise resolving to the user's email
   */
  private async getUserEmail(tokens: OAuth2Token): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would call the provider's API to get the user's email
    
    if (tokens.provider === 'Gmail') {
      // For Gmail, you would call the Gmail API to get the user's profile
      return 'user@gmail.com';
    } else if (tokens.provider === 'Outlook' || tokens.provider === 'Exchange') {
      // For Outlook/Exchange, you would call the Microsoft Graph API
      return 'user@outlook.com';
    }
    
    return 'user@example.com';
  }
}