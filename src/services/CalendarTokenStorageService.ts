import { OAuth2Token } from '../types';
import { CalendarProvider, CalendarCredentials } from '../types/calendar';

/**
 * Service for securely storing and retrieving calendar OAuth2 tokens
 * Uses browser's localStorage with encryption for client-side storage
 */
export class CalendarTokenStorageService {
  private static instance: CalendarTokenStorageService;
  private readonly STORAGE_KEY = 'sovren_calendar_credentials';
  private readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'sovren-default-key';

  private constructor() {}

  /**
   * Get the singleton instance of CalendarTokenStorageService
   */
  public static getInstance(): CalendarTokenStorageService {
    if (!CalendarTokenStorageService.instance) {
      CalendarTokenStorageService.instance = new CalendarTokenStorageService();
    }
    return CalendarTokenStorageService.instance;
  }

  /**
   * Save calendar credentials to secure storage
   * @param credentials The calendar credentials to save
   */
  public saveCredentials(credentials: CalendarCredentials): void {
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
      console.error('Error saving calendar credentials:', error);
      throw new Error('Failed to save calendar credentials');
    }
  }

  /**
   * Get credentials for a specific calendar provider and user
   * @param provider The calendar provider
   * @param userId The user ID
   * @returns The calendar credentials or null if not found
   */
  public getCredentials(provider: CalendarProvider, userId: string): CalendarCredentials | null {
    try {
      const allCredentials = this.getAllCredentials();
      return allCredentials.find(
        cred => cred.provider === provider && cred.userId === userId
      ) || null;
    } catch (error) {
      console.error('Error getting calendar credentials:', error);
      return null;
    }
  }

  /**
   * Get all stored calendar credentials
   * @returns Array of all stored calendar credentials
   */
  public getAllCredentials(): CalendarCredentials[] {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return [];
      }
      
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error getting all calendar credentials:', error);
      return [];
    }
  }

  /**
   * Get all calendar credentials for a specific user
   * @param userId The user ID
   * @returns Array of calendar credentials for the user
   */
  public getCredentialsForUser(userId: string): CalendarCredentials[] {
    try {
      const allCredentials = this.getAllCredentials();
      return allCredentials.filter(cred => cred.userId === userId);
    } catch (error) {
      console.error('Error getting calendar credentials for user:', error);
      return [];
    }
  }

  /**
   * Delete credentials for a specific calendar provider and user
   * @param provider The calendar provider
   * @param userId The user ID
   * @returns True if credentials were deleted, false otherwise
   */
  public removeCredentials(provider: CalendarProvider, userId: string): boolean {
    try {
      const allCredentials = this.getAllCredentials();
      const filteredCredentials = allCredentials.filter(
        cred => !(cred.provider === provider && cred.userId === userId)
      );
      
      if (filteredCredentials.length === allCredentials.length) {
        return false; // No credentials were found to delete
      }
      
      // Save the filtered credentials
      const encryptedData = this.encrypt(JSON.stringify(filteredCredentials));
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
      
      return true;
    } catch (error) {
      console.error('Error removing calendar credentials:', error);
      return false;
    }
  }

  /**
   * Update tokens for a specific calendar provider and user
   * @param provider The calendar provider
   * @param userId The user ID
   * @param tokens The new OAuth2 tokens
   * @returns True if tokens were updated, false otherwise
   */
  public updateTokens(provider: CalendarProvider, userId: string, tokens: OAuth2Token): boolean {
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
      console.error('Error updating calendar tokens:', error);
      return false;
    }
  }

  /**
   * Clear all stored calendar credentials
   */
  public clearAllCredentials(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing calendar credentials:', error);
    }
  }

  /**
   * Check if credentials exist for a specific calendar provider and user
   * @param provider The calendar provider
   * @param userId The user ID
   * @returns True if credentials exist, false otherwise
   */
  public hasCredentials(provider: CalendarProvider, userId: string): boolean {
    return this.getCredentials(provider, userId) !== null;
  }

  /**
   * Get the count of stored calendar credentials
   * @returns The number of stored calendar credentials
   */
  public getCredentialsCount(): number {
    return this.getAllCredentials().length;
  }

  /**
   * Simple encryption using XOR (for demo purposes - use proper encryption in production)
   * @param data The data to encrypt
   * @returns The encrypted data
   */
  private encrypt(data: string): string {
    try {
      // Simple XOR encryption for demo purposes
      // In production, use proper encryption libraries
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
        encrypted += String.fromCharCode(charCode);
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption error:', error);
      return data;
    }
  }

  /**
   * Simple decryption using XOR (for demo purposes - use proper decryption in production)
   * @param encryptedData The encrypted data to decrypt
   * @returns The decrypted data
   */
  private decrypt(encryptedData: string): string {
    try {
      // Simple XOR decryption for demo purposes
      // In production, use proper decryption libraries
      const decoded = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData;
    }
  }
} 