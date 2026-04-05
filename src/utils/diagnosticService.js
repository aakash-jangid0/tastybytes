/**
 * Utility service for collecting and analyzing system errors
 */
class DiagnosticService {
  errors = [];
  listeners = [];
  isCapturing = false;
  performanceMetrics = {};
  networkRequests = [];
  resourceUsage = {};
    constructor() {
    // Singleton pattern
    if (DiagnosticService.instance) {
      return DiagnosticService.instance;
    }
    DiagnosticService.instance = this;
      // Set maximum limits to prevent performance issues
    this.maxNetworkRequests = 500; // Reduced from 1000 to 500 for better performance
    this.maxErrors = 500;
    
    // Try to load stored errors from localStorage
    this.loadErrorsFromStorage();
    
    // Initialize performance tracking
    this.initPerformanceTracking();
  }

  /**
   * Start capturing errors
   */
  startCapturing() {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    
    // Override console.error
    this.originalConsoleError = console.error;
    console.error = (...args) => {
      this.addError({
        source: 'console',
        type: 'error',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        timestamp: new Date(),
      });
      this.originalConsoleError.apply(console, args);
    };
    
    // Capture unhandled errors
    this.originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.addError({
        source: 'window',
        type: 'error',
        message: message,
        details: {
          source,
          lineno,
          colno,
          stack: error?.stack
        },
        timestamp: new Date()
      });
      
      if (this.originalOnError) {
        return this.originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };
    
    // Capture unhandled promise rejections
    this.originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      this.addError({
        source: 'promise',
        type: 'unhandledRejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        details: {
          reason: event.reason?.stack || String(event.reason)
        },
        timestamp: new Date()
      });
      
      if (this.originalUnhandledRejection) {
        return this.originalUnhandledRejection(event);
      }
    };
      // Capture fetch/API errors
    this.originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      const method = args[1]?.method || 'GET';
      
      // Generate a unique ID with timestamp and random component for better tracking
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const requestEntry = {
        id: requestId,
        url,
        method,
        startTime,
        status: 'pending',
        duration: 0,
        timestamp: new Date()
      };      
      // Add new request to the beginning of the array
      this.networkRequests.unshift(requestEntry);
      
      // Trim array if it exceeds max size to prevent memory issues
      if (this.networkRequests.length > this.maxNetworkRequests) {
        this.networkRequests = this.networkRequests.slice(0, this.maxNetworkRequests);
      }
      
      // Notify listeners about the new pending request
      this.notifyNetworkListeners();
        try {
        // Set a timeout to update any hanging requests as 'timeout' after 30 seconds
        const timeoutId = setTimeout(() => {
          const index = this.networkRequests.findIndex(r => r.id === requestId && r.status === 'pending');
          if (index !== -1) {
            this.networkRequests[index] = {
              ...this.networkRequests[index],
              status: 'timeout',
              statusText: 'Request timed out',
              duration: 30000,
              endTime: performance.now(),
              error: 'Request took too long to complete'
            };
            this.notifyNetworkListeners();
            
            this.addError({
              source: 'fetch',
              type: 'timeout',
              message: `${method} ${url} timed out after 30 seconds`,
              details: {
                url,
                method,
                duration: 30000
              },
              timestamp: new Date()
            });
          }
        }, 30000); // 30 second timeout
        
        const response = await this.originalFetch.apply(window, args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        // Update the network request entry
        const index = this.networkRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          this.networkRequests[index] = {
            ...this.networkRequests[index],
            status: response.status,
            statusText: response.statusText,
            duration,
            endTime,
            ok: response.ok
          };
          // Make sure to notify listeners
          this.notifyNetworkListeners();
        }
        
        // Track performance
        this.addPerformanceMetric('api', {
          url,
          method,
          duration,
          status: response.status
        });
        
        // Only log errors (4xx, 5xx responses)
        if (!response.ok) {
          try {
            // Clone the response so we can still use it in the application
            const clonedResponse = response.clone();
            const text = await clonedResponse.text();
            
            this.addError({
              source: 'fetch',
              type: 'http',
              message: `${method} ${url} failed with status ${response.status}`,
              details: {
                status: response.status,
                statusText: response.statusText,
                url,
                method,
                response: text,
                duration
              },
              timestamp: new Date()
            });
          } catch (e) {
            // If we can't read the response, just log what we can
            this.addError({
              source: 'fetch',
              type: 'http',
              message: `${method} ${url} failed with status ${response.status}`,
              details: {
                status: response.status,
                statusText: response.statusText,
                url,
                method,
                duration
              },
              timestamp: new Date()
            });
          }
        }
        
        return response;      } catch (error) {
        // Network errors, CORS issues, etc.
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Update the network request entry
        const index = this.networkRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          this.networkRequests[index] = {
            ...this.networkRequests[index],
            status: 'error',
            statusText: error.message || 'Network Error',
            duration,
            endTime,
            error: error.message || 'Unknown error',
            errorStack: error.stack
          };
          // Ensure we notify listeners of the error
          setTimeout(() => this.notifyNetworkListeners(), 0);
        }
        
        this.addError({
          source: 'fetch',
          type: 'network',
          message: `${method} ${url} failed: ${error.message}`,
          details: {
            url,
            method,
            error: error.stack || error.message,
            duration
          },
          timestamp: new Date()
        });
        
        throw error; // Re-throw to not break application flow
      }
    };
    
    // Monitor WebSocket connections
    this.monitorWebSockets();
    
    // Set up resource monitoring
    this.startResourceMonitoring();
  }

  /**
   * Stop capturing errors
   */
  stopCapturing() {
    if (!this.isCapturing) return;
    
    // Restore original methods
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }
    
    if (this.originalOnError) {
      window.onerror = this.originalOnError;
    }
    
    if (this.originalUnhandledRejection) {
      window.onunhandledrejection = this.originalUnhandledRejection;
    }
    
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    
    this.isCapturing = false;
    
    // Stop resource monitoring
    if (this.resourceMonitoringInterval) {
      clearInterval(this.resourceMonitoringInterval);
    }
  }

  /**
   * Add an error to the collection
   */
  addError(error) {
    // Generate a more detailed ID with timestamp and a random component
    const errorWithId = {
      ...error,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.errors.unshift(errorWithId); // Add to beginning of array
    
    // Limit stored errors to prevent memory issues
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
    
    // Save to localStorage for persistence
    this.saveErrorsToStorage();
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.errors));
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
    // Clear from localStorage
    localStorage.removeItem('diagnostic_errors');
    // Notify listeners
    this.listeners.forEach(listener => listener(this.errors));
  }

  /**
   * Get all captured errors
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Subscribe to error updates
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Network request listeners
   */
  networkListeners = [];
  
  subscribeToNetworkActivity(listener) {
    this.networkListeners.push(listener);
    return () => {
      this.networkListeners = this.networkListeners.filter(l => l !== listener);
    };
  }
  
  notifyNetworkListeners() {
    this.networkListeners.forEach(listener => listener(this.networkRequests));
  }
  
  getNetworkRequests() {
    return [...this.networkRequests];
  }

  /**
   * Performance monitoring
   */
  initPerformanceTracking() {
    if (window.performance && window.performance.getEntriesByType) {
      // Get navigation timing
      const navEntries = window.performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navTiming = navEntries[0];
        this.performanceMetrics.pageLoad = {
          total: navTiming.duration,
          domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.startTime,
          loaded: navTiming.loadEventEnd - navTiming.startTime,
          interactive: navTiming.domInteractive - navTiming.startTime,
          domComplete: navTiming.domComplete - navTiming.startTime,
          timestamp: new Date()
        };
      }
      
      // Set up performance observer for resource timing
      if (window.PerformanceObserver) {
        try {
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
              if (entry.entryType === 'resource') {
                this.addPerformanceMetric('resource', {
                  name: entry.name,
                  duration: entry.duration,
                  startTime: entry.startTime,
                  initiatorType: entry.initiatorType,
                  timestamp: new Date()
                });
              } else if (entry.entryType === 'longtask') {
                this.addPerformanceMetric('longtask', {
                  duration: entry.duration,
                  startTime: entry.startTime,
                  timestamp: new Date()
                });
              }
            });
          });
          
          observer.observe({ entryTypes: ['resource', 'longtask'] });
        } catch (e) {
          console.warn('Performance observer not fully supported', e);
        }
      }
    }
  }
  
  addPerformanceMetric(type, data) {
    if (!this.performanceMetrics[type]) {
      this.performanceMetrics[type] = [];
    }
    this.performanceMetrics[type].push(data);
    
    // Limit the size of stored metrics
    if (this.performanceMetrics[type].length > 100) {
      this.performanceMetrics[type] = this.performanceMetrics[type].slice(-100);
    }
  }
  
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Monitor system resources
   */
  startResourceMonitoring() {
    // Check memory usage if available
    if (performance.memory) {
      this.resourceMonitoringInterval = setInterval(() => {
        this.resourceUsage.memory = {
          total: performance.memory.totalJSHeapSize,
          used: performance.memory.usedJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: new Date()
        };
      }, 10000); // Check every 10 seconds
    }
  }
  
  getResourceUsage() {
    return { ...this.resourceUsage };
  }

  /**
   * Monitor WebSocket connections
   */  monitorWebSockets() {
    // Check if Socket.IO client is available
    if (window.io) {
      console.log('Socket.IO detected, setting up monitoring');
      this.monitorSocketIO();
    }
    
    // Also monitor native WebSockets
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      console.log(`New WebSocket connection to: ${url}`);
      const socket = new originalWebSocket(url, protocols);
      const socketInfo = {
        url,
        type: 'native',
        status: 'connecting',
        createdAt: new Date(),
        lastActivity: new Date(),
        messages: {
          sent: 0,
          received: 0
        }
      };
      
      // Track socket status
      socket.addEventListener('open', () => {
        socketInfo.status = 'open';
        socketInfo.lastActivity = new Date();
        diagnosticService.updateWebSocketStatus(socket, socketInfo);
      });
      
      socket.addEventListener('close', (event) => {
        socketInfo.status = 'closed';
        socketInfo.closeCode = event.code;
        socketInfo.closeReason = event.reason;
        socketInfo.lastActivity = new Date();
        diagnosticService.updateWebSocketStatus(socket, socketInfo);
      });
      
      socket.addEventListener('error', (error) => {
        socketInfo.status = 'error';
        socketInfo.lastActivity = new Date();
        diagnosticService.updateWebSocketStatus(socket, socketInfo);
        diagnosticService.addError({
          source: 'websocket',
          type: 'error',
          message: `WebSocket connection error: ${url}`,
          details: { url },
          timestamp: new Date()
        });
      });
      
      // Track message activity
      const originalSend = socket.send;
      socket.send = function(data) {
        socketInfo.messages.sent++;
        socketInfo.lastActivity = new Date();
        diagnosticService.updateWebSocketStatus(socket, socketInfo);
        return originalSend.call(this, data);
      };
      
      socket.addEventListener('message', () => {
        socketInfo.messages.received++;
        socketInfo.lastActivity = new Date();
        diagnosticService.updateWebSocketStatus(socket, socketInfo);
      });
      
      // Store socket in the diagnostic service
      diagnosticService.trackWebSocket(socket, socketInfo);
      
      return socket;
    };
  }
  
  webSockets = new Map();
  
  trackWebSocket(socket, info) {
    this.webSockets.set(socket, info);
  }
  
  updateWebSocketStatus(socket, info) {
    if (this.webSockets.has(socket)) {
      this.webSockets.set(socket, { ...info });
    }
  }
    monitorSocketIO() {
    try {
      // See if we can access context through window
      if (window.io) {
        const originalIO = window.io;
        window.io = function(url, options) {
          console.log(`Socket.IO attempting connection to: ${url}`, options);
          
          const socket = originalIO(url, options);
          const socketInfo = {
            url,
            type: 'socket.io',
            options,
            status: 'connecting',
            createdAt: new Date(),
            lastActivity: new Date(),
            messages: {
              sent: 0,
              received: 0
            }
          };
          
          // Track socket events
          socket.on('connect', () => {
            console.log(`Socket.IO connected to: ${url} with ID:`, socket.id);
            socketInfo.status = 'open';
            socketInfo.socketId = socket.id;
            socketInfo.lastActivity = new Date();
            diagnosticService.updateWebSocketStatus(socket, socketInfo);
          });
          
          socket.on('disconnect', (reason) => {
            console.log(`Socket.IO disconnected from: ${url}, reason:`, reason);
            socketInfo.status = 'closed';
            socketInfo.disconnectReason = reason;
            socketInfo.lastActivity = new Date();
            diagnosticService.updateWebSocketStatus(socket, socketInfo);
          });
          
          socket.on('connect_error', (error) => {
            console.error(`Socket.IO connection error to: ${url}`, error);
            socketInfo.status = 'error';
            socketInfo.error = error.message;
            socketInfo.lastActivity = new Date();
            diagnosticService.updateWebSocketStatus(socket, socketInfo);
            diagnosticService.addError({
              source: 'socket.io',
              type: 'error',
              message: `Socket.IO connection error: ${url}`,
              details: error.message,
              timestamp: new Date()
            });
          });
          
          // Track emit and receive events
          const originalEmit = socket.emit;
          socket.emit = function(eventName, ...args) {
            socketInfo.messages.sent++;
            socketInfo.lastActivity = new Date();
            socketInfo.lastEvent = eventName;
            diagnosticService.updateWebSocketStatus(socket, socketInfo);
            return originalEmit.apply(this, [eventName, ...args]);
          };
          
          // Store socket in diagnostic service
          diagnosticService.trackWebSocket(socket, socketInfo);
          
          return socket;
        };
      }
    } catch (err) {
      console.error('Failed to monitor Socket.IO:', err);
    }
  }
  
  getWebSocketStatus() {
    console.log('WebSocket Status - Current connections:', this.webSockets.size);
    return Array.from(this.webSockets.values());
  }

  /**
   * Local Storage inspection methods
   */
  getLocalStorageItems() {
    try {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            items[key] = value;
          } catch (e) {
            items[key] = '[Error reading value]';
          }
        }
      }
      return items;
    } catch (e) {
      return { error: e.message };
    }
  }
  
  getSessionStorageItems() {
    try {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          try {
            const value = sessionStorage.getItem(key);
            items[key] = value;
          } catch (e) {
            items[key] = '[Error reading value]';
          }
        }
      }
      return items;
    } catch (e) {
      return { error: e.message };
    }
  }
  
  getCookies() {
    try {
      return document.cookie.split(';')
        .map(cookie => cookie.trim())
        .reduce((cookies, cookie) => {
          const [name, value] = cookie.split('=');
          cookies[name] = value;
          return cookies;
        }, {});
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Environment checking
   */
  getEnvironmentInfo() {
    const envInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      online: navigator.onLine,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      timestamp: new Date()
    };
    
    // Try to detect environment variables
    const envVars = {};
    if (window.ENV) envVars.env = window.ENV;
    if (window.process && window.process.env) envVars.processEnv = window.process.env;
    
    // Browser features detection
    const features = {
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      cookies: navigator.cookieEnabled,
      serviceWorkers: 'serviceWorker' in navigator,
      webSockets: 'WebSocket' in window,
      webWorkers: 'Worker' in window,
      indexedDB: 'indexedDB' in window,
      webGL: (() => {
        try {
          return !!document.createElement('canvas').getContext('webgl');
        } catch (e) {
          return false;
        }
      })()
    };
    
    return {
      ...envInfo,
      envVars,
      features
    };
  }
  
  /**
   * Error test injection
   */
  injectTestError(errorType) {
    switch(errorType) {
      case 'reference':
        // ReferenceError
        nonExistentVariable.test(); // eslint-disable-line no-undef
        break;
      case 'type':
        // TypeError
        const num = 123;
        num.toUpperCase();
        break;
      case 'syntax':
        // SyntaxError - can't be directly invoked, but we can use eval
        try {
          eval('const x = {;}'); // Intentional syntax error
        } catch (e) {
          throw e;
        }
        break;
      case 'api':
        // API Error
        fetch('/non-existent-endpoint-for-testing')
          .then(response => response.json());
        break;
      case 'promise':
        // Unhandled promise rejection
        new Promise((_, reject) => {
          reject(new Error('Test Promise Rejection'));
        });
        break;
      case 'custom':
        // Custom error
        throw new Error('This is a custom test error');
      default:
        throw new Error(`Unknown test error type: ${errorType}`);
    }
  }

  /**
   * Save errors to localStorage for persistence
   */
  saveErrorsToStorage() {
    try {
      // Only store the 20 most recent errors for localStorage
      const recentErrors = this.errors.slice(0, 20);
      localStorage.setItem('diagnostic_errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Could not save errors to localStorage:', e);
    }
  }
  
  /**
   * Load errors from localStorage
   */
  loadErrorsFromStorage() {
    try {
      const storedErrors = localStorage.getItem('diagnostic_errors');
      if (storedErrors) {
        this.errors = JSON.parse(storedErrors);
        // Fix timestamps (they're stored as strings)
        this.errors.forEach(error => {
          error.timestamp = new Date(error.timestamp);
        });
      }
    } catch (e) {
      console.warn('Could not load errors from localStorage:', e);
    }
  }
  
  /**
   * Export all diagnostic data as JSON
   */
  exportDiagnosticData() {
    return {
      errors: this.errors,
      performance: this.performanceMetrics,
      networkRequests: this.networkRequests,
      resourceUsage: this.resourceUsage,
      webSockets: Array.from(this.webSockets.values()),
      localStorage: this.getLocalStorageItems(),
      sessionStorage: this.getSessionStorageItems(),
      cookies: this.getCookies(),
      environment: this.getEnvironmentInfo(),
      exportedAt: new Date()
    };
  }

  /**
   * Perform a system health check
   */
  async checkSystemHealth() {
    const results = {
      frontend: { status: 'ok' },
      api: { status: 'unknown' },
      database: { status: 'unknown' },
      network: { status: navigator.onLine ? 'ok' : 'offline' }
    };
    
    // Check API
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        results.api.status = 'ok';
        const data = await response.json();
        results.api.details = data;
        
        // If API health check includes database status
        if (data.database) {
          results.database.status = data.database === 'connected' ? 'ok' : 'error';
          results.database.details = data.database;
        }
      } else {
        results.api.status = 'error';
        results.api.details = {
          status: response.status,
          statusText: response.statusText
        };
      }
    } catch (e) {
      results.api.status = 'error';
      results.api.details = {
        message: e.message
      };
    }
    
    // Return collected health data
    return results;
  }
}

export const diagnosticService = new DiagnosticService();
export default diagnosticService;
