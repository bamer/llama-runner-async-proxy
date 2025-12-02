# Llama Runner Async Proxy - Node.js Implementation

This is a refactored version of the original Python application, converted to use Node.js and JavaScript for both backend and frontend.

## Backend Architecture

The backend now uses Node.js with Express.js to replace FastAPI. It includes:

- Express server with CORS support
- Configuration loading from JSON files
- Service manager for handling proxy services (Ollama and LMStudio)
- API endpoints for models, monitoring, and configuration

## Frontend Architecture

The frontend maintains the React-based dashboard but is now compatible with the Node.js backend.

## Running the Application

### Backend Server
```bash
cd /home/bamer/llama-runner-async-proxy
npm start
```

Or in development mode:
```bash
npm run dev
```

### Configuration Files

The application expects configuration files in the `config` directory:

- `app_config.json` - Core application configuration
- `models_config.json` - Model-specific configuration

## Directory Structure

```
├── backend/
│   └── src/              # Backend source code
│       ├── server.js     # Main server implementation
│       ├── config.js     # Configuration loader
│       └── service/      # Service managers
├── frontend/
│   └── src/              # Frontend React components
│       └── App.js        # Main React component
├── react_proxy/          # Legacy React proxy directory (for compatibility)
└── config/               # Configuration files
```

## API Endpoints

- `/api/v1/models` - Get list of available models
- `/api/v1/monitoring` - Get system monitoring metrics
- `/api/v1/config` - Update configuration

## Dependencies

Backend dependencies:
- express
- cors
- axios
- node-fetch

Frontend dependencies (in react_proxy):
- react
- react-dom
- react-router-dom

## Testing

The refactored application maintains all functionality from the original Python version while providing a more modern Node.js implementation.

## Notes

This conversion maintains compatibility with existing configuration and proxy services for Ollama and LMStudio, but implements them using Node.js rather than Python.