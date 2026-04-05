import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, ArrowRight, Smile, Search } from 'lucide-react';

interface SystemInfoProps {
  environmentInfo: any;
  resourceUsage: any;
}

const SystemInfoPanel: React.FC<SystemInfoProps> = ({ 
  environmentInfo, 
  resourceUsage
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return 'Not available';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  
  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  // Filter system info by search term
  const filteredInfo = React.useMemo(() => {
    if (!environmentInfo) return [];
    
    const flattenObject = (obj: any, prefix = ''): Array<[string, any]> => {
      return Object.entries(obj).reduce((acc: Array<[string, any]>, [key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return [...acc, ...flattenObject(value, newKey)];
        }
        
        return [...acc, [newKey, value]];
      }, []);
    };
    
    const flattened = flattenObject(environmentInfo);
    
    if (!searchTerm) return flattened;
    
    return flattened.filter(([key, value]) => {
      return key.toLowerCase().includes(searchTerm.toLowerCase()) ||
             formatValue(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [environmentInfo, searchTerm]);
  
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
        {resourceUsage && resourceUsage.memory && (
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
                <div className="text-lg font-semibold">{formatBytes(resourceUsage.memory.used)}</div>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Total Allocated</div>
                <div className="text-lg font-semibold">{formatBytes(resourceUsage.memory.total)}</div>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Heap Limit</div>
                <div className="text-lg font-semibold">{formatBytes(resourceUsage.memory.limit)}</div>
              </div>
            </div>
            
            {/* Memory usage bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(resourceUsage.memory.used / resourceUsage.memory.total) * 100}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500 text-right">
                {Math.round((resourceUsage.memory.used / resourceUsage.memory.total) * 100)}% used
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
      {environmentInfo && environmentInfo.features && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-3">Browser Feature Support</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Object.entries(environmentInfo.features).map(([feature, supported]) => (
              <div 
                key={feature}
                className={`px-3 py-2 rounded-md text-sm flex items-center ${
                  Boolean(supported) ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full mr-2 ${Boolean(supported) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {feature}
                {Boolean(supported) && (
                  <ArrowRight className="h-3 w-3 ml-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemInfoPanel;
