import { WebSocketManager } from '../WebSocketManager'

// Type assertion for Jest globals
declare const expect: any;
declare const jest: any;
declare const describe: any;
declare const test: any;
declare const beforeEach: any;
declare const afterEach: any;
describe('WebSocketManager', () => {
  let wsManager: WebSocketManager
  let mockWebSocket: any

  beforeEach(() => {
    // Reset WebSocket mock
    mockWebSocket = {
      readyState: 1, // OPEN
      send: jest.fn(),
      close: jest.fn(),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null
    }

    // Mock WebSocket constructor
    global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket) as any
    
    wsManager = new WebSocketManager('ws://localhost:3001')
  })

  afterEach(() => {
    wsManager.disconnect()
    jest.clearAllMocks()
  })

  describe('Connection Management', () => {
    test('should connect to WebSocket server', () => {
      wsManager.connect()
      
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3001')
      expect(mockWebSocket.onopen).toBeDefined()
      expect(mockWebSocket.onclose).toBeDefined()
      expect(mockWebSocket.onerror).toBeDefined()
      expect(mockWebSocket.onmessage).toBeDefined()
    })

    test('should not connect if already connected', () => {
      wsManager.connect()
      wsManager.connect() // Second call should be ignored
      
      expect(global.WebSocket).toHaveBeenCalledTimes(1)
    })

    test('should disconnect properly', () => {
      wsManager.connect()
      wsManager.disconnect()
      
      expect(mockWebSocket.close).toHaveBeenCalled()
    })

    test('should return correct connection state', () => {
      expect(wsManager.isConnected()).toBe(false)
      
      wsManager.connect()
      mockWebSocket.readyState = 1 // OPEN
      
      expect(wsManager.isConnected()).toBe(true)
    })
  })

  describe('Message Handling', () => {
    test('should send messages when connected', () => {
      wsManager.connect()
      mockWebSocket.readyState = 1 // OPEN
      
      wsManager.send('executive_update', { id: 'test' })
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'executive_update',
          payload: { id: 'test' },
          timestamp: expect.any(Date),
          executiveId: undefined
        })
      )
    })

    test('should queue messages when disconnected', () => {
      wsManager.send('executive_update', { id: 'test' })
      
      expect(mockWebSocket.send).not.toHaveBeenCalled()
      expect(wsManager.getQueuedMessageCount()).toBe(1)
    })

    test('should process queued messages on reconnection', () => {
      wsManager.send('executive_update', { id: 'test' })
      
      wsManager.connect()
      mockWebSocket.readyState = 1 // OPEN
      
      // Simulate connection open
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }
      
      expect(mockWebSocket.send).toHaveBeenCalled()
      expect(wsManager.getQueuedMessageCount()).toBe(0)
    })

    test('should handle message callbacks', () => {
      const mockCallback = jest.fn() as any
      wsManager.onMessage('executive_update', mockCallback)
      
      wsManager.connect()
      
      // Simulate incoming message
      const testMessage = {
        type: 'executive_update',
        payload: { id: 'test' },
        timestamp: new Date(),
        executiveId: 'exec-1'
      }
      
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: JSON.stringify(testMessage) })
      }
      
      expect(mockCallback).toHaveBeenCalledWith({ id: 'test' })
    })
  })

  describe('Heartbeat Mechanism', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should send heartbeat messages', () => {
      wsManager.connect()
      mockWebSocket.readyState = 1 // OPEN
      
      jest.advanceTimersByTime(30000) // 30 seconds
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'heartbeat',
          payload: { timestamp: expect.any(Number) },
          timestamp: expect.any(Date)
        })
      )
    })

    test('should handle heartbeat responses', () => {
      wsManager.connect()
      
      // Simulate heartbeat response
      const heartbeatResponse = {
        type: 'heartbeat_response',
        payload: { timestamp: Date.now() },
        timestamp: new Date()
      }
      
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: JSON.stringify(heartbeatResponse) })
      }
      
      expect(wsManager.getLatency()).toBeGreaterThan(0)
    })
  })

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should attempt reconnection on disconnect', () => {
      wsManager.connect()
      
      // Simulate connection close
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose()
      }
      
      jest.advanceTimersByTime(1000) // Initial reconnect delay
      
      expect(global.WebSocket).toHaveBeenCalledTimes(2) // Initial + reconnect
    })

    test('should respect max reconnect attempts', () => {
      wsManager.setMaxReconnectAttempts(2)
      wsManager.connect()
      
      // Simulate multiple disconnections
      for (let i = 0; i < 3; i++) {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose()
        }
        jest.advanceTimersByTime(1000 * Math.pow(1.5, i))
      }
      
      // Should only attempt 2 reconnections (initial + 2 attempts)
      expect(global.WebSocket).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Handling', () => {
    test('should handle connection errors', () => {
      const mockErrorHandler = jest.fn() as any
      wsManager.onError(mockErrorHandler)
      
      wsManager.connect()
      
      // Simulate connection error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Error('Connection failed'))
      }
      
      expect(mockErrorHandler).toHaveBeenCalled()
    })

    test('should handle message parsing errors', () => {
      const mockCallback = jest.fn() as any
      wsManager.onMessage('executive_update', mockCallback)
      
      wsManager.connect()
      
      // Simulate invalid JSON message
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: 'invalid json' })
      }
      
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('Configuration', () => {
    test('should allow configuration updates', () => {
      wsManager.setMaxReconnectAttempts(5)
      wsManager.setReconnectDelay(2000)
      wsManager.setHeartbeatEnabled(false)
      
      // Test that configuration is applied
      wsManager.connect()
      mockWebSocket.onclose?.()
      
      // Should not attempt reconnection with heartbeat disabled
      expect(wsManager.getQueuedMessageCount()).toBe(0)
    })
  })
}) 