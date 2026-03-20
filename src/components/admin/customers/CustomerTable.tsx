import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, CheckCircle, XCircle } from 'lucide-react';
import { Customer } from '../../../types/Customer';

interface CustomerTableProps {
  customers: Customer[];
  selectedCustomers: string[];
  onSelect: (ids: string[]) => void;
  onEdit: (customer: Customer) => void;
  onView?: (customerId: string) => void;
  onStatusChange: (customerId: string, newStatus: Customer['status']) => void;
  filters: {
    search: string;
    status: string;
    sortBy: string;
    tags: string[];
    spentRange: { min: number; max: number };
    dateRange: { start: Date | null; end: Date | null };
  };
  view: 'table' | 'cards';
}

export default function CustomerTable({
  customers,
  selectedCustomers,
  onSelect,
  onEdit,
  onView,
  onStatusChange,
  filters,
  view
}: CustomerTableProps) {
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = filters.search
      ? customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.phone.includes(filters.search)
      : true;

    // Status filter
    const matchesStatus = filters.status === 'all' || customer.status === filters.status;

    // Tags filter
    const matchesTags = filters.tags.length === 0 || 
      filters.tags.some(tag => customer.tags?.includes(tag));

    // Spent range filter
    const withinSpentRange = 
      customer.total_spent >= filters.spentRange.min && 
      customer.total_spent <= filters.spentRange.max;

    // Date range filter
    let withinDateRange = true;
    if (filters.dateRange.start || filters.dateRange.end) {
      const customerDate = new Date(customer.created_at);
      withinDateRange = 
        (!filters.dateRange.start || customerDate >= filters.dateRange.start) && 
        (!filters.dateRange.end || customerDate <= filters.dateRange.end);
    }

    return matchesSearch && matchesStatus && matchesTags && withinSpentRange && withinDateRange;
  });

  // Sort customers based on filter
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (filters.sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'spent':
        return b.total_spent - a.total_spent;
      default:
        return 0;
    }
  });

  const toggleSelectAll = () => {
    if (selectedCustomers.length === sortedCustomers.length) {
      onSelect([]);
    } else {
      onSelect(sortedCustomers.map(c => c.id));
    }
  };

  const toggleSelectCustomer = (customerId: string) => {
    if (selectedCustomers.includes(customerId)) {
      onSelect(selectedCustomers.filter(id => id !== customerId));
    } else {
      onSelect([...selectedCustomers, customerId]);
    }
  };

  if (view === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {sortedCustomers.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">
            No customers match the current filters
          </div>
        ) : (
          sortedCustomers.map(customer => (
            <motion.div
              key={customer.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md cursor-pointer transition-shadow"
              onClick={() => onView?.(customer.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{customer.name}</h3>
                  <p className="text-sm text-gray-600">{customer.email}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  customer.status === 'active' ? 'bg-green-100 text-green-800' :
                  customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {customer.status}
                </span>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Spent:</span> Rs{customer.total_spent.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Last Visit:</span> {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never'}
                </p>
              </div>
              
              {customer.tags && customer.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {customer.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(customer);
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(
                      customer.id, 
                      customer.status === 'active' ? 'inactive' : 'active'
                    );
                  }}
                  className="p-1 hover:bg-gray-50 rounded"
                >
                  {customer.status === 'active' ? <XCircle size={16} className="text-gray-500" /> : <CheckCircle size={16} className="text-green-500" />}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                  checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                  onChange={toggleSelectAll}
                />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Spent
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Visit
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tags
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedCustomers.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                No customers match the current filters
              </td>
            </tr>
          ) : (
            sortedCustomers.map(customer => (
              <motion.tr
                key={customer.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onView?.(customer.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => toggleSelectCustomer(customer.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' :
                    customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {customer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Rs{customer.total_spent.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {customer.tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(customer);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(
                          customer.id, 
                          customer.status === 'active' ? 'inactive' : 'active'
                        );
                      }}
                      className={customer.status === 'active' ? 'text-gray-500' : 'text-green-500'}
                    >
                      {customer.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}