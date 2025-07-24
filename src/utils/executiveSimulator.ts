import { ActivityType, ExecutiveState } from '../types'

/**
 * Utility to simulate executive activities for testing the avatar system
 */
export class ExecutiveSimulator {
  private intervalId: NodeJS.Timeout | null = null
  private updateCallback: ((states: ExecutiveState[]) => void) | null = null

  /**
   * Start simulating executive activities
   */
  public startSimulation(
    initialStates: ExecutiveState[],
    onUpdate: (states: ExecutiveState[]) => void,
    intervalMs: number = 5000
  ): void {
    this.updateCallback = onUpdate
    
    // Start the simulation loop
    this.intervalId = setInterval(() => {
      const updatedStates = this.simulateActivityChanges(initialStates)
      onUpdate(updatedStates)
    }, intervalMs)
  }

  /**
   * Stop the simulation
   */
  public stopSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.updateCallback = null
  }

  /**
   * Simulate random activity changes for executives
   */
  private simulateActivityChanges(states: ExecutiveState[]): ExecutiveState[] {
    const activities: ActivityType[] = ['idle', 'email', 'call', 'meeting', 'analysis', 'approval']
    
    return states.map(state => {
      // 30% chance to change activity
      if (Math.random() < 0.3) {
        const newActivity = activities[Math.floor(Math.random() * activities.length)]
        const isActive = newActivity !== 'idle'
        
        return {
          ...state,
          isActive,
          executive: {
            ...state.executive,
            currentActivity: newActivity
          },
          animation: {
            ...state.animation,
            current: isActive ? newActivity : 'breathing',
            speed: isActive ? 1.2 : 1.0
          }
        }
      }
      
      return state
    })
  }

  /**
   * Manually trigger an activity for a specific executive
   */
  public triggerActivity(
    states: ExecutiveState[],
    executiveId: string,
    activity: ActivityType
  ): ExecutiveState[] {
    return states.map(state => {
      if (state.executive.id === executiveId) {
        const isActive = activity !== 'idle'
        
        return {
          ...state,
          isActive,
          executive: {
            ...state.executive,
            currentActivity: activity
          },
          animation: {
            ...state.animation,
            current: isActive ? activity : 'breathing',
            speed: isActive ? 1.2 : 1.0
          }
        }
      }
      
      return state
    })
  }

  /**
   * Create a realistic scenario where executives interact
   */
  public createScenario(states: ExecutiveState[], scenarioName: string): ExecutiveState[] {
    switch (scenarioName) {
      case 'board_meeting':
        return this.createBoardMeetingScenario(states)
      case 'crisis_response':
        return this.createCrisisResponseScenario(states)
      case 'quarterly_review':
        return this.createQuarterlyReviewScenario(states)
      default:
        return states
    }
  }

  private createBoardMeetingScenario(states: ExecutiveState[]): ExecutiveState[] {
    return states.map(state => {
      const { role } = state.executive
      let activity: ActivityType = 'meeting'
      
      // CEO leads the meeting
      if (role === 'CEO') {
        activity = 'meeting'
      }
      // CFO presents financial data
      else if (role === 'CFO') {
        activity = 'analysis'
      }
      // Others are in meeting mode
      else {
        activity = 'meeting'
      }
      
      return {
        ...state,
        isActive: true,
        executive: {
          ...state.executive,
          currentActivity: activity
        },
        animation: {
          ...state.animation,
          current: activity,
          speed: 1.1
        }
      }
    })
  }

  private createCrisisResponseScenario(states: ExecutiveState[]): ExecutiveState[] {
    return states.map(state => {
      const { role } = state.executive
      let activity: ActivityType = 'call'
      
      // Different roles have different crisis responses
      switch (role) {
        case 'CEO':
          activity = 'call' // Emergency calls
          break
        case 'CLO':
          activity = 'analysis' // Legal analysis
          break
        case 'CMO':
          activity = 'email' // Crisis communication
          break
        case 'CTO':
          activity = 'analysis' // Technical assessment
          break
        default:
          activity = 'call'
      }
      
      return {
        ...state,
        isActive: true,
        executive: {
          ...state.executive,
          currentActivity: activity
        },
        animation: {
          ...state.animation,
          current: activity,
          speed: 1.3 // Faster pace during crisis
        }
      }
    })
  }

  private createQuarterlyReviewScenario(states: ExecutiveState[]): ExecutiveState[] {
    return states.map(state => {
      const { role } = state.executive
      let activity: ActivityType = 'analysis'
      
      // Different roles focus on different aspects
      switch (role) {
        case 'CEO':
          activity = 'meeting' // Strategic review
          break
        case 'CFO':
          activity = 'analysis' // Financial analysis
          break
        case 'CMO':
          activity = 'analysis' // Marketing metrics
          break
        case 'CHRO':
          activity = 'analysis' // HR metrics
          break
        default:
          activity = 'analysis'
      }
      
      return {
        ...state,
        isActive: true,
        executive: {
          ...state.executive,
          currentActivity: activity
        },
        animation: {
          ...state.animation,
          current: activity,
          speed: 1.0
        }
      }
    })
  }
}

// Export a singleton instance
export const executiveSimulator = new ExecutiveSimulator()