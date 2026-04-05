import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Database, AlertTriangle } from 'lucide-react';

interface StorageData {
  [key: string]: string;
}

interface StorageInspectorProps {
  localStorage: StorageData;
  sessionStorage: StorageData;
  cookies: StorageData;
}

const StorageInspector: React.FC<StorageInspectorProps> = ({ 
  localStorage, 
  sessionStorage, 
  cookies 
}) => {
  const [activeTab, setActiveTab] = React.useState<'local' | 'session' | 'cookies'>('local');
  
  const renderStorageItems = (items: StorageData) => {
    const entries = Object.entries(items);
    
    if (entries.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No items found
        </div>
      );
    }

    if (items.error) {
      return (
        <div className="p-3 bg-red-50 text-red-600 rounded flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Error accessing storage: {items.error}
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map(([key, value]) => (
              <tr key={key} className="bg-white">
                <td className="px-4 py-2 text-sm font-medium text-gray-900 align-top">
                  {key}
                </td>
                <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-xs">
                  <div className="max-h-20 overflow-y-auto break-all">
                    {tryParseJSON(value)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Try to parse and display JSON nicely if possible
  const tryParseJSON = (str: string) => {
    try {
      // Check if it looks like JSON
      if ((str.startsWith('{') && str.endsWith('}')) || 
          (str.startsWith('[') && str.endsWith(']'))) {
        const parsed = JSON.parse(str);
        return (
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      }
      return str;
    } catch (e) {
      return str;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Database className="w-5 h-5 mr-2 text-green-600" />
        Storage Inspector
      </h2>

      <div className="mb-4 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('local')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'local'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            LocalStorage
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'session'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            SessionStorage
          </button>
          <button
            onClick={() => setActiveTab('cookies')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'cookies'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cookies
          </button>
        </nav>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'local' && renderStorageItems(localStorage)}
        {activeTab === 'session' && renderStorageItems(sessionStorage)}
        {activeTab === 'cookies' && renderStorageItems(cookies)}
      </motion.div>

      {activeTab === 'cookies' && (
        <div className="mt-4 bg-blue-50 p-3 rounded text-sm text-blue-800">
          <p className="flex items-center">
            <ExternalLink className="w-4 h-4 mr-2" />
            Note: HttpOnly cookies cannot be accessed by JavaScript and won't appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default StorageInspector;
