import { v4 as uuidv4 } from 'uuid';
import { CalendarOAuth2Service } from './CalendarOAuth2Service';
import { CalendarTokenStorageService } from '../../services/CalendarTokenStorageService';
import { CalendarProvider, CalendarCredentials } from '../../types/calendar';
import { OAuth2Token } from '../../types';

/**
 * Service for handling calendar authentication
 */
export class CalendarAuthService {
  private static instance: CalendarAuthService;
  private oauth2Service: CalendarOAuth2Service;
  private tokenStorage: CalendarTokenStorageService;

  private constructor() {
    this.oauth2Service = CalendarOAuth2Service.getInstance();
    this.tokenStorage = CalendarTokenStorageService.getInstance();
  }

  /**
   * Get the singleton instance of CalendarAuthService
   */
  public static getInstance(): CalendarAuthService {
    if (!CalendarAuthService.instance) {
      CalendarAuthService.instance = new CalendarAuthService();
    }
    return CalendarAuthService.instance;
  }

  /**
   * Start the OAuth2 authentication flow for a specific calendar provider
   * @param provider The calendar provider to authenticate with
   * @param userId The user ID
   * @returns The authorization URL to redirect the user to
   */
  public startAuthFlow(provider: CalendarProvider, userId: string): string {
    try {
      // Validate provider configuration
      if (!this.oauth2Service.validateProviderConfig(provider)) {
        throw new Error(`Calendar provider ${provider} is not properly configured`);
      }

      // Store the user ID and provider in session storage for retrieval after redirect
      sessionStorage.setItem('calendar_auth_in_progress', JSON.stringify({ provider, userId }));
      
      // Generate and return the authorization URL
      return this.oauth2Service.getAuthorizationUrl(provider);
    } catch (error) {
      console.error('Error starting calendar auth flow:', error);
      throw error;
    }
  }

  /**
   * Handle the OAuth2 callback after user authorization
   * @param code The authorization code from the callback
   * @param state The state parameter from the callback (if any)
   * @returns Promise resolving to the calendar credentials
   */
  public async handleAuthCallback(code: string): Promise<CalendarCredentials | null> {
    try {
      // Retrieve the stored provider and user ID
      const authData = sessionStorage.getItem('calendar_auth_in_progress');
      if (!authData) {
        throw new Error('No calendar authentication in progress');
      }
      
      const { provider, userId } = JSON.parse(authData);
      
      // Exchange the code for tokens
      const tokens = await this.oauth2Service.exchangeCodeForTokens(provider, code);
      
      // Get user email (this would typically come from the token info or a user info endpoint)
      const email = await this.getUserEmail(tokens, provider);
      
      // Create and save the credentials
      const credentials: CalendarCredentials = {
        id: uuidv4(),
        userId,
        provider,
        email,
        tokens,
        calendars: [],
        lastSynced: new Date(),
        syncEnabled: true
      };
      
      this.tokenStorage.saveCredentials(credentials);
      
      // Clear the session storage
      sessionStorage.removeItem('calendar_auth_in_progress');
      
      return credentials;
    } catch (error) {
      console.error('Error handling calendar auth callback:', error);
      sessionStorage.removeItem('calendar_auth_in_progress');
      return null;
    }
  }

  /**
   * Get a valid access token for a specific calendar provider and user
   * @param provider The calendar provider
   * @param userId The user ID
   * @returns Promise resolving to a valid access token or null if not found
   */
  public async getValidAccessToken(provider: CalendarProvider, userId: string): Promise<string | null> {
    try {
      const credentials = this.tokenStorage.getCredentials(provider, userId);
      if (!credentials) {
        return null;
      }

      const validTokens = await this.oauth2Service.getValidToken(credentials.tokens, provider);
      
      // Update the stored credentials with the refreshed tokens if needed
      if (validTokens !== credentials.tokens) {
        credentials.tokens = validTokens;
        this.tokenStorage.saveCredentials(credentials);
      }

      return validTokens.accessToken;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Check if a user is authenticated with a specific calendar provider
   * @param provider The calendar provider
   * @param userId The user ID
   * @returns True if the user is authenticated
   */
  public isAuthenticated(provider: CalendarProvider, userId: string): boolean {
    try {
      const credentials = this.tokenStorage.getCredentials(provider, userId);
      if (!credentials) {
        return false;
      }

      // Check if the token is still valid
      return !this.oauth2Service.isTokenExpired(credentials.tokens);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Remove authentication for a specific calendar provider and user
   * @param provider The calendar provider
   * @param userId The user ID
   * @returns True if authentication was successfully removed
   */
  public removeAuthentication(provider: CalendarProvider, userId: string): boolean {
    try {
      return this.tokenStorage.removeCredentials(provider, userId);
    } catch (error) {
      console.error('Error removing calendar authentication:', error);
      return false;
    }
  }

  /**
   * Get all authenticated calendar providers for a user
   * @param userId The user ID
   * @returns Array of authenticated calendar providers
   */
  public getAuthenticatedProviders(userId: string): CalendarProvider[] {
    try {
      const allCredentials = this.tokenStorage.getCredentialsForUser(userId);
      const calendarCredentials = allCredentials.filter(cred => 
        this.isCalendarProvider(cred.provider)
      );

      return calendarCredentials
        .filter(cred => this.isAuthenticated(cred.provider as CalendarProvider, userId))
        .map(cred => cred.provider as CalendarProvider);
    } catch (error) {
      console.error('Error getting authenticated calendar providers:', error);
      return [];
    }
  }

  /**
   * Get calendar credentials for a specific provider and user
   * @param provider The calendar provider
   * @param userId The user ID
   * @returns The calendar credentials or null if not found
   */
  public getCredentials(provider: CalendarProvider, userId: string): CalendarCredentials | null {
    try {
      const credentials = this.tokenStorage.getCredentials(provider, userId);
      if (!credentials) {
        return null;
      }

      // Check if the credentials are still valid
      if (this.oauth2Service.isTokenExpired(credentials.tokens)) {
        return null;
      }

      return credentials;
    } catch (error) {
      console.error('Error getting calendar credentials:', error);
      return null;
    }
  }

  /**
   * Update calendar credentials (e.g., after token refresh)
   * @param credentials The updated calendar credentials
   * @returns True if the credentials were successfully updated
   */
  public updateCredentials(credentials: CalendarCredentials): boolean {
    try {
      this.tokenStorage.saveCredentials(credentials);
      return true;
    } catch (error) {
      console.error('Error updating calendar credentials:', error);
      return false;
    }
  }

  /**
   * Get user email from the OAuth2 token or user info endpoint
   * @param tokens The OAuth2 tokens
   * @param provider The calendar provider
   * @returns Promise resolving to the user's email
   */
  private async getUserEmail(tokens: OAuth2Token, provider: CalendarProvider): Promise<string> {
    try {
      // For Google Calendar, we can get the email from the token scope
      if (provider === 'Google') {
        // Try to get user info from Google's userinfo endpoint
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        });

        if (response.ok) {
          const userInfo = await response.json();
          return userInfo.email;
        }
      }

      // For Microsoft providers (Outlook, Exchange), we can get the email from Microsoft Graph
      if (provider === 'Outlook' || provider === 'Exchange') {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        });

        if (response.ok) {
          const userInfo = await response.json();
          return userInfo.mail || userInfo.userPrincipalName;
        }
      }

      // For CalDAV, we'll use a placeholder for now
      if (provider === 'CalDAV') {
        return 'user@example.com'; // Placeholder
      }

      // Fallback to a placeholder email
      return 'user@example.com';
    } catch (error) {
      console.error('Error getting user email:', error);
      return 'user@example.com';
    }
  }

  /**
   * Check if a provider is a calendar provider
   * @param provider The provider to check
   * @returns True if it's a calendar provider
   */
  private isCalendarProvider(provider: string): provider is CalendarProvider {
    return ['Google', 'Outlook', 'Exchange', 'CalDAV'].includes(provider);
  }

  /**
   * Get the list of supported calendar providers
   * @returns Array of supported calendar providers
   */
  public getSupportedProviders(): CalendarProvider[] {
    return this.oauth2Service.getSupportedProviders();
  }

  /**
   * Validate that a calendar provider is properly configured
   * @param provider The calendar provider to validate
   * @returns True if the provider is properly configured
   */
  public validateProviderConfig(provider: CalendarProvider): boolean {
    return this.oauth2Service.validateProviderConfig(provider);
  }
} 