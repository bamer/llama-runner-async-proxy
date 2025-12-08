// Security Middleware Implementation - Enhanced API Security

// SecurityService.js
class SecurityService {
  constructor() {
    // Security configuration
    this.rateLimit = {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      window: 10000, // 10 seconds for burst detection
    };
    
    // Authentication settings
    this.authEnabled = true;
    this.apiKeys = new Map();
    
    // Request tracking
    this.requestCounts = new Map();
    this.ipBlacklist = new Set();
  }

  /**
   * Validate API request with React 19-inspired security patterns
   */
  validateRequest(request) {
    const { headers, method, path } = request;
    
    // Extract API key or token
    const authHeader = headers['authorization'] || headers['Authorization'];
    const apiKey = this.extractApiKey(authHeader);
    
    // Check if IP is blacklisted
    const ip = this.getIpFromRequest(request);
    if (this.ipBlacklist.has(ip)) {
      return { valid: false, error: 'IP is blacklisted' };
    }
    
    // Validate authentication with optimistic pattern
    const authResult = this.validateAuth(apiKey);
    
    // Check rate limiting with optimistic handling
    const rateLimitResult = this.checkRateLimit(ip);
    
    // Sanitize request parameters
    const sanitizedParams = this.sanitizeParameters(request.params || {});
    
    return {
      valid: authResult.valid && rateLimitResult.valid,
      ip,
      apiKey,
      sanitizedParams,
      timestamp: Date.now()
    };
  }

  /**
   * Extract API key from authorization header
   */
  extractApiKey(authHeader) {
    if (!authHeader) return null;
    
    // Handle different auth schemes
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    } else if (authHeader.startsWith('API-Key ')) {
      return authHeader.substring(8);
    }
    
    return null;
  }

  /**
   * Get IP from request with React 19-inspired pattern
   */
  getIpFromRequest(request) {
    // Handle multiple possible sources of IP address
    const ip = request.ip || 
              request.connection?.remoteAddress ||
              request.socket?.remoteAddress ||
              'unknown';
    
    // Sanitize IP address
    return ip.split(':')[0] || ip;
  }

  /**
   * Validate authentication with optimistic pattern
   */
  validateAuth(apiKey) {
    if (!this.authEnabled) {
      return { valid: true, reason: 'Authentication disabled' };
    }
    
    if (!apiKey) {
      return { valid: false, error: 'Missing API key' };
    }
    
    // Optimistic approach - immediate validation
    const isValid = this.apiKeys.has(apiKey);
    
    return {
      valid: isValid,
      error: isValid ? null : 'Invalid API key',
      timestamp: Date.now()
    };
  }

  /**
   * Check rate limiting with React 19 patterns
   */
  checkRateLimit(ip) {
    const now = Date.now();
    
    // Initialize tracking for this IP if needed
    if (!this.requestCounts.has(ip)) {
      this.requestCounts.set(ip, []);
    }
    
    const ipRequests = this.requestCounts.get(ip);
    
    // Add current request to the list
    ipRequests.push(now);
    
    // Remove old requests outside the window
    const windowStart = now - this.rateLimit.windowMs;
    const filteredRequests = ipRequests.filter(time => time > windowStart);
    
    // Update the tracking with filtered requests
    this.requestCounts.set(ip, filteredRequests);
    
    // Check if we exceed rate limit
    if (filteredRequests.length > this.rateLimit.maxRequests) {
      return { valid: false, error: 'Rate limit exceeded' };
    }
    
    return { valid: true, timestamp: now };
  }

  /**
   * Sanitize parameters with optimistic pattern
   */
  sanitizeParameters(params) {
    // Remove potentially dangerous characters or patterns
    const sanitized = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous patterns
        const sanitizedValue = value.replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // Remove control characters
        sanitized[key] = sanitizedValue;
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Add IP to blacklist with React 19-inspired pattern
   */
  addToBlacklist(ip) {
    this.ipBlacklist.add(ip);
    console.log(`Added ${ip} to blacklist`);
  }

  /**
   * Remove IP from blacklist
   */
  removeFromBlacklist(ip) {
    this.ipBlacklist.delete(ip);
    console.log(`Removed ${ip} from blacklist`);
  }

  /**
   * Add API key with optimistic pattern
   */
  addApiKey(key, permissions = {}) {
    this.apiKeys.set(key, permissions);
    console.log(`Added API key: ${key}`);
  }
}

module.exports = SecurityService;