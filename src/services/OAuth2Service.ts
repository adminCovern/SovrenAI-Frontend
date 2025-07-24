import { OAuth2Config, OAuth2Token, EmailProvider } from '../types';

/**
 * Service for handling OAuth2 authentication flows
 */
export class OAuth2Service {
  private static instance: OAuth2Service;
  private configs: Record<EmailProvider, OAuth2Config> = {
    Gmail: {
      clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/callback/gmail`,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
      provider: 'Gmail'
    },
    Outlook: {
      clientId: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID || '',
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/callback/outlook`,
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: [
        'offline_access',
        'Mail.Read',
        'Mail.ReadWrite',
        'Mail.Send'
      ],
      provider: 'Outlook'
    },
    Exchange: {
      clientId: process.env.NEXT_PUBLIC_EXCHANGE_CLIENT_ID || '',
      clientSecret: process.env.EXCHANGE_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/callback/exchange`,
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: [
        'offline_access',
        'Mail.Read',
        'Mail.ReadWrite',
        'Mail.Send'
      ],
      provider: 'Exchange'
    }
  };

  private constructor() {}

  /**
   * Get the singleton instance of OAuth2Service
   */
  public static getInstance(): OAuth2Service {
    if (!OAuth2Service.instance) {
      OAuth2Service.instance = new OAuth2Service();
    }
    return OAuth2Service.instance;
  }

  /**
   * Generate the authorization URL for a specific provider
   * @param provider The email provider to authenticate with
   * @returns The authorization URL to redirect the user to
   */
  public getAuthorizationUrl(provider: EmailProvider): string {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Provider ${provider} not supported`);
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
   * Exchange an authorization code for OAuth2 tokens
   * @param provider The email provider
   * @param code The authorization code from the callback
   * @returns Promise resolving to the OAuth2 tokens
   */
  public async exchangeCodeForTokens(provider: EmailProvider, code: string): Promise<OAuth2Token> {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Provider ${provider} not supported`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
      grant_type: 'authorization_code'
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
        throw new Error(`Failed to exchange code: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Calculate expiration time
      const expiresAt = Date.now() + (data.expires_in * 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        tokenType: data.token_type,
        scope: data.scope,
        provider
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh an expired access token using the refresh token
   * @param token The expired OAuth2 token containing the refresh token
   * @returns Promise resolving to the updated OAuth2 token
   */
  public async refreshAccessToken(token: OAuth2Token): Promise<OAuth2Token> {
    const config = this.configs[token.provider];
    if (!config) {
      throw new Error(`Provider ${token.provider} not supported`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: token.refreshToken,
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
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Calculate new expiration time
      const expiresAt = Date.now() + (data.expires_in * 1000);

      return {
        ...token,
        accessToken: data.access_token,
        expiresAt,
        // Some providers don't return a new refresh token, so keep the old one if not provided
        refreshToken: data.refresh_token || token.refreshToken
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Check if a token is expired or about to expire
   * @param token The OAuth2 token to check
   * @param bufferSeconds Optional buffer time in seconds (default: 300 - 5 minutes)
   * @returns True if the token is expired or about to expire
   */
  public isTokenExpired(token: OAuth2Token, bufferSeconds = 300): boolean {
    const bufferMs = bufferSeconds * 1000;
    return Date.now() + bufferMs >= token.expiresAt;
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @param token The OAuth2 token
   * @returns Promise resolving to a valid OAuth2 token
   */
  public async getValidToken(token: OAuth2Token): Promise<OAuth2Token> {
    if (this.isTokenExpired(token)) {
      return await this.refreshAccessToken(token);
    }
    return token;
  }
}