import React from 'react';
import { User, Calendar, ShoppingBag, Phone } from 'lucide-react';
import { Customer } from '../../../types/Customer';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onView?: (customerId: string) => void;
  onStatusChange: (id: string, status: Customer['status']) => void;
}

export default function CustomerCard({ customer, onEdit, onView, onStatusChange }: CustomerCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md cursor-pointer transition-shadow"
      onClick={() => onView?.(customer.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-gray-100 p-2 rounded-full">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">{customer.name}</h3>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>
        <select
          value={customer.status}
          onChange={(e) => onStatusChange(customer.id, e.target.value as Customer['status'])}
          className={`text-sm rounded-full px-3 py-1 ${
            customer.status === 'active' ? 'bg-green-100 text-green-800' :
            customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-500">
          <Phone className="w-4 h-4 mr-2" />
          {customer.phone}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          Joined {new Date(customer.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <ShoppingBag className="w-4 h-4 mr-2" />
          {customer.total_orders} orders · ₹{customer.total_spent.toFixed(2)}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(customer);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Edit Details
        </button>
      </div>
    </div>
  );
}