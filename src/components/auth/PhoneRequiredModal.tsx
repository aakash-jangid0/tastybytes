import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getCustomerByPhone } from '../../utils/customerUtils';

interface PhoneRequiredModalProps {
  isOpen: boolean;
  userId: string;
  onPhoneAdded: (phone: string) => void;
}

export default function PhoneRequiredModal({ isOpen, userId, onPhoneAdded }: PhoneRequiredModalProps) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      // Check if this phone is already used by another customer
      const existingCustomer = await getCustomerByPhone(phone);

      if (existingCustomer) {
        if (existingCustomer.user_id && existingCustomer.user_id !== userId) {
          // Phone belongs to a different registered user
          setError('This mobile number is already registered to another account');
          setIsLoading(false);
          return;
        }

        if (!existingCustomer.user_id) {
          // Walk-in customer with no auth account — link it to this user
          // First, delete the placeholder customer created by trigger (phoneless)
          await supabase
            .from('customers')
            .delete()
            .eq('user_id', userId)
            .is('phone', null);

          // Link the walk-in customer to this auth user
          const { error: linkError } = await supabase
            .from('customers')
            .update({
              user_id: userId,
              customer_source: 'website',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCustomer.id);

          if (linkError) throw linkError;
        }
      } else {
        // No existing customer with this phone — update the current user's customer record
        const { error: custError } = await supabase
          .from('customers')
          .update({ phone, updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        if (custError) throw custError;
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('Mobile number added successfully!');
      onPhoneAdded(phone);
    } catch (err: any) {
      console.error('Error saving phone:', err);
      setError(err.message || 'Failed to save mobile number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop — no click dismiss */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
                <Phone className="w-7 h-7 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Add Your Mobile Number</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your mobile number is required to track orders and earn loyalty points
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center gap-1 px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                    <Phone className="w-4 h-4" />
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter 10-digit number"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || phone.length !== 10}
                className="w-full bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
