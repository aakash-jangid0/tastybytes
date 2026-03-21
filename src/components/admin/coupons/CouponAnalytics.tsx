import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Sector
} from 'recharts';
import { ChevronDown, ChevronUp, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { useGuest } from '../../../context/GuestContext';

interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  start_date: string;
  expiry_date: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  description: string | null;
  applies_to: 'all' | 'specific_items' | 'specific_categories';
  created_at?: string;
}

interface CouponAnalyticsProps {
  coupons: Coupon[];
}

const COLORS = ['#FF9F40', '#4BC0C0', '#36A2EB', '#9966FF', '#FF6384'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#333" fontSize={20} fontWeight={500}>
        {value}
      </text>
      <text x={cx} y={cy} dy={25} textAnchor="middle" fill="#888">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

function CouponAnalytics({ coupons }: CouponAnalyticsProps) {
  const { isGuest } = useGuest();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [activeTab, setActiveTab] = useState('usage');

  const maskCode = (code: string) => isGuest ? '••••••••' : code;

  // Sort coupons by usage count in descending order and take top 5
  const topUsedCoupons = [...coupons]
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 5)
    .map(coupon => ({
      name: maskCode(coupon.code),
      uses: coupon.usage_count,
      value: coupon.discount_type === 'percentage' 
        ? `${coupon.discount_value}%` 
        : `Rs${coupon.discount_value}`
    }));

  // Count coupons by discount type for pie chart
  const discountTypeData = [
    { name: 'Percentage', value: coupons.filter(c => c.discount_type === 'percentage').length },
    { name: 'Fixed Amount', value: coupons.filter(c => c.discount_type === 'fixed_amount').length }
  ];

  // Count coupons by status
  const statusData = [
    { name: 'Active', value: coupons.filter(c => c.is_active).length },
    { name: 'Inactive', value: coupons.filter(c => !c.is_active).length },
    { name: 'Expired', value: coupons.filter(c => new Date(c.expiry_date) < new Date() && c.is_active).length }
  ];
  
  // Calculate usage efficiency (usage_count / usage_limit) for coupons with limits
  const couponsWithLimits = coupons.filter(c => c.usage_limit && c.usage_limit > 0);
  const usageEfficiencyData = couponsWithLimits
    .sort((a, b) => (b.usage_count / (b.usage_limit || 1)) - (a.usage_count / (a.usage_limit || 1)))
    .slice(0, 5)
    .map(c => ({
      name: maskCode(c.code),
      efficiency: ((c.usage_count / (c.usage_limit || 1)) * 100).toFixed(1),
      used: c.usage_count,
      limit: c.usage_limit
    }));

  // Group coupons by month created
  const couponsByMonth = coupons.reduce((acc: Record<string, number>, coupon) => {
    if (coupon.created_at) {
      const date = new Date(coupon.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = 0;
      }
      acc[monthYear] += 1;
    }
    return acc;
  }, {});
  
  const growthData = Object.entries(couponsByMonth).map(([month, count]) => ({
    month,
    count
  })).sort((a, b) => {
    const [monthA, yearA] = a.month.split(' ');
    const [monthB, yearB] = b.month.split(' ');
    return new Date(`${monthA} 1, ${yearA}`).getTime() - new Date(`${monthB} 1, ${yearB}`).getTime();
  });

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Coupon Analytics</h2>
        <button 
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="text-gray-500 hover:text-gray-700"
        >
          {showAnalytics ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {showAnalytics && (
        <div>
          <div className="flex border-b mb-6">
            <button 
              className={`px-4 py-2 mr-4 font-medium ${activeTab === 'usage' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('usage')}
            >
              <div className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Usage
              </div>
            </button>
            <button 
              className={`px-4 py-2 mr-4 font-medium ${activeTab === 'distribution' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('distribution')}
            >
              <div className="flex items-center">
                <PieChartIcon className="h-4 w-4 mr-2" />
                Distribution
              </div>
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'trends' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('trends')}
            >
              <div className="flex items-center">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Trends
              </div>
            </button>
          </div>
          
          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Most Used Coupons</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      width={500}
                      height={300}
                      data={topUsedCoupons}
                      margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [value, 'Uses']}
                        labelFormatter={(label: string) => `Coupon: ${label}`}
                      />
                      <Bar dataKey="uses" fill="#FF9F40">
                        {topUsedCoupons.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {usageEfficiencyData.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Usage Efficiency (% of Limit Used)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        width={500}
                        height={300}
                        data={usageEfficiencyData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis unit="%" />
                        <Tooltip 
                          formatter={(value: string) => [`${value}%`, 'Efficiency']}
                          labelFormatter={(label: string) => `Coupon: ${label}`}
                        />
                        <Bar dataKey="efficiency" fill="#4BC0C0">
                          {usageEfficiencyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'distribution' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Discount Types</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart width={400} height={300}>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={discountTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                      >
                        {discountTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Coupon Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart width={400} height={300}>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'trends' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Coupons Created Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    width={500}
                    height={300}
                    data={growthData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Coupons Created']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#FF9F40" 
                      activeDot={{ r: 8 }} 
                      name="Coupons Created"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default CouponAnalytics;
