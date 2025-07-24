/**
 * Production-grade error handling utility
 * Provides centralized error management, logging, and recovery mechanisms
 */

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  timestamp: number
  userAgent?: string
  url?: string
}

export interface ErrorReport {
  id: string
  error: Error
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  handled: boolean
  recoveryAttempted: boolean
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorReports: ErrorReport[] = []
  private maxReports = 1000
  private errorCallbacks: Array<(report: ErrorReport) => void> = []
  private isProduction: boolean

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.setupGlobalErrorHandlers()
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle errors with context and severity
   */
  public handleError(
    error: Error,
    context: Partial<ErrorContext> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      error,
      context: {
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        ...context
      },
      severity,
      handled: false,
      recoveryAttempted: false
    }

    this.errorReports.push(errorReport)
    
    // Maintain report limit
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports)
    }

    // Log error based on severity
    this.logError(errorReport)

    // Attempt recovery for critical errors
    if (severity === 'critical') {
      this.attemptRecovery(errorReport)
    }

    // Notify callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorReport)
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError)
      }
    })

    // Re-throw in development
    if (!this.isProduction) {
      throw error
    }
  }

  /**
   * Handle async errors
   */
  public async handleAsyncError<T>(
    promise: Promise<T>,
    context?: Partial<ErrorContext>,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<T | null> {
    try {
      return await promise
    } catch (error) {
      this.handleError(error as Error, context, severity)
      return null
    }
  }

  /**
   * Wrap functions with error handling
   */
  public wrapFunction<T extends (...args: any[]) => any>(
    fn: T,
    context?: Partial<ErrorContext>,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): (...args: Parameters<T>) => ReturnType<T> | null {
    return (...args: Parameters<T>): ReturnType<T> | null => {
      try {
        return fn(...args)
      } catch (error) {
        this.handleError(error as Error, context, severity)
        return null
      }
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(
          new Error(event.reason || 'Unhandled promise rejection'),
          { action: 'unhandledrejection' },
          'high'
        )
        event.preventDefault()
      })

      // Handle JavaScript errors
      window.addEventListener('error', (event) => {
        this.handleError(
          new Error(event.message || 'JavaScript error'),
          { 
            action: 'javascript_error',
            url: event.filename,
            component: event.filename?.split('/').pop()
          },
          'high'
        )
        event.preventDefault()
      })
    }

    // Handle Node.js uncaught exceptions
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.handleError(error, { action: 'uncaughtException' }, 'critical')
      })

      process.on('unhandledRejection', (reason) => {
        this.handleError(
          new Error(reason as string || 'Unhandled promise rejection'),
          { action: 'unhandledRejection' },
          'critical'
        )
      })
    }
  }

  /**
   * Log error based on severity and environment
   */
  private logError(report: ErrorReport): void {
    const { error, context, severity } = report

    const logMessage = {
      severity,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    }

    switch (severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', logMessage)
        // In production, send to external logging service
        if (this.isProduction) {
          this.sendToLoggingService(logMessage)
        }
        break
      case 'high':
        console.error('❌ HIGH SEVERITY ERROR:', logMessage)
        break
      case 'medium':
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logMessage)
        break
      case 'low':
        console.log('ℹ️ LOW SEVERITY ERROR:', logMessage)
        break
    }
  }

  /**
   * Attempt recovery for critical errors
   */
  private attemptRecovery(report: ErrorReport): void {
    report.recoveryAttempted = true

    // Attempt to recover WebSocket connections
    if (report.error.message.includes('WebSocket')) {
      this.attemptWebSocketRecovery()
    }

    // Attempt to recover Redux store
    if (report.error.message.includes('Redux') || report.error.message.includes('store')) {
      this.attemptStoreRecovery()
    }

    // Attempt to recover Three.js context
    if (report.error.message.includes('WebGL') || report.error.message.includes('Three')) {
      this.attemptWebGLRecovery()
    }

    // Attempt to recover memory
    if (report.error.message.includes('memory') || report.error.message.includes('heap')) {
      this.attemptMemoryRecovery()
    }
  }

  /**
   * Attempt WebSocket recovery
   */
  private attemptWebSocketRecovery(): void {
    try {
      // Import and reconnect WebSocket manager
      const { wsManager } = require('../store')
      if (wsManager && typeof wsManager.reconnect === 'function') {
        wsManager.reconnect()
        console.log('✅ WebSocket recovery attempted')
      }
    } catch (error) {
      console.error('❌ WebSocket recovery failed:', error)
    }
  }

  /**
   * Attempt Redux store recovery
   */
  private attemptStoreRecovery(): void {
    try {
      // Reset store to initial state
      const { store } = require('../store')
      if (store && typeof store.dispatch === 'function') {
        // Dispatch reset actions for each slice
        const resetActions = [
          'executives/reset',
          'activities/reset',
          'performance/reset',
          'connection/reset',
          'raft/reset',
          'emailAuth/reset',
          'email/reset',
          'approvals/reset'
        ]
        
        resetActions.forEach(actionType => {
          try {
            store.dispatch({ type: actionType })
          } catch (e) {
            // Ignore individual action failures
          }
        })
        
        console.log('✅ Redux store recovery attempted')
      }
    } catch (error) {
      console.error('❌ Redux store recovery failed:', error)
    }
  }

  /**
   * Attempt WebGL recovery
   */
  private attemptWebGLRecovery(): void {
    try {
      // Force garbage collection if available
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc()
      }
      
      // Clear Three.js cache
      const THREE = require('three')
      if (THREE && THREE.Cache) {
        THREE.Cache.clear()
      }
      
      console.log('✅ WebGL recovery attempted')
    } catch (error) {
      console.error('❌ WebGL recovery failed:', error)
    }
  }

  /**
   * Attempt memory recovery
   */
  private attemptMemoryRecovery(): void {
    try {
      // Force garbage collection if available
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc()
      }
      
      // Clear any cached data
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear non-essential cached data
        const keysToKeep = ['auth_token', 'user_preferences']
        const keysToRemove = Object.keys(localStorage).filter(
          key => !keysToKeep.includes(key)
        )
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
      
      console.log('✅ Memory recovery attempted')
    } catch (error) {
      console.error('❌ Memory recovery failed:', error)
    }
  }

  /**
   * Send error to external logging service
   */
  private sendToLoggingService(logMessage: any): void {
    // In production, send to your preferred logging service
    // Example: Sentry, LogRocket, DataDog, etc.
    if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logMessage)
      }).catch(() => {
        // Silently fail if logging service is unavailable
      })
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Register error callback
   */
  public onError(callback: (report: ErrorReport) => void): void {
    this.errorCallbacks.push(callback)
  }

  /**
   * Get error reports
   */
  public getErrorReports(): ErrorReport[] {
    return [...this.errorReports]
  }

  /**
   * Clear error reports
   */
  public clearErrorReports(): void {
    this.errorReports = []
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number
    bySeverity: Record<string, number>
    byComponent: Record<string, number>
    recentErrors: ErrorReport[]
  } {
    const bySeverity: Record<string, number> = {}
    const byComponent: Record<string, number> = {}
    
    this.errorReports.forEach(report => {
      bySeverity[report.severity] = (bySeverity[report.severity] || 0) + 1
      if (report.context.component) {
        byComponent[report.context.component] = (byComponent[report.context.component] || 0) + 1
      }
    })

    return {
      total: this.errorReports.length,
      bySeverity,
      byComponent,
      recentErrors: this.errorReports.slice(-10) // Last 10 errors
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Export convenience functions
export const handleError = (error: Error, context?: Partial<ErrorContext>, severity?: 'low' | 'medium' | 'high' | 'critical') => {
  errorHandler.handleError(error, context, severity)
}

export const handleAsyncError = <T>(
  promise: Promise<T>,
  context?: Partial<ErrorContext>,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): Promise<T | null> => {
  return errorHandler.handleAsyncError(promise, context, severity)
}

export const wrapFunction = <T extends (...args: any[]) => any>(
  fn: T,
  context?: Partial<ErrorContext>,
  severity?: 'low' | 'medium' | 'high' | 'critical'
) => {
  return errorHandler.wrapFunction(fn, context, severity)
} 