import { OAuth2Service } from '../../services/OAuth2Service';
import { CalendarProvider } from '../../types/calendar';
import { OAuth2Token } from '../../types';

// Extended OAuth2Config for calendar providers
interface CalendarOAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  provider: CalendarProvider;
}

/**
 * Service for handling calendar OAuth2 authentication flows
 * Extends the base OAuth2Service with calendar-specific configurations
 */
export class CalendarOAuth2Service {
  private static instance: CalendarOAuth2Service;
  private oauth2Service: OAuth2Service;
  private calendarConfigs: Record<CalendarProvider, CalendarOAuth2Config> = {
    Google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/callback/google-calendar`,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.settings.readonly'
      ],
      provider: 'Google'
    },
    Outlook: {
      clientId: process.env.NEXT_PUBLIC_OUTLOOK_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.OUTLOOK_CALENDAR_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/callback/outlook-calendar`,
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: [
        'offline_access',
        'Calendars.Read',
        'Calendars.ReadWrite',
        'Calendars.Read.Shared',
        'Calendars.ReadWrite.Shared'
      ],
      provider: 'Outlook'
    },
    Exchange: {
      clientId: process.env.NEXT_PUBLIC_EXCHANGE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.EXCHANGE_CALENDAR_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/callback/exchange-calendar`,
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: [
        'offline_access',
        'Calendars.Read',
        'Calendars.ReadWrite',
        'Calendars.Read.Shared',
        'Calendars.ReadWrite.Shared'
      ],
      provider: 'Exchange'
    },
    CalDAV: {
      clientId: process.env.NEXT_PUBLIC_CALDAV_CLIENT_ID || '',
      clientSecret: process.env.CALDAV_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/callback/caldav`,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth', // Using Google for CalDAV
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      provider: 'CalDAV'
    }
  };

  private constructor() {
    this.oauth2Service = OAuth2Service.getInstance();
  }

  /**
   * Get the singleton instance of CalendarOAuth2Service
   */
  public static getInstance(): CalendarOAuth2Service {
    if (!CalendarOAuth2Service.instance) {
      CalendarOAuth2Service.instance = new CalendarOAuth2Service();
    }
    return CalendarOAuth2Service.instance;
  }

  /**
   * Generate the authorization URL for a specific calendar provider
   * @param provider The calendar provider to authenticate with
   * @returns The authorization URL to redirect the user to
   */
  public getAuthorizationUrl(provider: CalendarProvider): string {
    const config = this.calendarConfigs[provider];
    if (!config) {
      throw new Error(`Calendar provider ${provider} not supported`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${config.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for OAuth2 tokens for calendar access
   * @param provider The calendar provider
   * @param code The authorization code from the callback
   * @returns Promise resolving to the OAuth2 tokens
   */
  public async exchangeCodeForTokens(provider: CalendarProvider, code: string): Promise<OAuth2Token> {
    const config = this.calendarConfigs[provider];
    if (!config) {
      throw new Error(`Calendar provider ${provider} not supported`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    });

    try {
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
      }

      const tokenData = await response.json();
      
      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        provider: provider as any // Type assertion needed due to EmailProvider vs CalendarProvider
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh an expired access token
   * @param provider The calendar provider
   * @param refreshToken The refresh token
   * @returns Promise resolving to the new OAuth2 tokens
   */
  public async refreshAccessToken(provider: CalendarProvider, refreshToken: string): Promise<OAuth2Token> {
    const config = this.calendarConfigs[provider];
    if (!config) {
      throw new Error(`Calendar provider ${provider} not supported`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    try {
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token refresh failed: ${errorData.error || response.statusText}`);
      }

      const tokenData = await response.json();
      
      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        provider: provider as any // Type assertion needed due to EmailProvider vs CalendarProvider
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Check if a token is expired
   * @param token The OAuth2 token to check
   * @param bufferSeconds Buffer time in seconds before considering token expired
   * @returns True if token is expired or will expire within buffer time
   */
  public isTokenExpired(token: OAuth2Token, bufferSeconds = 300): boolean {
    if (!token.expiresAt) {
      return false;
    }
    
    const bufferTime = Date.now() + (bufferSeconds * 1000);
    return token.expiresAt <= bufferTime;
  }

  /**
   * Get a valid token, refreshing if necessary
   * @param token The current OAuth2 token
   * @param provider The calendar provider
   * @returns Promise resolving to a valid OAuth2 token
   */
  public async getValidToken(token: OAuth2Token, provider: CalendarProvider): Promise<OAuth2Token> {
    if (this.isTokenExpired(token)) {
      if (!token.refreshToken) {
        throw new Error('Token expired and no refresh token available');
      }
      
      return await this.refreshAccessToken(provider, token.refreshToken);
    }
    
    return token;
  }

  /**
   * Validate that all required environment variables are set for a provider
   * @param provider The calendar provider to validate
   * @returns True if all required environment variables are set
   */
  public validateProviderConfig(provider: CalendarProvider): boolean {
    const config = this.calendarConfigs[provider];
    if (!config) {
      return false;
    }

    return !!(config.clientId && config.clientSecret && config.redirectUri);
  }

  /**
   * Get the list of supported calendar providers
   * @returns Array of supported calendar providers
   */
  public getSupportedProviders(): CalendarProvider[] {
    return Object.keys(this.calendarConfigs) as CalendarProvider[];
  }

  /**
   * Get the configuration for a specific provider
   * @param provider The calendar provider
   * @returns The OAuth2 configuration for the provider
   */
  public getProviderConfig(provider: CalendarProvider): CalendarOAuth2Config | null {
    return this.calendarConfigs[provider] || null;
  }
} 