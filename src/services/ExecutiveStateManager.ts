import { Executive, ExecutiveState, ActivityEvent, WebSocketMessage } from '../types'

export class ExecutiveStateManager {
  private executives: Map<string, ExecutiveState> = new Map()
  private activityHistory: ActivityEvent[] = []
  private stateChangeCallbacks: Array<(states: ExecutiveState[]) => void> = []
  private websocket: WebSocket | null = null

  constructor() {
    this.initializeExecutives()
    this.setupWebSocketConnection()
  }

  private initializeExecutives(): void {
    // Initialize 8 AI executives with default states
    const executiveRoles = ['CEO', 'CFO', 'CTO', 'CMO', 'COO', 'CHRO', 'CLO', 'CSO'] as const
    
    executiveRoles.forEach((role, index) => {
      const executive: Executive = {
        id: `exec_${role.toLowerCase()}`,
        name: this.getExecutiveName(role),
        role,
        avatar: {
          modelPath: `/models/executives/${role.toLowerCase()}.glb`,
          animations: [
            { name: 'idle', duration: 5, path: '/animations/idle.glb' },
            { name: 'breathing', duration: 3, path: '/animations/breathing.glb' },
            { name: 'talking', duration: 2, path: '/animations/talking.glb' }
          ],
          scale: { x: 1, y: 1, z: 1 },
          position: this.calculateExecutivePosition(index)
        },
        currentActivity: 'idle',
        capabilities: this.getExecutiveCapabilities(role),
        authorizationLevel: this.getAuthorizationLevel(role),
        performance: {
          fps: 120,
          targetFPS: 120,
          isPerformant: true,
          memory: { used: 0, total: 0, limit: 0 },
          timestamp: Date.now()
        }
      }

      const state: ExecutiveState = {
        executive,
        isActive: false,
        currentTask: null,
        location: executive.avatar.position,
        animation: {
          current: 'idle',
          isPlaying: true,
          loop: true,
          speed: 1.0
        },
        integrationStates: []
      }

      this.executives.set(executive.id, state)
    })
  }

  private calculateExecutivePosition(index: number): { x: number; y: number; z: number } {
    // Arrange executives in semi-circle formation
    const radius = 8
    const angleStep = Math.PI / 7 // 180 degrees divided by 7 gaps
    const angle = -Math.PI/2 + (index * angleStep) // Start from left side
    
    return {
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius
    }
  }

  private getExecutiveName(role: string): string {
    const names = {
      CEO: 'Alexander Sterling',
      CFO: 'Victoria Chen',
      CTO: 'Marcus Rodriguez',
      CMO: 'Sophia Williams',
      COO: 'David Thompson',
      CHRO: 'Elena Petrov',
      CLO: 'James Morrison',
      CSO: 'Isabella Garcia'
    }
    return names[role as keyof typeof names] || role
  }

  private getExecutiveCapabilities(role: string) {
    const capabilities = {
      CEO: [
        { name: 'Strategic Planning', level: 'expert' as const, description: 'Long-term business strategy' },
        { name: 'Leadership', level: 'expert' as const, description: 'Team and organizational leadership' }
      ],
      CFO: [
        { name: 'Financial Analysis', level: 'expert' as const, description: 'Financial planning and analysis' },
        { name: 'Risk Management', level: 'expert' as const, description: 'Financial risk assessment' }
      ],
      CTO: [
        { name: 'Technology Strategy', level: 'expert' as const, description: 'Technical architecture and innovation' },
        { name: 'System Integration', level: 'expert' as const, description: 'Complex system integration' }
      ]
      // Add more as needed
    }
    return capabilities[role as keyof typeof capabilities] || []
  }

  private getAuthorizationLevel(role: string): number {
    const levels = {
      CEO: 100000, // $100K
      CFO: 75000,  // $75K
      COO: 50000,  // $50K
      CTO: 25000,  // $25K
      CMO: 25000,  // $25K
      CHRO: 15000, // $15K
      CLO: 20000,  // $20K
      CSO: 30000   // $30K
    }
    return levels[role as keyof typeof levels] || 10000
  }

  private setupWebSocketConnection(): void {
    // WebSocket connection for real-time state synchronization
    try {
      this.websocket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001')
      
      this.websocket.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleWebSocketMessage(message)
      }

      this.websocket.onopen = () => {
        console.log('Executive state WebSocket connected')
      }

      this.websocket.onerror = (error) => {
        console.error('Executive state WebSocket error:', error)
      }
    } catch (error) {
      console.warn('WebSocket connection failed, running in offline mode')
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'executive_update':
        if (message.executiveId) {
          this.updateExecutiveState(message.executiveId, message.payload)
        }
        break
      case 'activity_event':
        this.addActivityEvent(message.payload)
        break
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  public getExecutiveStates(): ExecutiveState[] {
    return Array.from(this.executives.values())
  }

  public getExecutiveState(id: string): ExecutiveState | undefined {
    return this.executives.get(id)
  }

  public updateExecutiveState(id: string, updates: Partial<ExecutiveState>): void {
    const currentState = this.executives.get(id)
    if (currentState) {
      const updatedState = { ...currentState, ...updates }
      this.executives.set(id, updatedState)
      this.notifyStateChange()
    }
  }

  public updateExecutiveActivity(id: string, activity: ActivityEvent): void {
    const state = this.executives.get(id)
    if (state) {
      state.executive.currentActivity = activity.type
      state.isActive = activity.type !== 'idle'
      this.executives.set(id, state)
      this.addActivityEvent(activity)
      this.notifyStateChange()
    }
  }

  private addActivityEvent(event: ActivityEvent): void {
    this.activityHistory.push(event)
    // Keep only last 1000 events to prevent memory issues
    if (this.activityHistory.length > 1000) {
      this.activityHistory = this.activityHistory.slice(-1000)
    }
  }

  public getActivityHistory(executiveId?: string): ActivityEvent[] {
    if (executiveId) {
      return this.activityHistory.filter(event => event.executiveId === executiveId)
    }
    return this.activityHistory
  }

  public onStateChange(callback: (states: ExecutiveState[]) => void): void {
    this.stateChangeCallbacks.push(callback)
  }

  public removeStateChangeCallback(callback: (states: ExecutiveState[]) => void): void {
    const index = this.stateChangeCallbacks.indexOf(callback)
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1)
    }
  }

  private notifyStateChange(): void {
    const states = this.getExecutiveStates()
    this.stateChangeCallbacks.forEach(callback => callback(states))
  }

  public dispose(): void {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    this.stateChangeCallbacks = []
  }
}