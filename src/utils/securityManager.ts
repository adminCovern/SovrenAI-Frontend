/**
 * Production-grade security manager
 * Provides input validation, XSS protection, CSRF protection, and security monitoring
 */

export interface SecurityConfig {
  enableXSSProtection: boolean
  enableCSRFProtection: boolean
  enableInputValidation: boolean
  enableRateLimiting: boolean
  enableSecurityHeaders: boolean
  maxRequestSize: number // bytes
  allowedOrigins: string[]
  blockedPatterns: RegExp[]
}

export interface SecurityEvent {
  id: string
  type: 'xss' | 'csrf' | 'injection' | 'rate_limit' | 'validation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  userAgent?: string
  ip?: string
  url?: string
  payload?: any
}

export class SecurityManager {
  private static instance: SecurityManager
  private config: SecurityConfig
  private securityEvents: SecurityEvent[] = []
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map()
  private maxEvents = 1000
  private securityCallbacks: Array<(event: SecurityEvent) => void> = []

  private constructor() {
    this.config = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableInputValidation: true,
      enableRateLimiting: true,
      enableSecurityHeaders: true,
      maxRequestSize: 1024 * 1024, // 1MB
      allowedOrigins: ['https://sovren.ai', 'https://localhost:3000'],
      blockedPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi
      ]
    }

    this.setupSecurityHeaders()
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  /**
   * Setup security headers
   */
  private setupSecurityHeaders(): void {
    if (typeof window !== 'undefined' && this.config.enableSecurityHeaders) {
      // Set CSP header if possible
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
      document.head.appendChild(meta)
    }
  }

  /**
   * Validate and sanitize input
   */
  public validateInput(input: any, context: string = 'general'): {
    isValid: boolean
    sanitized: any
    errors: string[]
  } {
    const errors: string[] = []
    let sanitized = input

    if (!this.config.enableInputValidation) {
      return { isValid: true, sanitized, errors }
    }

    // Check for blocked patterns
    if (typeof input === 'string') {
      for (const pattern of this.config.blockedPatterns) {
        if (pattern.test(input)) {
          errors.push(`Blocked pattern detected: ${pattern.source}`)
          this.logSecurityEvent('xss', 'high', `Blocked pattern in ${context}: ${pattern.source}`)
        }
      }

      // Sanitize HTML
      if (this.config.enableXSSProtection) {
        sanitized = this.sanitizeHTML(input)
      }
    }

    // Check input size
    const inputSize = JSON.stringify(input).length
    if (inputSize > this.config.maxRequestSize) {
      errors.push(`Input size exceeds limit: ${inputSize} bytes`)
      this.logSecurityEvent('validation', 'medium', `Large input detected: ${inputSize} bytes`)
    }

    // Validate object structure
    if (typeof input === 'object' && input !== null) {
      const validationResult = this.validateObject(input, context)
      errors.push(...validationResult.errors)
      sanitized = validationResult.sanitized
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    }
  }

  /**
   * Validate object structure
   */
  private validateObject(obj: any, context: string): {
    sanitized: any
    errors: string[]
  } {
    const errors: string[] = []
    const sanitized: any = {}

    for (const [key, value] of Object.entries(obj)) {
      // Validate key
      if (typeof key !== 'string' || key.length > 100) {
        errors.push(`Invalid key in ${context}: ${key}`)
        continue
      }

      // Validate value
      if (typeof value === 'string') {
        const validation = this.validateInput(value, `${context}.${key}`)
        if (!validation.isValid) {
          errors.push(...validation.errors)
        } else {
          sanitized[key] = validation.sanitized
        }
      } else if (typeof value === 'object' && value !== null) {
        const validation = this.validateObject(value, `${context}.${key}`)
        errors.push(...validation.errors)
        sanitized[key] = validation.sanitized
      } else {
        sanitized[key] = value
      }
    }

    return { sanitized, errors }
  }

  /**
   * Sanitize HTML content
   */
  private sanitizeHTML(input: string): string {
    // Remove script tags and event handlers
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')

    // Remove dangerous attributes
    sanitized = sanitized.replace(/\s+(on\w+|javascript|vbscript|data)\s*=\s*["'][^"']*["']/gi, '')

    return sanitized
  }

  /**
   * Validate CSRF token
   */
  public validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!this.config.enableCSRFProtection) {
      return true
    }

    if (!token || !expectedToken) {
      this.logSecurityEvent('csrf', 'high', 'Missing CSRF token')
      return false
    }

    if (token !== expectedToken) {
      this.logSecurityEvent('csrf', 'critical', 'Invalid CSRF token')
      return false
    }

    return true
  }

  /**
   * Generate CSRF token
   */
  public generateCSRFToken(): string {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    return token
  }

  /**
   * Check rate limiting
   */
  public checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
    if (!this.config.enableRateLimiting) {
      return true
    }

    const now = Date.now()
    const key = identifier
    const current = this.rateLimitMap.get(key)

    if (!current || now > current.resetTime) {
      // First request or window expired
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return true
    }

    if (current.count >= limit) {
      this.logSecurityEvent('rate_limit', 'medium', `Rate limit exceeded for ${identifier}`)
      return false
    }

    current.count++
    return true
  }

  /**
   * Validate origin
   */
  public validateOrigin(origin: string): boolean {
    if (!origin) return false

    return this.config.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = new RegExp(allowedOrigin.replace('*', '.*'))
        return pattern.test(origin)
      }
      return origin === allowedOrigin
    })
  }

  /**
   * Log security event
   */
  public logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    message: string,
    payload?: any
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      message,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      payload
    }

    this.securityEvents.push(event)

    // Maintain event limit
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxEvents)
    }

    // Log based on severity
    switch (severity) {
      case 'critical':
        console.error('🚨 CRITICAL SECURITY EVENT:', event)
        break
      case 'high':
        console.error('❌ HIGH SECURITY EVENT:', event)
        break
      case 'medium':
        console.warn('⚠️ MEDIUM SECURITY EVENT:', event)
        break
      case 'low':
        console.log('ℹ️ LOW SECURITY EVENT:', event)
        break
    }

    // Notify callbacks
    this.securityCallbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in security callback:', error)
      }
    })

    // Send to security monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityService(event)
    }
  }

  /**
   * Send event to security monitoring service
   */
  private sendToSecurityService(event: SecurityEvent): void {
    if (process.env.NEXT_PUBLIC_SECURITY_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_SECURITY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => {
        // Silently fail if security service is unavailable
      })
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Register security callback
   */
  public onSecurityEvent(callback: (event: SecurityEvent) => void): void {
    this.securityCallbacks.push(callback)
  }

  /**
   * Get security events
   */
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents]
  }

  /**
   * Get security statistics
   */
  public getSecurityStats(): {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    recentEvents: SecurityEvent[]
  } {
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    this.securityEvents.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1
    })

    return {
      total: this.securityEvents.length,
      byType,
      bySeverity,
      recentEvents: this.securityEvents.slice(-10) // Last 10 events
    }
  }

  /**
   * Update security configuration
   */
  public updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Clear security events
   */
  public clearSecurityEvents(): void {
    this.securityEvents = []
  }

  /**
   * Clear rate limit data
   */
  public clearRateLimits(): void {
    this.rateLimitMap.clear()
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.securityCallbacks = []
    this.securityEvents = []
    this.rateLimitMap.clear()
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance()

// Export convenience functions
export const validateInput = (input: any, context?: string) => {
  return securityManager.validateInput(input, context)
}

export const validateCSRFToken = (token: string, expectedToken: string) => {
  return securityManager.validateCSRFToken(token, expectedToken)
}

export const generateCSRFToken = () => {
  return securityManager.generateCSRFToken()
}

export const checkRateLimit = (identifier: string, limit?: number, windowMs?: number) => {
  return securityManager.checkRateLimit(identifier, limit, windowMs)
}

export const validateOrigin = (origin: string) => {
  return securityManager.validateOrigin(origin)
}

export const logSecurityEvent = (
  type: 'xss' | 'csrf' | 'injection' | 'rate_limit' | 'validation',
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  payload?: any
) => {
  securityManager.logSecurityEvent(type, severity, message, payload)
} 