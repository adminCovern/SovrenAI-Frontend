import { Executive, ExecutiveRole, ActivityType } from '../types'

/**
 * Default executive data for the 8 AI executives
 */
export const executives: Executive[] = [
  {
    id: 'exec-1',
    name: 'Marcus Chen',
    role: 'CEO',
    avatar: {
      modelPath: '/models/executives/ceo.glb',
      animations: [
        { name: 'breathing', duration: 4, path: '/animations/breathing.glb' },
        { name: 'talking', duration: 2, path: '/animations/talking.glb' },
        { name: 'thinking', duration: 3, path: '/animations/thinking.glb' }
      ],
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 } // Will be positioned by ExecutiveAvatarManager
    },
    currentActivity: 'idle' as ActivityType,
    capabilities: [
      { name: 'leadership', level: 'expert', description: 'Strategic decision making and company vision' },
      { name: 'negotiation', level: 'expert', description: 'High-stakes deal negotiation' },
      { name: 'communication', level: 'expert', description: 'Clear and persuasive communication' }
    ],
    authorizationLevel: 5,
    performance: {
      fps: 0,
      targetFPS: 120,
      isPerformant: true,
      memory: { used: 0, total: 0, limit: 0 },
      timestamp: 0
    }
  },
  {
    id: 'exec-2',
    name: 'Sophia Rodriguez',
    role: 'CFO',
    avatar: {
      modelPath: '/models/executives/cfo.glb',
      animations: [
        { name: 'breathing', duration: 4, path: '/animations/breathing.glb' },
        { name: 'analyzing', duration: 3, path: '/animations/analyzing.glb' },
        { name: 'presenting', duration: 2.5, path: '/animations/presenting.glb' }
      ],
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    },
    currentActivity: 'idle' as ActivityType,
    capabilities: [
      { name: 'financial_analysis', level: 'expert', description: 'Deep financial analysis and forecasting' },
      { name: 'risk_management', level: 'expert', description: 'Comprehensive risk assessment' },
      { name: 'investment_strategy', level: 'advanced', description: 'Strategic investment planning' }
    ],
    authorizationLevel: 4,
    performance: {
      fps: 0,
      targetFPS: 120,
      isPerformant: true,
      memory: { used: 0, total: 0, limit: 0 },
      timestamp: 0
    }
  },
  {
    id: 'exec-3',
    name: 'Raj Patel',
    role: 'CTO',
    avatar: {
      modelPath: '/models/executives/cto.glb',
      animations: [
        { name: 'breathing', duration: 4, path: '/animations/breathing.glb' },
        { name: 'coding', duration: 3, path: '/animations/coding.glb' },
        { name: 'architecting', duration: 2.5, path: '/animations/architecting.glb' }
      ],
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    },
    currentActivity: 'idle' as ActivityType,
    capabilities: [
      { name: 'system_architecture', level: 'expert', description: 'Complex system design and architecture' },
      { name: 'technical_leadership', level: 'expert', description: 'Technical team leadership' },
      { name: 'innovation', level: 'expert', description: 'Cutting-edge technology innovation' }
    ],
    authorizationLevel: 4,
    performance: {
      fps: 0,
      targetFPS: 120,
      isPerformant: true,
      memory: { used: 0, total: 0, limit: 0 },
      timestamp: 0
    }
  },
  {
    id: 'exec-4',
    name: 'Emma Johnson',
    role: 'CMO',
    avatar: {
      modelPath: '/models/executives/cmo.glb',
      animations: [
        { name: 'breathing', duration: 4, path: '/animations/breathing.glb' },
        { name: 'presenting', duration: 2.5, path: '/animations/presenting.glb' },
        { name: 'brainstorming', duration: 3, path: '/animations/brainstorming.glb' }
      ],
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    },
    currentActivity: 'idle' as ActivityType,
    capabilities: [
      { name: 'brand_strategy', level: 'expert', description: 'Comprehensive brand development and strategy' },
      { name: 'market_analysis', level: 'expert', description: 'In-depth market research and analysis' },
      { name: 'campaign_management', level: 'advanced', description: 'Multi-channel campaign orchestration' }
    ],
    authorizationLevel: 3,
    performance: {
      fps: 0,
      targetFPS: 120,
      isPerformant: true,
      memory: { used: 0, total: 0, limit: 0 },
      timestamp: 0
    }
  },
  {
    id: 'exec-5',
    name: 'David Kim',
    role: 'COO',
    avatar: {
      modelPath: '/models/executives/coo.glb',
      animations: [
        { name: 'breathing', duration: 4, path: '/animations/breathing.glb' },
        { name: 'organizing', duration: 2.5, path: '/animations/organizing.glb' },
        { name: 'directing', duration: 3, path: '/animations/directing.glb' }
      ],
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    },
    currentActivity: 'idle' as ActivityType,
    capabilities: [
      { name: 'operations_management', level: 'expert', description: 'Streamlined operational efficiency' },
      { name: 'process_optimization', level: 'expert', description: 'Business process improvement' },
      { name: 'supply_chain', level: 'advanced', description: 'Supply chain optimization' }
    ],
    authorizationLevel: 4,
    performance: {
      fps: 0,
      targetFPS: 120,
      isPerformant: true,
      memory: { used: 0, total: 0, limit: 0 },
      timestamp: 0
    }
  },
  {
    id: 'exec-6',
    name: 'Aisha Washington',
    role: 'CHRO',
    avatar: {
      modelPath: '/models/executives/chro.glb',
      animations: [
        { name: 'breathing', duration: 4, path: '/animations/breathing.glb' },
        { name: 'interviewing', duration: 3, path: '/animations/interviewing.glb' },
        { name: 'counseling', duration: 2.5, path: '/animations/counseling.glb' }
      ],
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    },
    currentActivity: 'idle' as ActivityType,
    capabilities: [
      { name: 'talent_acquisition', level: 'expert', description: 'Strategic talent recruitment' },
      { name: 'employee_development', level: 'expert', description: 'Comprehensive employee growth programs' },
      { name: 'culture_building', level: 'advanced', description: 'Positive workplace culture cultivation' }
    ],
    authorizationLevel: 3,
    performance: {
      fps: 0,
      targetFPS: 120,
      isPerformant: true,
      memory: { used: 0, total: 0, limit: 0 },
      timestamp: 0
    }
  },
  {
    id: 'exec-7',
    name: 'Michael Blackwell',
    role: 'CLO',
    avatar: {
      modelPath: '/models/executives/clo.glb',
      animations: [
        { name: 'breathing', duration: 4, path: '/animations/breathing.glb' },
        { name: 'reviewing', duration: 3, path: '/animations/reviewing.glb' },
        { name: 'advising', duration: 2.5, path: '/animations/advising.glb' }
      ],
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    },
    currentActivity: 'idle' as ActivityType,
    capabilities: [
      { name: 'legal_strategy', level: 'expert', description: 'Comprehensive legal risk management' },
      { name: 'contract_negotiation', level: 'expert', description: 'Complex contract development' },
      { name: 'compliance', level: 'expert', description: 'Regulatory compliance management' }
    ],
    authorizationLevel: 4,
    performance: {
      fps: 0,
      targetFPS: 120,
      isPerformant: true,
      memory: { used: 0, total: 0, limit: 0 },
      timestamp: 0
    }
  },
  {
    id: 'exec-8',
    name: 'Sarah Liu',
    role: 'CSO',
    avatar: {
      modelPath: '/models/executives/cso.glb',
      animations: [
        { name: 'breathing', duration: 4, path: '/animations/breathing.glb' },
        { name: 'analyzing', duration: 3, path: '/animations/analyzing.glb' },
        { name: 'presenting', duration: 2.5, path: '/animations/presenting.glb' }
      ],
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 }
    },
    currentActivity: 'idle' as ActivityType,
    capabilities: [
      { name: 'sales_strategy', level: 'expert', description: 'Revenue growth strategy development' },
      { name: 'client_relationship', level: 'expert', description: 'High-value client relationship management' },
      { name: 'market_expansion', level: 'advanced', description: 'New market entry strategy' }
    ],
    authorizationLevel: 3,
    performance: {
      fps: 0,
      targetFPS: 120,
      isPerformant: true,
      memory: { used: 0, total: 0, limit: 0 },
      timestamp: 0
    }
  }
]

/**
 * Generate initial executive states from executive data
 */
export const generateInitialExecutiveStates = () => {
  return executives.map(executive => ({
    executive,
    isActive: false,
    currentTask: null,
    location: { x: 0, y: 0, z: 0 },
    animation: {
      current: 'breathing',
      isPlaying: true,
      loop: true,
      speed: 1.0
    },
    integrationStates: []
  }))
}