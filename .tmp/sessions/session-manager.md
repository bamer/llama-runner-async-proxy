# Llama Runner Async Proxy Session Manager

This file manages the session context for launching the complete system.

## Session Context

- **Session ID**: ses_5015 (from existing session file)
- **System Components**:
  - Frontend: React application in /frontend/
  - Backend: Node.js server in /backend/
  - Configuration: /config/

## Launch Instructions

To launch the complete system from root directory:

1. Install dependencies for both frontend and backend:
   ```bash
   npm install
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```

3. For production deployment:
   ```bash
   npm start
   ```

## Dependencies

- Frontend: React 19+ with Vite build system
- Backend: Express.js with Socket.io WebSocket support
- Configuration: JSON-based config management with hot-reload capability

## Build Process

The system builds from the root directory:
1. Frontend build (Vite) → dist/ directory
2. Backend compilation (Node.js)

## Testing

- Backend tests: npm run test (Jest)
- Frontend testing: Vitest

## Deployment

- Production starts with: npm start
- Build with: npm run build
