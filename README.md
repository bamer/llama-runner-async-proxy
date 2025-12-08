# Llama Runner Async Proxy - Unified Launch System

This project has been restructured to allow launching from the root directory with a single command.

## System Architecture

The system is organized into:
- **Frontend**: React-based dashboard application
- **Backend**: Node.js server with WebSocket support and API endpoints

## Launch Commands

### Development Mode
```bash
# Start both frontend and backend in development mode
./scripts/start.sh
# or
npm run dev
```

### Build Mode
```bash
# Build the complete system
./scripts/build.sh
# or
npm run build
```

### Production Mode
```bash
# Start the application in production mode
npm start
```

## Directory Structure

- `/frontend` - React frontend application
- `/backend` - Node.js backend server
- `/config` - Configuration files
- `/scripts` - Launch scripts

## Key Features

1. **Unified Launch**: All components can be launched from the root directory
2. **Shared Dependencies**: Both frontend and backend use the same dependencies
3. **Hot Reload**: Development mode supports hot-reload
4. **Real-time Monitoring**: WebSocket-based real-time updates
5. **Configuration Management**: Hot-reloadable configuration system

## Requirements

- Node.js (>=16.0.0)
- npm (>=8.0.0)

## Quick Start

```bash
# Install dependencies
npm install

# Launch development server
npm run dev

# Build for production
npm run build

# Start in production mode
npm start
```
