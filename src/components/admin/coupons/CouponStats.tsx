import React from 'react';
import { motion } from 'framer-motion';
import { Tag, Percent, Coins, CalendarClock } from 'lucide-react';
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
}

interface CouponStatsProps {
  coupons: Coupon[];
}

function CouponStats({ coupons }: CouponStatsProps) {
  const { isGuest } = useGuest();
  // Calculate stats
  const activeCoupons = coupons.filter(coupon => coupon.is_active).length;
  
  const expiringSoon = coupons.filter(coupon => {
    const expiryDate = new Date(coupon.expiry_date);
    const now = new Date();
    const differenceInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return differenceInDays <= 7 && differenceInDays >= 0 && coupon.is_active;
  }).length;

  const percentageCoupons = coupons.filter(coupon => coupon.discount_type === 'percentage').length;
  const fixedCoupons = coupons.filter(coupon => coupon.discount_type === 'fixed_amount').length;

  // Get the most used coupon
  const mostUsedCoupon = coupons.length > 0 
    ? coupons.reduce((prev, current) => (prev.usage_count > current.usage_count) ? prev : current) 
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-lg shadow"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Coupons</p>
            <p className="text-2xl font-semibold">{activeCoupons}</p>
            <p className="text-sm text-gray-500">out of {coupons.length} total</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-lg">
            <Tag className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-4 rounded-lg shadow"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Expiring Soon</p>
            <p className="text-2xl font-semibold">{expiringSoon}</p>
            <p className="text-sm text-gray-500">in the next 7 days</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <CalendarClock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-4 rounded-lg shadow"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Discount Types</p>
            <p className="text-2xl font-semibold">{percentageCoupons} / {fixedCoupons}</p>
            <p className="text-sm text-gray-500">percentage / fixed</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Percent className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-4 rounded-lg shadow"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Most Used Coupon</p>
            {mostUsedCoupon ? (
              <>
                <p className="text-lg font-semibold">{isGuest ? '••••••••' : mostUsedCoupon.code}</p>
                <p className="text-sm text-gray-500">{mostUsedCoupon.usage_count} uses</p>
              </>
            ) : (
              <p className="text-lg font-semibold">No data</p>
            )}
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <Coins className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CouponStats;
