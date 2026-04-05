import React from 'react';
import { Wifi, WifiOff, RefreshCw, Link2, Clock, AlertTriangle } from 'lucide-react';

interface NetworkRequestProps {
  networkRequests: any[];
}

// Use React.memo to prevent unnecessary re-renders of the entire component
const NetworkPanel: React.FC<NetworkRequestProps> = React.memo(({ networkRequests }) => {
  const [filter, setFilter] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const requestsPerPage = 20;
    // Process network requests - limit total size to improve performance
  // Note: memo the limiting operation based on the original array
  const limitedRequests = React.useMemo(() => {
    if (!Array.isArray(networkRequests)) return [];
    // Limit to just 500 requests to prevent performance issues
    return networkRequests.slice(0, 500);
  }, [networkRequests]);
    // Filter requests by status
  const filteredRequests = React.useMemo(() => {
    if (!Array.isArray(limitedRequests) || limitedRequests.length === 0) return [];
    
    // For better performance, don't perform filtering if it's "all" requests
    if (filter === 'all') {
      return limitedRequests;
    }
    
    // Create filter function based on filter type to avoid multiple conditions in the filter function
    let filterFn;
    switch (filter) {
      case 'error':
        filterFn = (req: any) => req.status >= 400 || req.status === 'error';
        break;
      case 'success':
        filterFn = (req: any) => req.status >= 200 && req.status < 300;
        break;
      case 'pending':
        filterFn = (req: any) => req.status === 'pending';
        break;
      default:
        return limitedRequests;
    }
    
    // Apply the filter function
    return limitedRequests.filter(filterFn);
  }, [limitedRequests, filter]);

  // Function to get row class based on status
  const getRowClass = (request: any) => {
    if (request.status === 'pending') return 'bg-yellow-50';
    if (request.status === 'error') return 'bg-red-50';
    if (request.status >= 400) return 'bg-red-50';
    if (request.status >= 200 && request.status < 300) return 'bg-green-50';
    return 'bg-white';
  };

  // Format duration nicely
  const formatDuration = (duration: number) => {
    if (!duration) return '—';
    if (duration < 1) return '<1ms';
    if (duration < 1000) return `${Math.round(duration)}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  // Format the URL to be more readable
  const formatUrl = (url: string) => {
    try {
      if (!url) return '—';
      const urlObj = new URL(url);
      // Just show pathname + querystring
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      return url;
    }
  };
  // Calculate displayed items based on pagination
  const paginatedRequests = React.useMemo(() => {
    const startIndex = (currentPage - 1) * requestsPerPage;
    const endIndex = startIndex + requestsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, currentPage, requestsPerPage]);
  
  // Calculate pagination controls
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  // Handle page navigation
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Link2 className="w-5 h-5 mr-2 text-blue-600" />
          Network Requests
        </h2>
        
        <div className="mt-2 sm:mt-0">
          <div className="flex space-x-2">
            <select 
              className="border rounded py-1 px-3 text-sm"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="success">Success (200-299)</option>
              <option value="error">Errors</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-8">
          <WifiOff className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No network requests recorded</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Time
                  </div>
                </th>
              </tr>            </thead>            <tbody className="bg-white divide-y divide-gray-200">
              {/* Optimize rendering by extracting a row component */}
              {paginatedRequests.map((request, index) => (
                <tr key={`network-row-${index}-${currentPage}-${request.id || Math.random().toString(36).substring(2, 9)}`} className={getRowClass(request)}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {request.status === 'pending' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Pending
                      </span>
                    ) : request.status === 'error' || request.status >= 400 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {request.status === 'error' ? 'Error' : request.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <Wifi className="w-3 h-3 mr-1" />
                        {request.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.method ? request.method.toUpperCase() : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate" title={request.url}>
                    {formatUrl(request.url)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(request.duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}      
      <div className="mt-4 flex flex-wrap items-center justify-between">
        <div className="text-xs text-gray-500">
          {filteredRequests.length > 0 && (
            <p>Showing {((currentPage - 1) * requestsPerPage) + 1} - {Math.min(currentPage * requestsPerPage, filteredRequests.length)} of {filteredRequests.length} requests</p>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 text-xs rounded ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 text-xs rounded ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Prev
            </button>
            
            <span className="px-2 py-1 text-xs text-gray-700">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 text-xs rounded ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 text-xs rounded ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last
            </button>
          </div>
        )}
      </div>
    </div>  );
});

export default NetworkPanel;
