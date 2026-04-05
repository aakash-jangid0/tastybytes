import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Bug, AlertCircle } from 'lucide-react';

type ErrorCategory = 'frontend' | 'backend' | 'database' | 'network' | 'auth' | 'resources' | 'other';

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

interface ErrorAnalyticsProps {
  errors: DiagnosticError[];
}

const ErrorAnalyticsPanel: React.FC<ErrorAnalyticsProps> = ({ errors }) => {  // Limit number of errors to process for better performance
  const limitedErrors = React.useMemo(() => {
    if (!errors || !Array.isArray(errors)) return [];
    return errors.slice(0, 500); // Only process the 500 most recent errors
  }, [errors]);
    // Data processing for charts
  const errorsByCategory = React.useMemo(() => {
    if (!limitedErrors || limitedErrors.length === 0) {
      return [];
    }
    
    const categories = limitedErrors.reduce((acc: Record<string, number>, error) => {
      const category = error.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(categories).map(category => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: categories[category],
    }));
  }, [limitedErrors]);
    // Data for source type distribution
  const errorsBySource = React.useMemo(() => {
    if (!limitedErrors || limitedErrors.length === 0) {
      return [];
    }
    
    const sources = limitedErrors.reduce((acc: Record<string, number>, error) => {
      const source = error.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(sources).map(source => ({
      name: source.charAt(0).toUpperCase() + source.slice(1),
      value: sources[source],
    }));
  }, [limitedErrors]);
    // For time-based analysis
  const errorsByHour = React.useMemo(() => {
    if (!limitedErrors || limitedErrors.length === 0) {
      return {};
    }
    
    const last24Hours = [...Array(24)].map((_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - i);
      return d.getHours();
    }).reverse();
    
    const counts: Record<number, number> = {};
    last24Hours.forEach(hour => { counts[hour] = 0 });
    
    limitedErrors.forEach(error => {
      if (error.timestamp) {
        const errorTime = new Date(error.timestamp);
        const hoursSince = Math.floor((Date.now() - errorTime.getTime()) / (1000 * 60 * 60));
        
        if (hoursSince < 24) {
          const hour = errorTime.getHours();
          counts[hour] = (counts[hour] || 0) + 1;
        }
      }
    });
    
    return counts;  }, [limitedErrors]);
    // Most common error patterns
  const commonErrors = React.useMemo(() => {
    if (!limitedErrors || limitedErrors.length === 0) {
      return [];
    }
    
    const errorMessages: Record<string, {count: number, error: DiagnosticError}> = {};
    
    limitedErrors.forEach(error => {
      // Get a simple representation of the error message for grouping
      let simpleMessage = error.message;
      if (simpleMessage && simpleMessage.length > 20) {
        // Only use the first part for grouping
        simpleMessage = simpleMessage.substring(0, 20);
      }
      
      if (!errorMessages[simpleMessage]) {
        errorMessages[simpleMessage] = {
          count: 0,
          error
        };
      }
      errorMessages[simpleMessage].count++;
    });
    
    return Object.values(errorMessages)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);  }, [limitedErrors]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300'];

  if (!errors || errors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
          Error Analytics
        </h2>
        <div className="text-center py-12">
          <Bug className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            No errors to analyze yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
        Error Analytics
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Category Distribution */}
        {errorsByCategory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border rounded-lg p-4"
          >
            <h3 className="font-medium text-gray-700 mb-3">Error Category Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {errorsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
        
        {/* Error Source Distribution */}
        {errorsBySource.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border rounded-lg p-4"
          >
            <h3 className="font-medium text-gray-700 mb-3">Error Source Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorsBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#82ca9d"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {errorsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Common Error Patterns */}
      {commonErrors.length > 0 && (
        <div className="mt-6 border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3">Common Error Patterns</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Message</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occurrences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commonErrors.map((item, index) => (
                  <tr key={index} className="bg-white">
                    <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-xs" title={item.error.message}>
                      {item.error.message}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {item.error.category}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        {/* Error statistics summary */}
      <div className="mt-4 bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
        <p>
          Total errors: {errors.length} |  
          {errors.length > limitedErrors.length && <span className="text-orange-600"> (Showing {limitedErrors.length} most recent) | </span>}
          Last error: {errors.length > 0 ? new Date(errors[0].timestamp).toLocaleString() : 'N/A'} | 
          Unique categories: {errorsByCategory.length}
        </p>
      </div>
    </div>
  );
};

export default ErrorAnalyticsPanel;
