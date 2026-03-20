import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Package, RefreshCcw, Search, ChevronDown, Filter, Download } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PageTransition from '../components/common/PageTransition';
import { viewOrDownloadInvoice } from '../utils/invoiceUtils';
import { useOrders } from '../hooks/useOrders';

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
}

function OrderHistory() {
  const { addToCart } = useCart();
  const { orders, loading } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState<Record<string, boolean>>({});

  const handleDownloadInvoice = async (orderId: string) => {
    setLoadingInvoices(prev => ({ ...prev, [orderId]: true }));
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      
      await viewOrDownloadInvoice(orderId, order, true);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setLoadingInvoices(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReorder = (items: OrderItem[]) => {
    items.forEach(item => {
      addToCart({
        id: item.id || `${item.name}-${Date.now()}`, // Generate ID if missing
        name: item.name,
        price: item.price,
        image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
      });
    });
    toast.success('Items added to cart');
  };

  const filteredOrders = orders
    .filter(order => 
      selectedStatus === 'all' || order.status === selectedStatus
    )
    .filter(order =>
      order.order_items?.some((item: OrderItem) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      order.id.slice(-6).includes(searchQuery)
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Order #{order.id.slice(-6)}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                      <span className="text-lg font-semibold">
                        ₹{order.total_amount.toFixed(2)}
                      </span>
                      {(order as any).coupon_code && (
                        <div className="flex items-center text-sm text-green-600">
                          <span className="mr-2">Applied Coupon:</span>
                          <span className="font-medium">{String((order as any).coupon_code)}</span>
                          <span className="mx-1">-</span>
                          <span>
                            {(order as any).coupon_discount_type === 'percentage'
                              ? `${(order as any).coupon_discount_value}% off`
                              : `₹${(order as any).coupon_discount_amount} off`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/track/${order.id}`}
                        className="text-orange-500 hover:text-orange-600 font-medium flex items-center"
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Track Order
                      </Link>

                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        className="text-green-500 hover:text-green-600 font-medium flex items-center"
                        disabled={loadingInvoices[order.id]}
                      >
                        {loadingInvoices[order.id] ? (
                          <span className="flex items-center">
                            <div className="animate-spin h-4 w-4 mr-1 border-b-2 border-green-500 rounded-full"></div>
                            Loading...
                          </span>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-1" />
                            Download Bill
                          </>
                        )}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleReorder(order.order_items)}
                      className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Reorder
                    </button>
                  </div>

                  <div className="flex items-center justify-between cursor-pointer mt-4"
                    onClick={() => setExpandedOrder(
                      expandedOrder === order.id ? null : order.id
                    )}
                  >
                    <span className="text-sm text-gray-500">
                      {order.order_items?.length} {order.order_items?.length === 1 ? 'item' : 'items'}
                    </span>
                    <motion.button
                      animate={{ rotate: expandedOrder === order.id ? 180 : 0 }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-4 pt-4 border-t">
                          {order.order_items?.map((item: OrderItem, index: number) => (
                            <div key={index} className="flex items-center space-x-4">
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-500">
                                  Quantity: {item.quantity}
                                </p>
                                {item.notes && (
                                  <p className="text-sm text-orange-500">
                                    Note: {item.notes}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₹{item.price.toFixed(2)}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart({
                                      id: item.id || `${item.name}-${Date.now()}`, // Generate ID if missing
                                      name: item.name,
                                      price: item.price,
                                      image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
                                    });
                                    toast.success(`${item.name} added to cart`);
                                  }}
                                  className="text-sm text-orange-500 hover:text-orange-600"
                                >
                                  Add to cart
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default OrderHistory;