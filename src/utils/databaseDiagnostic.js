// Database Connection Diagnostic Tool

import { supabase } from '../lib/supabase';
import connectionMonitor from './connectionMonitor';

class DatabaseDiagnostic {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  async runDiagnostic() {
    if (this.isRunning) {
      console.warn('Diagnostic already running');
      return { success: false, message: 'Diagnostic already in progress' };
    }

    this.isRunning = true;
    this.testResults = [];
    console.log('Starting database connection diagnostic...');

    try {
      await this.testBasicConnection();
      await this.testQueryPerformance();
      await this.testRealtime();
      
      // Additional connection stats
      this.testResults.push({
        name: 'Connection Statistics',
        success: true,
        data: {
          activeConnections: connectionMonitor.getActiveConnectionCount(),
          supabaseConnections: connectionMonitor.getActiveConnectionCount('supabase'),
          stats: connectionMonitor.stats
        }
      });

      return {
        success: true,
        results: this.testResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Diagnostic failed:', error);
      return {
        success: false,
        error: error.message,
        results: this.testResults,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isRunning = false;
    }
  }

  async testBasicConnection() {
    try {
      console.log('Testing basic connection...');
      const startTime = performance.now();
      
      // Test with a simple health check query
      const { data, error } = await supabase.rpc('check_database_health', {});
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (error) {
        this.testResults.push({
          name: 'Basic Connection',
          success: false,
          error: error.message,
          responseTime
        });
        throw error;
      }
      
      this.testResults.push({
        name: 'Basic Connection',
        success: true,
        responseTime,
        data
      });
      
      return true;
    } catch (error) {
      // Try a simple table query if RPC fails
      try {
        const startTime = performance.now();
        const { data, error: queryError } = await supabase
          .from('categories')
          .select('count')
          .limit(1)
          .maybeSingle();
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        if (queryError) {
          this.testResults.push({
            name: 'Fallback Query',
            success: false,
            error: queryError.message,
            responseTime
          });
          throw queryError;
        }
        
        this.testResults.push({
          name: 'Fallback Query',
          success: true,
          responseTime,
          data
        });
        
        return true;
      } catch (fallbackError) {
        // Both connection attempts failed
        console.error('Connection test failed:', fallbackError);
        throw new Error(`Database connection failed: ${fallbackError.message}`);
      }
    }
  }

  async testQueryPerformance() {
    try {
      console.log('Testing query performance...');
      const startTime = performance.now();
      
      // Test with a slightly more complex query
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:categories(name)')
        .limit(5);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (error) {
        this.testResults.push({
          name: 'Query Performance',
          success: false,
          error: error.message,
          responseTime
        });
        throw error;
      }
      
      this.testResults.push({
        name: 'Query Performance',
        success: true,
        responseTime,
        data: { count: data?.length || 0 }
      });
      
      return true;
    } catch (error) {
      console.error('Query performance test failed:', error);
      // Don't throw - continue with other tests
      return false;
    }
  }

  async testRealtime() {
    return new Promise((resolve, reject) => {
      try {
        console.log('Testing realtime functionality...');
        const startTime = performance.now();
        
        // Set timeout for the test
        const timeoutId = setTimeout(() => {
          channel.unsubscribe();
          this.testResults.push({
            name: 'Realtime',
            success: false,
            error: 'Subscription timed out after 5 seconds',
            responseTime: 5000
          });
          resolve(false);
        }, 5000);
        
        // Create a test channel
        const channel = supabase
          .channel('diagnostic-test')
          .subscribe((status) => {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            clearTimeout(timeoutId);
            
            if (status === 'SUBSCRIBED') {
              this.testResults.push({
                name: 'Realtime',
                success: true,
                responseTime,
                data: { status }
              });
              
              // Unsubscribe immediately after success
              channel.unsubscribe();
              resolve(true);
            } else if (status === 'CHANNEL_ERROR') {
              this.testResults.push({
                name: 'Realtime',
                success: false,
                error: 'Failed to subscribe to channel',
                responseTime,
                data: { status }
              });
              resolve(false);
            }
          });
      } catch (error) {
        console.error('Realtime test failed:', error);
        this.testResults.push({
          name: 'Realtime',
          success: false,
          error: error.message
        });
        resolve(false);
      }
    });
  }

  // Help method to fix connections
  async fixConnections() {
    console.log('Attempting to fix database connections...');
    
    // Close all active channels
    const allChannels = supabase.getChannels();
    for (const channel of allChannels) {
      supabase.removeChannel(channel);
    }
    
    // Reset the connection monitor
    connectionMonitor.activeConnections = new Map();
    connectionMonitor.stats.totalConnections = 0;
    
    // Test connection after cleanup
    return this.testBasicConnection();
  }
}

const databaseDiagnosticInstance = new DatabaseDiagnostic();

export { databaseDiagnosticInstance as databaseDiagnostic };
export default databaseDiagnosticInstance;
