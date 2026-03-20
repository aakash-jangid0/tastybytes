import React from 'react';
import { motion } from 'framer-motion';
import { Customer } from '../../../types/Customer';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Coins, Users, ShoppingBag } from 'lucide-react';

interface CustomerAnalyticsProps {
  customers: Customer[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    color: string;
  }>;
  label?: string;
}

interface PieLabelProps {
  name?: string;
  percent?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CustomerAnalytics({ customers = [] }: CustomerAnalyticsProps) {
  // Ensure customers is an array even if undefined is passed - wrapped in useMemo to prevent dependency issues
  const safeCustomers = React.useMemo(() => {
    return Array.isArray(customers) ? customers : [];
  }, [customers]);
  
  // Calculate customer acquisition data by month
  const getCustomerGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Initialize data for all months
    const monthlyData = months.map(month => ({
      name: month,
      newCustomers: 0,
      totalCustomers: 0
    }));
    
    try {
      // Sort customers by creation date
      const sortedCustomers = [...safeCustomers].filter(c => c && c.created_at).sort(
        (a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA.getTime() - dateB.getTime();
        }
      );
      
      let runningTotal = 0;
      
      sortedCustomers.forEach(customer => {
        try {
          const date = new Date(customer.created_at);
          if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
            const month = date.getMonth();
            monthlyData[month].newCustomers++;
          }
        } catch (error) {
          console.error("Error processing customer date:", error);
        }
      });
      
      // Calculate running total
      for (let i = 0; i < monthlyData.length; i++) {
        runningTotal += monthlyData[i].newCustomers;
        monthlyData[i].totalCustomers = runningTotal;
      }
    } catch (error) {
      console.error("Error in getCustomerGrowthData:", error);
    }
    
    return monthlyData;
  };
  
  // Calculate order frequency distribution
  const getOrderFrequencyData = () => {
    const orderCounts = {
      '0': 0,
      '1-2': 0,
      '3-5': 0,
      '6-10': 0,
      '10+': 0
    };
    
    try {
      safeCustomers.forEach(customer => {
        const totalOrders = customer && typeof customer.total_orders === 'number' ? customer.total_orders : 0;
        
        if (totalOrders === 0) {
          orderCounts['0']++;
        } else if (totalOrders <= 2) {
          orderCounts['1-2']++;
        } else if (totalOrders <= 5) {
          orderCounts['3-5']++;
        } else if (totalOrders <= 10) {
          orderCounts['6-10']++;
        } else {
          orderCounts['10+']++;
        }
      });
    } catch (error) {
      console.error("Error in getOrderFrequencyData:", error);
    }
    
    return Object.entries(orderCounts).map(([name, value]) => ({ name, value }));
  };
  
  // Calculate spent amount distribution
  const getSpendingDistributionData = () => {    const ranges = [
      { name: '₹0', min: 0, max: 0 },
      { name: '₹1-500', min: 1, max: 500 },
      { name: '₹501-1000', min: 501, max: 1000 },
      { name: '₹1001-2000', min: 1001, max: 2000 },
      { name: '₹2000+', min: 2001, max: Infinity }
    ];
    
    const spendingData = ranges.map(range => {
      try {
        const count = safeCustomers.filter(
          customer => customer && 
                     typeof customer.total_spent === 'number' && 
                     customer.total_spent >= range.min && 
                     customer.total_spent <= range.max
        ).length;
        
        return {
          name: range.name,
          value: count
        };
      } catch (error) {
        console.error("Error calculating spending data:", error);
        return {
          name: range.name,
          value: 0
        };
      }
    });
    
    return spendingData;
  };
  
  // Calculate all data safely
  let growthData: Array<{name: string, newCustomers: number, totalCustomers: number}> = [];
  let orderFrequencyData: Array<{name: string, value: number}> = [];
  let spendingDistributionData: Array<{name: string, value: number}> = [];
  
  try {
    growthData = getCustomerGrowthData();
    orderFrequencyData = getOrderFrequencyData();
    spendingDistributionData = getSpendingDistributionData();
  } catch (error) {
    console.error("Error calculating analytics data:", error);
  }
  
  // Custom tooltip for the charts with error handling
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && Array.isArray(payload) && payload.length > 0) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
          <p className="font-medium text-gray-700">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare status data for pie chart with error handling
  const customerStatusData = React.useMemo(() => {
    try {
      return [
        { name: 'Active', value: safeCustomers.filter(c => c && c.status === 'active').length },
        { name: 'Inactive', value: safeCustomers.filter(c => c && c.status === 'inactive').length },
        { name: 'Blocked', value: safeCustomers.filter(c => c && c.status === 'blocked').length }
      ].filter(item => item.value > 0); // Only include segments with values
    } catch (error) {
      console.error("Error calculating customer status data:", error);
      return [{ name: 'No Data', value: 1 }];
    }
  }, [safeCustomers]);

  // Calculate average spend safely
  const averageSpend = React.useMemo(() => {
    try {
      if (safeCustomers.length === 0) return '0.00';
      
      const totalSpent = safeCustomers.reduce((sum, c) => {
        const spent = c && typeof c.total_spent === 'number' ? c.total_spent : 0;
        return sum + spent;
      }, 0);
      
      return (totalSpent / safeCustomers.length).toFixed(2);
    } catch (error) {
      console.error("Error calculating average spend:", error);
      return '0.00';
    }
  }, [safeCustomers]);

  // Calculate repeat business percentage safely
  const repeatBusinessPercentage = React.useMemo(() => {
    try {
      if (safeCustomers.length === 0) return '0.0';
      
      const repeatCustomers = safeCustomers.filter(c => 
        c && typeof c.total_orders === 'number' && c.total_orders > 1
      ).length;
      
      return (repeatCustomers / safeCustomers.length * 100).toFixed(1);
    } catch (error) {
      console.error("Error calculating repeat business percentage:", error);
      return '0.0';
    }
  }, [safeCustomers]);

  // Safe rendering function for PieChart
  const renderCustomizedLabel = ({ name, percent }: PieLabelProps) => {
    try {
      if (name && typeof percent === 'number') {
        return `${name}: ${(percent * 100).toFixed(0)}%`;
      }
      return '';
    } catch {
      return '';
    }
  };

  // Ensure slice doesn't cause errors with potentially undefined array
  const lastQuarterCustomers = growthData && growthData.length >= 3 
    ? growthData.slice(-3).reduce((sum, item) => sum + (item ? item.newCustomers : 0), 0)
    : 0;

  // Issue 1: Add a type guard for customerStatusData when using it in the chart
  const renderPie = () => {
    if (!customerStatusData || customerStatusData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          No status data available
        </div>
      );
    }
  
    return (
      <PieChart>
        <Pie
          data={customerStatusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={renderCustomizedLabel}
        >
          {customerStatusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
          Customer Analytics
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Customer Growth Chart */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Customer Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="newCustomers" 
                  stroke="#F97316" 
                  activeDot={{ r: 8 }} 
                  name="New Customers"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalCustomers" 
                  stroke="#0891b2" 
                  name="Total Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Order Frequency Chart */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Order Frequency</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Spending Distribution Chart */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Spending Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Customers">
                  {spendingDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Customer Status Breakdown */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Customer Status</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              {renderPie()}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Insights Section */}
      <div className="p-6 bg-gray-50 border-t">
        <h3 className="font-medium mb-3">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center text-orange-500 mb-2">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-medium">Customer Acquisition</span>
            </div>
            <p className="text-sm text-gray-600">
              {lastQuarterCustomers} new customers in the last quarter.
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center text-green-500 mb-2">
              <Coins className="w-5 h-5 mr-2" />
              <span className="font-medium">Revenue Growth</span>
            </div>            <p className="text-sm text-gray-600">
              Average spend per customer: ₹{averageSpend}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center text-blue-500 mb-2">
              <ShoppingBag className="w-5 h-5 mr-2" />
              <span className="font-medium">Repeat Business</span>
            </div>
            <p className="text-sm text-gray-600">
              {repeatBusinessPercentage}% of customers have placed multiple orders.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}