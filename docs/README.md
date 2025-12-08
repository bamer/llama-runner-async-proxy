# Llama Runner Async Proxy Documentation

## Overview

The Llama Runner Async Proxy is a modern dashboard application designed for managing and monitoring Llama models and related system services. This project implements the architecture plan with complete functionality that was previously broken.

## Features Implemented

### Real-Time Monitoring Dashboard
- Live system metrics (CPU, memory, disk, network)
- GPU statistics when available
- Real-time model performance tracking
- WebSocket-based live updates

### Model Management
- Automatic model discovery from configured directories
- Detailed model information display
- Start/stop capability for individual models
- Parameter configuration options
- Performance monitoring in real-time

### Configuration System
- Path configurations (models, logs, cache)
- Proxy settings (Ollama, LMStudio)
- Default parameter configurations
- Alert threshold settings
- UI theme preferences  
- Backup/restore functionality

### Real-Time Communication
- Bidirectional WebSocket communication
- Live metric updates
- Model status changes
- Configuration hot-reload
- System alerts and notifications

## Installation

### Prerequisites
- Node.js (v16+)
- Python (for legacy components) 
- Git
- npm

### Setup Process
```bash
git clone https://github.com/your-org/llama-runner-async-proxy.git
cd llama-runner-async-proxy
npm install
npm run build
npm start
```

The dashboard will be available at http://localhost:8081

## Dashboard Pages

### Dashboard Page
- System metrics overview
- Quick stats cards for key resources
- Recent activity notifications

### Monitoring Page
- Detailed system graphs (CPU, Memory, Network)
- GPU monitoring
- Process list view

### Models Page
- Model listing and details
- Performance metrics per model
- Start/stop actions

### Configuration Page
- Full configuration UI
- Path setup
- Proxy configuration
- Model parameters
- Alert thresholds
- UI settings
- Backup/restore

### Logs Page
- Real-time log viewer
- Log filtering and export options

### Settings Page
- User preferences
- Notification settings
- Integration configuration

## API Endpoints

### Monitoring
- `/api/v1/monitoring` - Get current system metrics  
- `/api/v1/monitoring/history` - Get historical metrics

### Models
- `/api/v1/models` - List all models
- `/api/v1/models/:modelName` - Get model details
- `/api/v1/models/:modelName/start` - Start a model
- `/api/v1/models/:modelName/stop` - Stop a model

### Configuration
- `/api/v1/config` - Get full configuration  
- `/api/v1/config/paths` - Update models path
- `/api/v1/config` - Update complete config

### Parameters
- `/api/v1/parameters` - Get parameter descriptions
- `/api/v1/parameters/:category` - Get parameters by category

## Configuration Files

### app_config.json
Main application configuration including:
- Proxy settings (Ollama, LMStudio)
- WebUI port configuration
- Logging preferences

### models_config.json
Model configuration including:
- Default parameters for models
- Model definitions and paths  
- Runtime configurations

## Architecture

Backend: Node.js/Express with Socket.IO WebSocket communication
Frontend: React/Vite with modular components  
Configuration: JSON-based with hot-reload capability

## Development Structure

```
llama-runner-async-proxy/
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── monitors/  # System monitoring components
│   │   ├── config.js    # Configuration loader
│   └── server.js        # Main server entry point
├── frontend/
│   ├── src/
│   │   ├── pages/       # React page components
│   │   ├── components/    # UI components
│   │   ├── services/      # API and WebSocket clients
│   │   └── hooks/         # Custom React hooks
├── config/
│   ├── app_config.json     # Application settings
│   └── models_config.json   # Model configuration
└── docs/
    └── README.md          # This documentation
```

## Testing

### Frontend Tests
- Component testing with React Testing Library
- Integration testing for dashboard pages

### Backend Tests  
- API endpoint testing with Supertest
- Service unit tests

## Troubleshooting

### Common Issues
1. **Dashboard not loading**: Check backend service and port 8081
2. **Model discovery**: Verify directory permissions 
3. **WebSocket failures**: Network connectivity issues

## Performance

The system is optimized for real-time performance with:
- Efficient metrics collection intervals
- Memory-efficient data structures  
- Optimized WebSocket communication
- Responsive UI components

## Security

Authentication handled through:
- JWT-based token validation
- Role-based access control

Permissions:
- `config:edit` - Config editing permissions
- `models:start` - Model start permissions  
- `models:stop` - Model stop permissions

## Future Enhancements

The system is designed for extensibility:
- Pluggable monitoring components
- Modular configuration management
- Customizable alerting systems
- Multi-tenant support