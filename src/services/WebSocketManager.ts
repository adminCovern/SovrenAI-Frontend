import { WebSocketMessage, MessageType } from '../types'

/**
 * WebSocketManager handles real-time communication with the server
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Message type handling
 * - Connection status monitoring
 * - Heartbeat mechanism to detect disconnections
 */
export class WebSocketManager {
    private socket: WebSocket | null = null
    private url: string
    private reconnectAttempts: number = 0
    private maxReconnectAttempts: number = 10
    private reconnectDelay: number = 1000
    private messageHandlers: Map<MessageType, ((payload: any) => void)[]> = new Map()
    private connectionHandlers: {
        onOpen: (() => void)[]
        onClose: (() => void)[]
        onError: ((error: Event) => void)[]
    } = {
            onOpen: [],
            onClose: [],
            onError: []
        }
    
    // Heartbeat mechanism to detect disconnections
    private heartbeatInterval: NodeJS.Timeout | null = null
    private heartbeatTimeout: NodeJS.Timeout | null = null
    private lastHeartbeatResponse: number = 0
    private heartbeatEnabled: boolean = true
    
    // Message queue for offline mode
    private messageQueue: { type: MessageType; payload: any; executiveId?: string }[] = []
    private maxQueueSize: number = 100
    
    // Connection metrics
    private connectionStartTime: number = 0
    private latency: number = 0

    constructor(url: string = 'ws://localhost:3001') {
        this.url = url
    }

    /**
     * Connect to the WebSocket server
     */
    public connect(): void {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return
        }

        try {
            this.connectionStartTime = Date.now()
            this.socket = new WebSocket(this.url)

            this.socket.onopen = () => {
                console.log('WebSocket connected')
                this.reconnectAttempts = 0
                this.latency = Date.now() - this.connectionStartTime
                
                // Start heartbeat
                this.startHeartbeat()
                
                // Process any queued messages
                this.processMessageQueue()
                
                // Notify handlers
                this.connectionHandlers.onOpen.forEach(handler => handler())
            }

            this.socket.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data)
                    
                    // Handle heartbeat response
                    if (message.type === 'heartbeat_response') {
                        this.lastHeartbeatResponse = Date.now()
                        this.latency = Date.now() - (message.payload?.timestamp || Date.now())
                        return
                    }
                    
                    this.handleMessage(message)
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error)
                }
            }

            this.socket.onclose = () => {
                console.log('WebSocket disconnected')
                this.stopHeartbeat()
                this.connectionHandlers.onClose.forEach(handler => handler())
                this.attemptReconnect()
            }

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error)
                this.connectionHandlers.onError.forEach(handler => handler(error))
            }
        } catch (error) {
            console.error('Failed to connect WebSocket:', error)
            this.attemptReconnect()
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached')
            return
        }

        this.reconnectAttempts++
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

        setTimeout(() => {
            this.connect()
        }, delay)
    }

    /**
     * Disconnect from the WebSocket server
     */
    public disconnect(): void {
        this.stopHeartbeat()
        
        if (this.socket) {
            this.socket.close()
            this.socket = null
        }
    }
    
    /**
     * Start the heartbeat mechanism to detect disconnections
     */
    private startHeartbeat(): void {
        if (!this.heartbeatEnabled) return
        
        this.stopHeartbeat()
        
        // Send heartbeat every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat()
        }, 30000)
        
        // Check for heartbeat response every 45 seconds
        this.heartbeatTimeout = setInterval(() => {
            const now = Date.now()
            
            // If no heartbeat response for 60 seconds, reconnect
            if (this.lastHeartbeatResponse > 0 && now - this.lastHeartbeatResponse > 60000) {
                console.warn('No heartbeat response, reconnecting...')
                this.reconnect()
            }
        }, 45000)
        
        // Send initial heartbeat
        this.sendHeartbeat()
    }
    
    /**
     * Stop the heartbeat mechanism
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
            this.heartbeatInterval = null
        }
        
        if (this.heartbeatTimeout) {
            clearInterval(this.heartbeatTimeout)
            this.heartbeatTimeout = null
        }
    }
    
    /**
     * Send a heartbeat message
     */
    private sendHeartbeat(): void {
        if (!this.isConnected()) return
        
        try {
            this.socket?.send(JSON.stringify({
                type: 'heartbeat',
                payload: { timestamp: Date.now() },
                timestamp: new Date()
            }))
        } catch (error) {
            console.error('Error sending heartbeat:', error)
        }
    }
    
    /**
     * Force a reconnection
     */
    public reconnect(): void {
        this.disconnect()
        this.connect()
    }

    /**
     * Send a message to the WebSocket server
     * If not connected, the message will be queued
     */
    public send(type: MessageType, payload: any, executiveId?: string): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, queueing message')
            this.queueMessage(type, payload, executiveId)
            return
        }

        const message: WebSocketMessage = {
            type,
            payload,
            timestamp: new Date(),
            executiveId
        }

        try {
            this.socket.send(JSON.stringify(message))
        } catch (error) {
            console.error('Error sending message:', error)
            this.queueMessage(type, payload, executiveId)
        }
    }
    
    /**
     * Queue a message to be sent when connection is restored
     */
    private queueMessage(type: MessageType, payload: any, executiveId?: string): void {
        // Don't queue heartbeats
        if (type === 'heartbeat') return
        
        this.messageQueue.push({ type, payload, executiveId })
        
        // Limit queue size to prevent memory issues
        if (this.messageQueue.length > this.maxQueueSize) {
            this.messageQueue.shift()
        }
    }
    
    /**
     * Process queued messages
     */
    private processMessageQueue(): void {
        if (this.messageQueue.length === 0) return
        
        console.log(`Processing ${this.messageQueue.length} queued messages`)
        
        const queue = [...this.messageQueue]
        this.messageQueue = []
        
        queue.forEach(message => {
            this.send(message.type, message.payload, message.executiveId)
        })
    }

    public onMessage(type: MessageType, handler: (payload: any) => void): void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, [])
        }

        this.messageHandlers.get(type)?.push(handler)
    }

    public removeMessageHandler(type: MessageType, handler: (payload: any) => void): void {
        const handlers = this.messageHandlers.get(type)

        if (handlers) {
            const index = handlers.indexOf(handler)
            if (index !== -1) {
                handlers.splice(index, 1)
            }
        }
    }

    private handleMessage(message: WebSocketMessage): void {
        const handlers = this.messageHandlers.get(message.type)

        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(message.payload)
                } catch (error) {
                    console.error(`Error in message handler for type ${message.type}:`, error)
                }
            })
        }
    }

    public onOpen(handler: () => void): void {
        this.connectionHandlers.onOpen.push(handler)
    }

    public onClose(handler: () => void): void {
        this.connectionHandlers.onClose.push(handler)
    }

    public onError(handler: (error: Event) => void): void {
        this.connectionHandlers.onError.push(handler)
    }

    public removeConnectionHandler(type: 'open' | 'close' | 'error', handler: any): void {
        switch (type) {
            case 'open':
                this.connectionHandlers.onOpen = this.connectionHandlers.onOpen.filter(h => h !== handler)
                break
            case 'close':
                this.connectionHandlers.onClose = this.connectionHandlers.onClose.filter(h => h !== handler)
                break
            case 'error':
                this.connectionHandlers.onError = this.connectionHandlers.onError.filter(h => h !== handler)
                break
        }
    }

    /**
     * Check if the WebSocket is connected
     */
    public isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN
    }

    /**
     * Get the WebSocket state
     */
    public getState(): number {
        return this.socket ? this.socket.readyState : -1
    }
    
    /**
     * Get the current connection latency
     */
    public getLatency(): number {
        return this.latency
    }
    
    /**
     * Set the maximum number of reconnect attempts
     */
    public setMaxReconnectAttempts(attempts: number): void {
        this.maxReconnectAttempts = attempts
    }
    
    /**
     * Set the reconnect delay
     */
    public setReconnectDelay(delay: number): void {
        this.reconnectDelay = delay
    }
    
    /**
     * Set the WebSocket URL
     */
    public setUrl(url: string): void {
        this.url = url
    }
    
    /**
     * Enable or disable heartbeat
     */
    public setHeartbeatEnabled(enabled: boolean): void {
        this.heartbeatEnabled = enabled
        
        if (enabled && this.isConnected()) {
            this.startHeartbeat()
        } else if (!enabled) {
            this.stopHeartbeat()
        }
    }
    
    /**
     * Get the number of queued messages
     */
    public getQueuedMessageCount(): number {
        return this.messageQueue.length
    }
    
    /**
     * Clear the message queue
     */
    public clearMessageQueue(): void {
        this.messageQueue = []
    }
}