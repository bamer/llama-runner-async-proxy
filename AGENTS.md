# AGENTS.md

## Development Commands

### Running the Application
```bash
npm start
npm run dev
```

### Testing
```bash
# Node.js testing (placeholder - will be implemented)
npm test                    # Run all tests
```

### Build/Lint Commands
```bash
# Linting and formatting
npm run lint        # Format code

# Type checking
# Node.js has no direct equivalent to mypy but uses TypeScript 
```

## Code Style Guidelines

### Imports & Types
- Use absolute imports: `const express = require('express')`
- Group imports: standard library, third-party, local application  
- Use object literals for configuration objects (see `backend/src/config.js`)
- Type hints required for function signatures and complex return types (using JavaScript)
- Use `null` or `undefined` for nullable values

### Naming & Patterns
- Classes: PascalCase (`ServiceManager`)
- Functions/variables: camelCase (`loadConfig`, `startServices`)
- Constants: UPPER_SNAKE_CASE (`PORT`)
- Private methods: prefix with underscore (`_internalMethod`)
- Use `async/await` for I/O operations

### Error Handling & Config
- Use module-level logger: `console.log()` or `console.error()`
- Load configs via `backend/src/config.js` using repository pattern
- Store configuration in JSON files under `config/` directory

## Architecture

The refactored application maintains a modular architecture:
- Backend: Express.js server with service manager
- Frontend: React dashboard components 
- Configuration: JSON-based system