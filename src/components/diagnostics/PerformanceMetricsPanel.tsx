import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Clock, Zap } from 'lucide-react';

interface ApiMetric {
  url?: string;
  duration: number;
  method?: string;
  status?: number;
}

interface PageLoadMetrics {
  total: number;
  domContentLoaded: number;
  loaded: number;
  interactive: number;
  domComplete: number;
}

interface ResourceMetric {
  duration: number;
}

export interface PerformanceMetrics {
  api?: ApiMetric[];
  pageLoad?: PageLoadMetrics;
  resource?: ResourceMetric[];
  [key: string]: unknown;
}

interface PerformanceMetricProps {
  performanceMetrics: PerformanceMetrics;
}

const PerformanceMetricsPanel: React.FC<PerformanceMetricProps> = ({ performanceMetrics }) => {
  const formatApiData = () => {
    if (!performanceMetrics.api || !Array.isArray(performanceMetrics.api)) {
      return [];
    }

    // Process the last 20 API calls for the chart
    return performanceMetrics.api.slice(-20).map(call => ({
      name: call.url?.split('/').pop() || call.url || 'Request',
      duration: Math.round(call.duration),
      url: call.url,
      method: call.method,
      status: call.status
    })).reverse();
  };

  const formatPageLoadData = () => {
    if (!performanceMetrics.pageLoad) {
      return null;
    }

    const { total, domContentLoaded, loaded, interactive, domComplete } = performanceMetrics.pageLoad;
    
    return [
      { name: 'DOM Interactive', value: Math.round(interactive) },
      { name: 'DOM Content Loaded', value: Math.round(domContentLoaded) },
      { name: 'DOM Complete', value: Math.round(domComplete) },
      { name: 'Page Load', value: Math.round(loaded) },
      { name: 'Total', value: Math.round(total) }
    ];
  };

  const apiData = formatApiData();
  const pageLoadData = formatPageLoadData();
  const resourceMetrics = performanceMetrics.resource ?? [];
  const averageResourceDuration = resourceMetrics.length > 0
    ? Math.round(resourceMetrics.reduce((sum, resource) => sum + resource.duration, 0) / resourceMetrics.length)
    : undefined;

  const getPageLoadReport = () => {
    if (!performanceMetrics.pageLoad) {
      return 'No page load metrics available';
    }

    const { loaded } = performanceMetrics.pageLoad;
    
    if (loaded < 1000) {
      return 'Excellent page load time';
    } else if (loaded < 2500) {
      return 'Good page load time';
    } else if (loaded < 5000) {
      return 'Average page load time';
    } else {
      return 'Page load time needs improvement';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Zap className="w-5 h-5 mr-2 text-purple-600" />
        Performance Metrics
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Load Metrics */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border rounded-lg p-4"
        >
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-blue-500" />
            Page Load Performance
          </h3>
          
          {pageLoadData ? (
            <>
              <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
                {getPageLoadReport()}
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={pageLoadData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis 
                    label={{ 
                      value: 'milliseconds', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: 10 } 
                    }} 
                    tick={{fontSize: 10}}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} ms`, 'Time']}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No page load metrics available
            </div>
          )}
        </motion.div>
        
        {/* API Response Times */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border rounded-lg p-4"
        >
          <h3 className="font-medium text-gray-700 mb-3">API Response Times</h3>
          
          {apiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={apiData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 10}} />
                <YAxis 
                  label={{ 
                    value: 'milliseconds', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: 10 } 
                  }}
                  tick={{fontSize: 10}}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} ms`, 'Response Time']}
                  labelFormatter={(label: string) => `API: ${label}`}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line type="monotone" dataKey="duration" stroke="#82ca9d" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No API metrics available
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Resource load times summary */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          {averageResourceDuration === undefined
            ? 'No resource metrics available'
            : `${resourceMetrics.length} resources tracked with an average load time of ${averageResourceDuration} ms`}
        </p>
      </div>
    </div>
  );
};

export default PerformanceMetricsPanel;
