import { OAuth2Token, EmailCredentials, EmailProvider } from '../types';

/**
 * Service for securely storing and retrieving OAuth2 tokens
 * Uses browser's localStorage with encryption for client-side storage
 * In a production environment, consider using more secure alternatives like:
 * - HttpOnly cookies
 * - Server-side token storage with session identifiers
 * - Secure browser storage APIs
 */
export class TokenStorageService {
  private static instance: TokenStorageService;
  private readonly STORAGE_KEY = 'sovren_email_credentials';
  private readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'sovren-default-key';

  private constructor() {}

  /**
   * Get the singleton instance of TokenStorageService
   */
  public static getInstance(): TokenStorageService {
    if (!TokenStorageService.instance) {
      TokenStorageService.instance = new TokenStorageService();
    }
    return TokenStorageService.instance;
  }

  /**
   * Save email credentials to secure storage
   * @param credentials The email credentials to save
   */
  public saveCredentials(credentials: EmailCredentials): void {
    try {
      // Get existing credentials
      const existingCredentials = this.getAllCredentials();
      
      // Find index of existing credentials for this provider and user
      const index = existingCredentials.findIndex(
        cred => cred.provider === credentials.provider && cred.userId === credentials.userId
      );
      
      // Update or add credentials
      if (index >= 0) {
        existingCredentials[index] = credentials;
      } else {
        existingCredentials.push(credentials);
      }
      
      // Encrypt and save
      const encryptedData = this.encrypt(JSON.stringify(existingCredentials));
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw new Error('Failed to save credentials');
    }
  }

  /**
   * Get credentials for a specific provider and user
   * @param provider The email provider
   * @param userId The user ID
   * @returns The email credentials or null if not found
   */
  public getCredentials(provider: EmailProvider, userId: string): EmailCredentials | null {
    try {
      const allCredentials = this.getAllCredentials();
      return allCredentials.find(
        cred => cred.provider === provider && cred.userId === userId
      ) || null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }

  /**
   * Get all stored email credentials
   * @returns Array of all stored email credentials
   */
  public getAllCredentials(): EmailCredentials[] {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return [];
      }
      
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error getting all credentials:', error);
      return [];
    }
  }

  /**
   * Delete credentials for a specific provider and user
   * @param provider The email provider
   * @param userId The user ID
   * @returns True if credentials were deleted, false otherwise
   */
  public deleteCredentials(provider: EmailProvider, userId: string): boolean {
    try {
      const allCredentials = this.getAllCredentials();
      const initialLength = allCredentials.length;
      
      const filteredCredentials = allCredentials.filter(
        cred => !(cred.provider === provider && cred.userId === userId)
      );
      
      if (filteredCredentials.length < initialLength) {
        const encryptedData = this.encrypt(JSON.stringify(filteredCredentials));
        localStorage.setItem(this.STORAGE_KEY, encryptedData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  }

  /**
   * Update tokens for a specific provider and user
   * @param provider The email provider
   * @param userId The user ID
   * @param tokens The updated OAuth2 tokens
   * @returns True if tokens were updated, false otherwise
   */
  public updateTokens(provider: EmailProvider, userId: string, tokens: OAuth2Token): boolean {
    try {
      const credentials = this.getCredentials(provider, userId);
      if (!credentials) {
        return false;
      }
      
      credentials.tokens = tokens;
      credentials.lastSynced = new Date();
      
      this.saveCredentials(credentials);
      return true;
    } catch (error) {
      console.error('Error updating tokens:', error);
      return false;
    }
  }

  /**
   * Simple encryption function
   * Note: This is a basic implementation for demonstration purposes
   * In a production environment, use a proper encryption library
   * @param data The data to encrypt
   * @returns The encrypted data
   */
  private encrypt(data: string): string {
    // In a real implementation, use a proper encryption library
    // This is just a placeholder for demonstration
    return btoa(data);
  }

  /**
   * Simple decryption function
   * Note: This is a basic implementation for demonstration purposes
   * In a production environment, use a proper decryption library
   * @param encryptedData The encrypted data
   * @returns The decrypted data
   */
  private decrypt(encryptedData: string): string {
    // In a real implementation, use a proper decryption library
    // This is just a placeholder for demonstration
    return atob(encryptedData);
  }
}