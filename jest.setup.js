import '@testing-library/jest-dom'

// Mock WebGL context for Three.js tests
global.WebGLRenderingContext = class WebGLRenderingContext {
  constructor() {
    this.canvas = document.createElement('canvas')
  }
}

// Mock WebSocket for tests
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1 // OPEN
    this.onopen = null
    this.onclose = null
    this.onerror = null
    this.onmessage = null
  }
  
  send(data) {
    // Mock send implementation
  }
  
  close() {
    this.readyState = 3 // CLOSED
    if (this.onclose) this.onclose()
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock performance API
global.performance = {
  now: () => Date.now(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
}

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 16)
global.cancelAnimationFrame = (id) => clearTimeout(id) 