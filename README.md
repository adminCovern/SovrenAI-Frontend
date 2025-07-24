# SOVREN Executive Command Center

A production-grade, holographic command bridge for AI executives with real-time 3D visualization, distributed consensus, and enterprise-grade security.

## 🚀 Production Features

- **Real-time 3D Visualization**: Holographic executive avatars with Three.js
- **Distributed Consensus**: RAFT protocol implementation for fault tolerance
- **Enterprise Security**: XSS protection, CSRF tokens, input validation
- **Performance Optimization**: Adaptive quality settings, memory management
- **Error Recovery**: Automatic recovery mechanisms for critical failures
- **Comprehensive Testing**: 80%+ test coverage with unit and integration tests
- **CI/CD Pipeline**: Automated deployment with security scanning

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── 3d/               # Three.js 3D components
│   └── ui/               # React UI components
├── services/              # Core business logic
│   ├── WebSocketManager.ts
│   ├── RaftConsensusManager.ts
│   ├── PerformanceOptimizer.ts
│   └── SecurityManager.ts
├── store/                 # Redux state management
├── utils/                 # Utility functions
│   ├── errorHandler.ts
│   └── securityManager.ts
└── types/                 # TypeScript type definitions
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern browser with WebGL support

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/sovren-executive-command-center.git
cd sovren-executive-command-center

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Production Setup

```bash
# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run security audit
npm audit
```

## 🔧 Configuration

### Environment Variables

```bash
# WebSocket Configuration
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com

# Security Endpoints
NEXT_PUBLIC_SECURITY_ENDPOINT=https://your-security-service.com
NEXT_PUBLIC_LOGGING_ENDPOINT=https://your-logging-service.com

# Performance Settings
NEXT_PUBLIC_PERFORMANCE_TARGET_FPS=60
NEXT_PUBLIC_MEMORY_LIMIT_MB=512

# Feature Flags
NEXT_PUBLIC_ENABLE_RAFT_CONSENSUS=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_OPTIMIZATION=true
NEXT_PUBLIC_ENABLE_SECURITY_MONITORING=true
```

### Security Configuration

The application includes comprehensive security features:

- **XSS Protection**: Automatic HTML sanitization
- **CSRF Protection**: Token-based request validation
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Request throttling per user/IP
- **Security Headers**: CSP, HSTS, X-Frame-Options

### Performance Configuration

- **Adaptive Quality**: Automatic quality adjustment based on performance
- **Memory Management**: Automatic garbage collection and cache cleanup
- **Render Optimization**: Dynamic LOD and effect reduction
- **Network Optimization**: WebSocket connection pooling and batching

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- WebSocketManager.test.ts
```

### Test Coverage

- **Unit Tests**: 80%+ coverage for all services
- **Integration Tests**: WebSocket, Redux, Three.js integration
- **Security Tests**: XSS, CSRF, input validation
- **Performance Tests**: Memory leaks, render performance

### Test Structure

```
src/
├── services/__tests__/    # Service unit tests
├── components/__tests__/  # Component tests
├── utils/__tests__/      # Utility tests
└── __mocks__/            # Mock files
```

## 🚀 Deployment

### Production Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Security Scan**
   ```bash
   npm audit --audit-level=high
   ```

3. **Run Tests**
   ```bash
   npm run test:ci
   ```

4. **Deploy**
   ```bash
   # Using PM2
   pm2 start ecosystem.config.js --env production

   # Using Docker
   docker build -t sovren-command-center .
   docker run -p 3000:3000 sovren-command-center
   ```

### CI/CD Pipeline

The application includes a comprehensive GitHub Actions pipeline:

- **Security Scanning**: Snyk vulnerability scanning
- **Code Quality**: ESLint, TypeScript checking
- **Testing**: Unit tests with coverage reporting
- **Performance Testing**: Lighthouse CI
- **Security Testing**: OWASP ZAP scanning
- **Staging Deployment**: Automated staging deployment
- **Production Deployment**: Manual approval required

### Monitoring

- **Error Tracking**: Automatic error reporting and recovery
- **Performance Monitoring**: Real-time FPS and memory monitoring
- **Security Monitoring**: Security event logging and alerting
- **Health Checks**: Application health monitoring

## 🔒 Security Features

### Input Validation

```typescript
import { validateInput } from '@/utils/securityManager'

const result = validateInput(userInput, 'email_composition')
if (!result.isValid) {
  console.error('Invalid input:', result.errors)
}
```

### CSRF Protection

```typescript
import { validateCSRFToken, generateCSRFToken } from '@/utils/securityManager'

const token = generateCSRFToken()
const isValid = validateCSRFToken(receivedToken, expectedToken)
```

### Rate Limiting

```typescript
import { checkRateLimit } from '@/utils/securityManager'

const allowed = checkRateLimit(userId, 100, 60000) // 100 requests per minute
```

## ⚡ Performance Features

### Error Recovery

```typescript
import { handleError, handleAsyncError } from '@/utils/errorHandler'

// Handle synchronous errors
handleError(error, { component: 'WebSocketManager' }, 'high')

// Handle asynchronous errors
const result = await handleAsyncError(promise, { action: 'data_fetch' })
```

### Performance Optimization

```typescript
import { performanceOptimizer } from '@/services/PerformanceOptimizer'

// Monitor performance
performanceOptimizer.monitorPerformance(metrics)

// Get optimization stats
const stats = performanceOptimizer.getPerformanceStats()
```

## 🏛️ RAFT Consensus

The application implements RAFT consensus for distributed decision-making:

- **Leader Election**: Automatic leader selection
- **Log Replication**: Distributed log management
- **Fault Tolerance**: Automatic recovery from failures
- **Consistency**: Strong consistency guarantees

## 📊 Monitoring and Logging

### Error Monitoring

- Automatic error capture and reporting
- Error recovery mechanisms
- Performance impact tracking
- User session correlation

### Security Monitoring

- Security event logging
- Threat detection and alerting
- Rate limiting monitoring
- Input validation tracking

### Performance Monitoring

- Real-time FPS monitoring
- Memory usage tracking
- Render time optimization
- Network performance metrics

## 🔧 Development

### Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Development Tools

- **React DevTools**: Component debugging
- **Redux DevTools**: State management debugging
- **Three.js Inspector**: 3D scene debugging
- **Performance Profiler**: Performance analysis

## 📝 API Documentation

### WebSocket API

```typescript
// Connect to WebSocket
const wsManager = new WebSocketManager('wss://server.com')

// Send message
wsManager.send('executive_update', { id: 'exec-1', data: {} })

// Listen for messages
wsManager.onMessage('executive_update', (payload) => {
  console.log('Executive updated:', payload)
})
```

### Redux Store

```typescript
// Dispatch actions
dispatch(setExecutiveStates(executives))
dispatch(updateMetrics(performanceMetrics))

// Select state
const executives = useSelector(state => state.executives.states)
const performance = useSelector(state => state.performance)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Development Guidelines

- Follow TypeScript strict mode
- Write comprehensive tests
- Document new features
- Follow security best practices
- Optimize for performance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Issues**: GitHub Issues
- **Documentation**: [Wiki](https://github.com/your-org/sovren-executive-command-center/wiki)
- **Security**: security@your-org.com

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
