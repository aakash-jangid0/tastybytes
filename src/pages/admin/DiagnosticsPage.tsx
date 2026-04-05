import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle2, Server, Database, 
  Globe, Cpu, Network, RefreshCw, 
  Package, Shield, ClipboardList, Layers, Command, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import diagnosticService from '../../utils/diagnosticService';

// Import new diagnostic components
import PerformanceMetricsPanel from '../../components/diagnostics/PerformanceMetricsPanel';
import NetworkPanel from '../../components/diagnostics/NetworkPanel';
import StorageInspector from '../../components/diagnostics/StorageInspector';
import SystemInfoPanel from '../../components/diagnostics/SystemInfoPanel';
import ErrorAnalyticsPanel from '../../components/diagnostics/ErrorAnalyticsPanel';
import UtilityButtons from '../../components/diagnostics/UtilityButtons';

type ErrorCategory = 'frontend' | 'backend' | 'database' | 'network' | 'auth' | 'resources' | 'other';
type StatusType = 'loading' | 'online' | 'offline' | 'error' | 'warning';

interface DiagnosticError {
  id: string;
  message: string;
  category: ErrorCategory;
  timestamp: Date;
  suggestion?: string;
  details?: string;
  code?: string;
  source?: string;
}

interface SystemStatus {
  name: string;
  status: StatusType;
  message?: string;
  lastChecked: Date;
}

// Create a dummy supabase client for when the real one isn't available
const dummySupabase = {
  from: () => ({
    select: () => ({
      limit: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase not configured properly' } 
      })
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ 
      data: null, 
      error: { message: 'Supabase not configured properly' } 
    })
  }
};

// Use the real supabase client if available, otherwise use the dummy
const supabaseClient = supabase || dummySupabase;

export default function DiagnosticsPage() {
  const [errors, setErrors] = useState<DiagnosticError[]>([]);
  const [successes, setSuccesses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ErrorCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<string>('overview');
    // Advanced diagnostics states
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const [networkRequests, setNetworkRequests] = useState<any[]>([]);
  const [environmentInfo, setEnvironmentInfo] = useState<any>({});
  const [resourceUsage, setResourceUsage] = useState<any>({});
  const [localStorageItems, setLocalStorageItems] = useState<any>({});
  const [sessionStorageItems, setSessionStorageItems] = useState<any>({});
  const [cookieItems, setCookieItems] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // System status states
  const [statuses, setStatuses] = useState<SystemStatus[]>([
    { name: 'React Application', status: 'loading', lastChecked: new Date() },
    { name: 'API Server', status: 'loading', lastChecked: new Date() },
    { name: 'Database', status: 'loading', lastChecked: new Date() },
    { name: 'Authentication', status: 'loading', lastChecked: new Date() },
    { name: 'Internet Connection', status: 'loading', lastChecked: new Date() },
    { name: 'WebSocket', status: 'loading', lastChecked: new Date() },
  ]);

  // Check browser console errors
  useEffect(() => {
    // Load advanced diagnostic data
    const loadDiagnosticData = () => {
      setPerformanceMetrics(diagnosticService.getPerformanceMetrics());
      setNetworkRequests(diagnosticService.getNetworkRequests());
      setEnvironmentInfo(diagnosticService.getEnvironmentInfo());
      setResourceUsage(diagnosticService.getResourceUsage());
      setLocalStorageItems(diagnosticService.getLocalStorageItems());
      setSessionStorageItems(diagnosticService.getSessionStorageItems());
      setCookieItems(diagnosticService.getCookies());

      // Get errors from diagnostic service
      const serviceErrors = diagnosticService.getErrors();
      if (serviceErrors.length > 0) {
        setErrors(prev => {
          // Merge errors, avoiding duplicates by id
          const existingIds = new Set(prev.map(e => e.id));
          const newErrors = serviceErrors.filter(e => !existingIds.has(e.id));
          return [...prev, ...newErrors];
        });
      }
    };
    
    // Subscribe to error updates from diagnostic service
    const unsubscribe = diagnosticService.subscribe((updatedErrors: DiagnosticError[]) => {
      setErrors(prev => {
        // Merge errors, avoiding duplicates by id
        const existingIds = new Set(prev.map(e => e.id));
        const newErrors = updatedErrors.filter(e => !existingIds.has(e.id));
        return [...prev, ...newErrors];
      });
    });    
    // Subscribe to network activity with throttling to prevent too many updates
    let networkUpdateTimeout: any;
    const unsubscribeNetwork = diagnosticService.subscribeToNetworkActivity((requests: any[]) => {
      // Throttle updates to reduce rendering load
      clearTimeout(networkUpdateTimeout);
      networkUpdateTimeout = setTimeout(() => {
        setNetworkRequests(requests);
      }, 500);
    });
    
    // Run initial checks
    const runChecks = async () => {
      setIsLoading(true);
      loadDiagnosticData();
      try {
        await checkReactStatus();
        await checkAPIStatus();
        await checkDatabaseStatus();
        await checkAuthStatus();
        checkNetworkStatus();
        await checkWebSocketStatus();
      } catch (error) {
        console.error('Error running diagnostics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    runChecks();
      // Set up an interval to refresh data periodically    // Use a longer interval to reduce UI stuttering and performance impact
    const dataRefreshInterval = setInterval(() => {
      // Only refresh if the tab is visible to reduce background CPU usage
      if (document.visibilityState === 'visible' && activeTab !== 'network') {
        // Skip automatic refresh when on network tab to prevent freezing
        loadDiagnosticData();
      }
    }, 15000); // Increased from 10s to 15s for better performance
      // Cleanup function to unsubscribe
    return () => {
      unsubscribe();
      unsubscribeNetwork();
      clearInterval(dataRefreshInterval);
      clearTimeout(networkUpdateTimeout); // Clear any pending network updates
    };
  }, []);

  // Run diagnostics
  useEffect(() => {
    const runDiagnostics = async () => {
      await checkReactStatus();
      await checkAPIStatus();
      await checkDatabaseStatus();
      await checkAuthStatus();
      await checkNetworkStatus();
      await checkWebSocketStatus();
      
      setIsLoading(false);
    };
    
    runDiagnostics();
    
    // Re-run diagnostics every 30 seconds
    const interval = setInterval(() => {
      runDiagnostics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const updateStatus = (name: string, status: StatusType, message?: string) => {
    setStatuses(prev => 
      prev.map(s => s.name === name ? { 
        ...s, 
        status, 
        message, 
        lastChecked: new Date() 
      } : s)
    );
  };
  const addError = (message: string, category: ErrorCategory, details?: string, suggestion?: string) => {
    setErrors(prev => [
      ...prev, 
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        message,
        category,
        timestamp: new Date(),
        details,
        suggestion
      }
    ]);
  };
  
  const addSuccess = (message: string) => {
    setSuccesses(prev => [...prev, message]);
  };

  const checkReactStatus = async () => {
    try {
      // If this code executes, React is working
      updateStatus('React Application', 'online');
      addSuccess('React application is rendering properly');
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      updateStatus('React Application', 'error', error);
      addError('React rendering error', 'frontend', error, 'Try clearing your browser cache or restarting the development server');
    }
  };

  const checkAPIStatus = async () => {
    try {
      updateStatus('API Server', 'loading');
      
      const response = await fetch('/api/healthCheck', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        updateStatus('API Server', 'online', data.status);
        addSuccess('API server is responding correctly');
      } else {
        const errorText = await response.text();
        updateStatus('API Server', 'error', `Status ${response.status}`);
        addError(`API server returned status ${response.status}`, 'backend', errorText, 
                'Check if the server is running and configured correctly');
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      updateStatus('API Server', 'offline', error);
      addError('API server connection failed', 'backend', error, 
              'Make sure the backend server is running on the correct port');
    }
  };
  const checkDatabaseStatus = async () => {
    try {
      updateStatus('Database', 'loading');
      
      if (!supabaseClient) {
        updateStatus('Database', 'error', 'Supabase client not initialized');
        addError('Database configuration error', 'database', 
                'Supabase client not initialized', 
                'Check your environment variables for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
        return;
      }
      
      // Try to execute a simple query to check database connectivity
      const { error } = await supabaseClient.from('health_check').select('*').limit(1);
      
      if (error) {
        updateStatus('Database', 'error', error.message);
        addError('Database connection error', 'database', error.message, 
                'Check your database credentials and connection settings');
      } else {
        updateStatus('Database', 'online');
        addSuccess('Successfully connected to the database');
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      updateStatus('Database', 'offline', error);
      addError('Failed to connect to database', 'database', error, 
              'Verify that your database is running and accessible');
    }
  };

  const checkAuthStatus = async () => {
    try {
      updateStatus('Authentication', 'loading');
      
      // Check if we have any session
      const { error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        updateStatus('Authentication', 'error', sessionError.message);
        addError('Authentication error', 'auth', sessionError.message, 
                'There might be an issue with your authentication configuration');
      } else {
        updateStatus('Authentication', 'online');
        addSuccess('Authentication service is working');
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      updateStatus('Authentication', 'offline', error);
      addError('Authentication service failure', 'auth', error, 
              'Check your authentication configuration and credentials');
    }
  };

  const checkNetworkStatus = () => {
    try {
      updateStatus('Internet Connection', navigator.onLine ? 'online' : 'offline');
      
      if (navigator.onLine) {
        addSuccess('Internet connection is available');
      } else {
        addError('No internet connection', 'network', 'Browser reports offline status', 
                'Check your network connection');
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      updateStatus('Internet Connection', 'error', error);
      addError('Failed to check network status', 'network', error);
    }
  };
  // Check WebSocket connections - new function
  const checkWebSocketStatus = async () => {
    try {
      updateStatus('WebSocket', 'loading');
      
      // Get WebSocket status from diagnostic service
      const webSockets = diagnosticService.getWebSocketStatus();
      
      if (webSockets.length > 0) {
        // Check if any connections are open
        const hasActiveConnection = webSockets.some((ws: any) => ws.status === 'open');
        const socketIOConnections = webSockets.filter((ws: any) => ws.type === 'socket.io');
        const nativeConnections = webSockets.filter((ws: any) => ws.type === 'native');
        
        if (hasActiveConnection) {
          const activeConnections = webSockets.filter((ws: any) => ws.status === 'open');
          const connectionInfo = activeConnections.map((ws: any) => 
            `${ws.type} on ${new URL(ws.url).port || 'default'}`
          ).join(', ');
          
          updateStatus('WebSocket', 'online', 
            `${activeConnections.length} active connection(s): ${connectionInfo}`
          );
          addSuccess('WebSocket connections are active');
        } else {
          // Has connections but none are open
          updateStatus('WebSocket', 'warning', 'Connections exist but none are active');
          
          // Provide more detailed error based on connection types
          if (socketIOConnections.length > 0) {
            const errors = socketIOConnections
              .filter((ws: any) => ws.error)
              .map((ws: any) => ws.error)
              .join('; ');
              
            addError('Socket.IO connections not active', 'network', 
                    `Connections exist but are not in "open" state. Errors: ${errors || 'None reported'}`,
                    'Check if the WebSocket server is running on the expected ports (5000-5005)');
          } else {
            addError('WebSocket connections not active', 'network', 
                    'WebSocket connections exist but none are in the open state',
                    'Check if your WebSocket server is running properly');
          }
        }
      } else {
        // Attempt to check if port 5000-5005 are accessible
        updateStatus('WebSocket', 'offline', 'Attempting to detect WebSocket server...');
        
        try {
          // Try to do a quick check for WebSocket server availability
          const socketServerCheckPromises = [5000, 5001, 5002, 5003, 5004, 5005].map(port => 
            fetch(`http://localhost:${port}/api/health`)
              .then(res => ({ port, available: res.ok }))
              .catch(() => ({ port, available: false }))
          );
          
          const results = await Promise.all(socketServerCheckPromises);
          const availablePorts = results.filter(r => r.available).map(r => r.port);
          
          if (availablePorts.length > 0) {
            updateStatus('WebSocket', 'warning', `Server detected on ports ${availablePorts.join(', ')} but no active connections`);
            addError('WebSocket server available but no connections', 'network', 
                    `Server appears to be running on ports ${availablePorts.join(', ')} but no WebSocket connections have been established`,
                    'Check the SocketContext.tsx implementation to ensure it\'s attempting to connect to the correct port');
          } else {
            updateStatus('WebSocket', 'offline', 'No WebSocket server detected on ports 5000-5005');
            addError('No WebSocket server detected', 'network', 
                    'Could not detect a WebSocket server on the expected ports (5000-5005)',
                    'Make sure the server is running with WebSocket support enabled');
          }
        } catch (e) {
          updateStatus('WebSocket', 'offline', 'No connections detected');
          addError('No WebSocket connections detected', 'network', 
                  'No WebSocket connections have been established',
                  'Check your WebSocket server configuration and network connectivity');
        }
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      updateStatus('WebSocket', 'error', error);
      addError('WebSocket status check failed', 'network', error);
    }
  };

  const runAllChecks = async () => {
    setIsLoading(true);
    setErrors([]);
    setSuccesses([]);
    
    await checkReactStatus();
    await checkAPIStatus();
    await checkDatabaseStatus();
    await checkAuthStatus();
    await checkNetworkStatus();
    await checkWebSocketStatus();
    
    setIsLoading(false);
    toast.success('All diagnostic checks completed');
  };

  const filteredErrors = activeCategory === 'all' 
    ? errors 
    : errors.filter(error => error.category === activeCategory);

  const errorsByCategory = errors.reduce((acc, error) => {
    acc[error.category] = (acc[error.category] || 0) + 1;
    return acc;
  }, {} as Record<ErrorCategory, number>);

  // Count errors by category for the badge counts
  const getCategoryCount = (category: ErrorCategory | 'all') => {
    if (category === 'all') return errors.length;
    return errorsByCategory[category] || 0;
  };

  // Utility functions for advanced features
  const handleExportData = () => {
    try {
      const exportData = diagnosticService.exportDiagnosticData();
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `diagnostics-export-${new Date().toISOString()}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      linkElement.remove();
      
      toast.success('Diagnostic data exported successfully');
    } catch (error) {
      console.error('Error exporting diagnostic data:', error);
      toast.error('Failed to export diagnostic data');
    }
  };
  
  const handleClearLogs = () => {
    setErrors([]);
    setSuccesses([]);
    diagnosticService.clearErrors();
    toast.success('All logs cleared');
  };
  
  const handleInjectTestError = (errorType: string) => {
    try {
      toast(`Injecting test error: ${errorType}`);
      diagnosticService.injectTestError(errorType);
    } catch (error) {
      // This will be caught by our error handling system, so no need to do anything here
    }
  };
  // Search functionality for errors
  const [currentErrorPage, setCurrentErrorPage] = useState(1);
  const errorsPerPage = 10;

  // First filter by category and search term
  const searchErrorResults = searchQuery.trim() === '' ? 
    filteredErrors : 
    filteredErrors.filter(error => 
      error.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (error.details && error.details.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  
  // Then paginate the results
  const paginatedErrors = React.useMemo(() => {
    const startIndex = (currentErrorPage - 1) * errorsPerPage;
    const endIndex = startIndex + errorsPerPage;
    return searchErrorResults.slice(startIndex, endIndex);
  }, [searchErrorResults, currentErrorPage, errorsPerPage]);

  // Calculate pagination controls
  const totalErrorPages = Math.ceil(searchErrorResults.length / errorsPerPage);
  
  // Reset pagination when changing filters or search
  React.useEffect(() => {
    setCurrentErrorPage(1);
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Diagnostics & Error Report</h1>
          <p className="mt-2 text-gray-600">
            Advanced diagnostic tool for monitoring and troubleshooting application issues
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Server className="inline-block w-4 h-4 mr-2" />
                Overview
              </button>
            <button 
                onClick={() => {
                  setActiveTab('errors');
                  setIsLoading(false); // Reset loading state when switching to errors tab
                }} 
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'errors' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <AlertTriangle className="inline-block w-4 h-4 mr-2" />
                Errors {errors.length > 0 && `(${errors.length})`}
              </button>
              <button 
                onClick={() => setActiveTab('performance')} 
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'performance' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Cpu className="inline-block w-4 h-4 mr-2" />
                Performance
              </button>              <button 
                onClick={() => {
                  setActiveTab('network');
                  setIsLoading(false); // Reset loading state when switching to network tab
                }}
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'network' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Globe className="inline-block w-4 h-4 mr-2" />
                Network
              </button>
              <button 
                onClick={() => setActiveTab('storage')} 
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'storage' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Database className="inline-block w-4 h-4 mr-2" />
                Storage
              </button>
              <button 
                onClick={() => setActiveTab('system')} 
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'system' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Layers className="inline-block w-4 h-4 mr-2" />
                System Info
              </button>
              <button 
                onClick={() => setActiveTab('tools')} 
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'tools' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Command className="inline-block w-4 h-4 mr-2" />
                Tools
              </button>
            </nav>
          </div>
        </div>
        
        {/* Overview Tab Content - Always visible at the top */}
        {activeTab === 'overview' && (
          <>
            {/* System Status Dashboard */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <Server className="w-5 h-5 mr-2 text-blue-600" />
                  System Status
                </h2>
                <button 
                  onClick={runAllChecks}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Running Checks...' : 'Run All Checks'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statuses.map((status) => (
                  <div 
                    key={status.name}
                    className="border rounded-lg p-4 flex items-center"
                  >
                    <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                      status.status === 'loading' ? 'bg-yellow-400' : 
                      status.status === 'online' ? 'bg-green-500' : 
                      status.status === 'offline' ? 'bg-red-500' :
                      status.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div>
                    
                    <div className="flex-grow">
                      <div className="font-medium">{status.name}</div>
                      {status.message && (
                        <div className="text-xs text-gray-500 truncate" title={status.message}>
                          {status.message.length > 50 ? `${status.message.substring(0, 50)}...` : status.message}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {new Date(status.lastChecked).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Error Analytics Panel (Brief Version) */}
            <ErrorAnalyticsPanel errors={errors} />
          </>
        )}
        
        {/* Errors Tab Content */}
        {activeTab === 'errors' && (
          <>
            {/* Error Categories */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  <button
                    className={`px-4 py-2 rounded-full ${
                      activeCategory === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                    onClick={() => setActiveCategory('all')}
                  >
                    All Issues
                    {getCategoryCount('all') > 0 && (
                      <span className="ml-2 bg-white bg-opacity-30 text-white text-xs px-2 py-0.5 rounded-full">
                        {getCategoryCount('all')}
                      </span>
                    )}
                  </button>
                  
                  {['frontend', 'backend', 'database', 'network', 'auth', 'resources', 'other'].map((category) => (
                    <button
                      key={category}
                      className={`px-4 py-2 rounded-full whitespace-nowrap ${
                        activeCategory === category 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                      onClick={() => setActiveCategory(category as ErrorCategory)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                      {getCategoryCount(category as ErrorCategory) > 0 && (                
                        <span className="ml-2 bg-white bg-opacity-30 text-xs px-2 py-0.5 rounded-full">
                          {getCategoryCount(category as ErrorCategory)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Search bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search errors..."
                    className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Errors Display */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                {activeCategory === 'all' ? 'All Issues' : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Issues`}
                {searchQuery && ` matching "${searchQuery}"`}
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {searchErrorResults.length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                      <p className="text-gray-600">No issues detected in this category</p>
                    </div>
                  )}
                    <div className="space-y-4">
                    {paginatedErrors.map((error) => (
                      <motion.div 
                        key={error.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-red-100 rounded-lg p-4 bg-red-50"
                      >
                        <div className="flex items-center mb-2">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            error.category === 'frontend' ? 'bg-purple-500' :
                            error.category === 'backend' ? 'bg-blue-500' :
                            error.category === 'database' ? 'bg-green-500' :
                            error.category === 'network' ? 'bg-amber-500' :
                            error.category === 'auth' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-500">
                            {error.category ? error.category.toUpperCase() : 'N/A'} • {new Date(error.timestamp).toLocaleTimeString()}
                            {error.source && ` • ${error.source}`}
                          </span>
                        </div>
                        
                        <div className="font-medium text-red-700 mb-1">{error.message}</div>
                        
                        {error.details && (
                          <div className="bg-white p-2 rounded text-xs font-mono text-gray-700 mb-2 overflow-x-auto">
                            {error.details}
                          </div>
                        )}
                        
                        {error.suggestion && (
                          <div className="flex items-start mt-2">
                            <div className="bg-blue-100 p-3 rounded-lg flex-grow">
                              <div className="flex items-center text-blue-800 text-sm font-medium mb-1">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Suggestion:
                              </div>
                              <div className="text-blue-700 text-sm">{error.suggestion}</div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                    {/* Pagination controls */}
                  {searchErrorResults.length > errorsPerPage && (
                    <div className="mt-6 pt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((currentErrorPage - 1) * errorsPerPage) + 1} - {Math.min(currentErrorPage * errorsPerPage, searchErrorResults.length)} of {searchErrorResults.length} errors
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setCurrentErrorPage(1)}
                          disabled={currentErrorPage === 1}
                          className={`px-3 py-1 rounded text-sm ${
                            currentErrorPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          First
                        </button>
                        <button
                          onClick={() => setCurrentErrorPage(currentErrorPage - 1)}
                          disabled={currentErrorPage === 1}
                          className={`px-3 py-1 rounded text-sm ${
                            currentErrorPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Prev
                        </button>
                        
                        <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded">
                          {currentErrorPage} / {totalErrorPages}
                        </span>
                        
                        <button
                          onClick={() => setCurrentErrorPage(currentErrorPage + 1)}
                          disabled={currentErrorPage === totalErrorPages}
                          className={`px-3 py-1 rounded text-sm ${
                            currentErrorPage === totalErrorPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Next
                        </button>
                        <button
                          onClick={() => setCurrentErrorPage(totalErrorPages)}
                          disabled={currentErrorPage === totalErrorPages}
                          className={`px-3 py-1 rounded text-sm ${
                            currentErrorPage === totalErrorPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {errors.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => handleClearLogs()}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Clear all errors
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Success Messages */}
            {successes.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                  Successes
                </h2>
                
                <ul className="space-y-2">
                  {successes.map((success, index) => (
                    <li key={index} className="flex items-center text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {success}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        
        {/* Performance Tab Content */}
        {activeTab === 'performance' && (
          <PerformanceMetricsPanel performanceMetrics={performanceMetrics} />
        )}
        
        {/* Network Tab Content */}
        {activeTab === 'network' && (
          <NetworkPanel networkRequests={networkRequests} />
        )}
        
        {/* Storage Tab Content */}
        {activeTab === 'storage' && (
          <StorageInspector 
            localStorage={localStorageItems}
            sessionStorage={sessionStorageItems}
            cookies={cookieItems}
          />
        )}
        
        {/* System Info Tab Content */}
        {activeTab === 'system' && (
          <SystemInfoPanel 
            environmentInfo={environmentInfo}
            resourceUsage={resourceUsage}
          />
        )}
        
        {/* Tools Tab Content */}
        {activeTab === 'tools' && (
          <UtilityButtons
            onExportData={handleExportData}
            onClearLogs={handleClearLogs}
            onInjectTestError={handleInjectTestError}
          />
        )}
        
        {/* Troubleshooting Guide - Always at bottom */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-indigo-600" />
            Troubleshooting Guide
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium flex items-center mb-2">
                <Globe className="w-4 h-4 mr-2 text-indigo-500" />
                Frontend Issues
              </h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Check browser console for JavaScript errors (F12)</li>
                <li>Clear browser cache and local storage</li>
                <li>Verify environment variables are set correctly</li>
                <li>Try rebuilding the application</li>
                <li>Check for React component errors and props validation</li>
              </ul>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium flex items-center mb-2">
                <Server className="w-4 h-4 mr-2 text-indigo-500" />
                Backend Issues
              </h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Verify the backend server is running</li>
                <li>Check server logs for errors</li>
                <li>Ensure correct port configuration (default 5000)</li>
                <li>Run server in debug mode for more information</li>
                <li>Check API endpoint response formats and status codes</li>
              </ul>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium flex items-center mb-2">
                <Database className="w-4 h-4 mr-2 text-indigo-500" />
                Database Issues
              </h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Verify database connection strings in .env file</li>
                <li>Check if database server is running</li>
                <li>Ensure correct user permissions are set</li>
                <li>Check for database migration issues</li>
                <li>Verify table schema matches application models</li>
              </ul>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium flex items-center mb-2">
                <Shield className="w-4 h-4 mr-2 text-indigo-500" />
                Authentication Issues
              </h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Verify JWT/auth tokens are properly configured</li>
                <li>Check if auth service is reachable</li>
                <li>Ensure credentials in .env are correct</li>
                <li>Try logging out and logging back in</li>
                <li>Check for cookie/storage permission issues</li>
              </ul>
            </div>
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium flex items-center mb-2">
                <Network className="w-4 h-4 mr-2 text-indigo-500" />
                Network Issues
              </h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Check internet connectivity</li>
                <li>Verify API endpoints are accessible</li>
                <li>Look for CORS configuration issues</li>
                <li>Check firewalls or proxy settings</li>
                <li>Verify WebSocket connection status if applicable</li>
              </ul>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium flex items-center mb-2">
                <Package className="w-4 h-4 mr-2 text-indigo-500" />
                Performance Issues
              </h3>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Check memory usage and potential memory leaks</li>
                <li>Identify slow API responses or database queries</li>
                <li>Optimize large component re-renders</li>
                <li>Reduce unnecessary network requests</li>
                <li>Use code splitting for large bundles</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-2">
            <a href="/" className="text-blue-600 hover:text-blue-800">
              Return to Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
