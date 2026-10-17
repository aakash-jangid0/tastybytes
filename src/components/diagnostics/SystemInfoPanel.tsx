import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, ArrowRight, Smile, Search } from 'lucide-react';

interface MemoryUsage {
  used?: number;
  total?: number;
  limit?: number;
}

export interface ResourceUsage {
  memory?: MemoryUsage;
}

interface SystemInfoProps {
  environmentInfo: Record<string, unknown>;
  resourceUsage: ResourceUsage;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const SystemInfoPanel: React.FC<SystemInfoProps> = ({ 
  environmentInfo, 
  resourceUsage
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const formatValue = (value: unknown): string => {
    if (value === undefined || value === null) return 'Not available';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value) ?? String(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };
  
  const formatBytes = (bytes?: number): string => {
    if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return 'Not available';
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  // Filter system info by search term
  const filteredInfo = React.useMemo(() => {
    if (!environmentInfo) return [];

    const visitedObjects = new WeakSet<object>();
    visitedObjects.add(environmentInfo);
    const flattenObject = (obj: Record<string, unknown>, prefix = ''): Array<[string, unknown]> => {
      return Object.entries(obj).flatMap(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (isRecord(value) && !(value instanceof Date)) {
          if (visitedObjects.has(value)) return [[newKey, '[Circular]']];
          visitedObjects.add(value);
          return flattenObject(value, newKey);
        }
        return [[newKey, value]];
      });
    };
    
    const flattened = flattenObject(environmentInfo);
    
    if (!searchTerm) return flattened;
    
    return flattened.filter(([key, value]) => {
      return key.toLowerCase().includes(searchTerm.toLowerCase()) ||
             formatValue(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [environmentInfo, searchTerm]);
  const memory = resourceUsage.memory;
  const memoryPercent = memory?.used !== undefined && memory.total !== undefined && memory.total > 0
    ? Math.min(100, Math.max(0, Math.round((memory.used / memory.total) * 100)))
    : undefined;
  const browserFeatures = isRecord(environmentInfo.features) ? environmentInfo.features : undefined;
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Cpu className="w-5 h-5 mr-2 text-teal-600" />
        System Information
      </h2>
      
      {/* Search bar */}
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Filter system info..."
          className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* System info sections */}
      <div className="space-y-6">
        {/* Resource usage section if available */}
        {memory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border rounded-lg bg-gray-50"
          >
            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-500" />
              Memory Usage
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Used Memory</div>
                <div className="text-lg font-semibold">{formatBytes(memory.used)}</div>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Total Allocated</div>
                <div className="text-lg font-semibold">{formatBytes(memory.total)}</div>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Heap Limit</div>
                <div className="text-lg font-semibold">{formatBytes(memory.limit)}</div>
              </div>
            </div>
            
            {/* Memory usage bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${memoryPercent ?? 0}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500 text-right">
                {memoryPercent === undefined ? 'Usage unavailable' : `${memoryPercent}% used`}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Browser & Environment Info */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Property
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredInfo.map(([key, value], index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    {key}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-md">
                    {formatValue(value)}
                  </td>
                </tr>
              ))}
              
              {filteredInfo.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? (
                      <>
                        <Search className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        No results match your search
                      </>
                    ) : (
                      <>
                        <Smile className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        No system information available
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Browser feature support */}
      {browserFeatures && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-3">Browser Feature Support</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Object.entries(browserFeatures).map(([feature, supported]) => {
              const isSupported = supported === true;
              return (
                <div 
                  key={feature}
                  className={`px-3 py-2 rounded-md text-sm flex items-center ${
                    isSupported ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${isSupported ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {feature}
                  {isSupported && (
                    <ArrowRight className="h-3 w-3 ml-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemInfoPanel;
