import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  MessageSquare, Search, Star, 
  User, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGuestGuard } from '../../hooks/useGuestGuard';

interface ItemFeedback {
  item_name: string;
  rating: number;
  comment?: string;
}

type Feedback = {
  id: string;
  order_id: string;
  user_id: string | null;
  overall_rating: number;
  food_quality_rating: number;
  service_rating: number;
  delivery_time_rating: number | null;
  value_for_money_rating: number | null;
  comments: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  items_feedback: ItemFeedback[] | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    total_amount: number;
    created_at: string;
  };
};

type FeedbackFilter = {
  rating?: number;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  searchQuery?: string;
};

const FeedbackManagement = () => {
  const { isGuest, guardAction } = useGuestGuard();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackFilter>({});
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'recent' | 'highRated' | 'lowRated'>('all');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_feedback')
        .select(`
          *,
          order:order_id (
            id,
            total_amount,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedbacks(data || []);
      setFilteredFeedbacks(data || []);
    } catch (error: unknown) {
      console.error('Error fetching feedbacks:', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let result = [...feedbacks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(feedback => 
        (feedback.customer_name?.toLowerCase().includes(query) || false) ||
        (feedback.customer_email?.toLowerCase().includes(query) || false) ||
        (feedback.customer_phone?.toLowerCase().includes(query) || false) ||
        (feedback.comments?.toLowerCase().includes(query) || false) ||
        feedback.order_id.slice(-6).toLowerCase().includes(query)
      );
    }

    // Apply rating filter
    if (filter.rating) {
      result = result.filter(feedback => 
        feedback.overall_rating === filter.rating
      );
    }

    // Apply date range filter
    if (filter.dateRange?.from || filter.dateRange?.to) {
      const from = filter.dateRange?.from ? new Date(filter.dateRange.from) : new Date(0);
      const to = filter.dateRange?.to ? new Date(filter.dateRange.to) : new Date();
      
      result = result.filter(feedback => {
        const feedbackDate = new Date(feedback.created_at);
        return feedbackDate >= from && feedbackDate <= to;
      });
    }

    // Apply view mode filter
    switch (viewMode) {
      case 'recent':
        // Already sorted by created_at in fetchFeedbacks
        break;
      case 'highRated':
        result.sort((a, b) => b.overall_rating - a.overall_rating);
        break;
      case 'lowRated':
        result.sort((a, b) => a.overall_rating - b.overall_rating);
        break;
      default:
        // 'all' - no additional sorting
        break;
    }

    setFilteredFeedbacks(result);
  }, [feedbacks, searchQuery, filter, viewMode]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const toggleFeedbackExpansion = (feedbackId: string) => {
    if (expandedFeedback === feedbackId) {
      setExpandedFeedback(null);
    } else {
      setExpandedFeedback(feedbackId);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleViewMode = (mode: 'all' | 'recent' | 'highRated' | 'lowRated') => {
    setViewMode(mode);
  };

  const handleClearFilters = () => {
    setFilter({});
    setSearchQuery('');
    setViewMode('all');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const getMostCommonFeedback = () => {
    // Get the overall average rating
    if (feedbacks.length === 0) return { positive: '', negative: '' };
    
    const positiveComments = feedbacks
      .filter(f => f.overall_rating >= 4)
      .map(f => f.comments)
      .filter(Boolean)
      .join(' ');
      
    const negativeComments = feedbacks
      .filter(f => f.overall_rating <= 2)
      .map(f => f.comments)
      .filter(Boolean)
      .join(' ');

    return {
      positive: positiveComments.length > 50 ? positiveComments.substring(0, 50) + '...' : positiveComments || 'No positive feedback yet',
      negative: negativeComments.length > 50 ? negativeComments.substring(0, 50) + '...' : negativeComments || 'No negative feedback yet',
    };
  };

  const getAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, feedback) => acc + feedback.overall_rating, 0);
    return sum / feedbacks.length;
  };

  const commonFeedback = getMostCommonFeedback();
  const avgRating = getAverageRating();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Customer Feedback
          </h1>
          <p className="text-gray-600 mt-1">Manage and analyze customer feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-3">Average Rating</h2>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
            <div className="flex">{renderStars(Math.round(avgRating))}</div>
          </div>
          <p className="text-gray-500 text-sm mt-2">Based on {feedbacks.length} reviews</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-3">Common Positive Feedback</h2>
          <p className="text-gray-600 italic">"{commonFeedback.positive}"</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-3">Common Negative Feedback</h2>
          <p className="text-gray-600 italic">"{commonFeedback.negative}"</p>
        </motion.div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search feedback by customer or comment..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-auto"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleViewMode('all')}
                className={`px-3 py-1 rounded ${viewMode === 'all' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
              >
                All
              </button>
              <button 
                onClick={() => handleViewMode('recent')}
                className={`px-3 py-1 rounded ${viewMode === 'recent' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
              >
                Recent
              </button>
              <button 
                onClick={() => handleViewMode('highRated')}
                className={`px-3 py-1 rounded ${viewMode === 'highRated' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
              >
                Highest Rated
              </button>
              <button 
                onClick={() => handleViewMode('lowRated')}
                className={`px-3 py-1 rounded ${viewMode === 'lowRated' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
              >
                Lowest Rated
              </button>
              {(filter.rating || filter.dateRange || searchQuery) && (
                <button 
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <XCircle className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"
                        />
                      </div>
                    </td>
                  </tr>
                ) : filteredFeedbacks.length > 0 ? (
                  filteredFeedbacks.map(feedback => (
                    <React.Fragment key={feedback.id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleFeedbackExpansion(feedback.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {feedback.customer_name || 'Anonymous'}
                              </div>
                              {feedback.customer_email && (
                                <div className="text-xs text-gray-500">
                                  {feedback.customer_email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">#{feedback.order_id.slice(-6)}</div>
                          {feedback.order?.total_amount && (
                            <div className="text-xs text-gray-500">
                              ₹{feedback.order.total_amount.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(feedback.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-0.5">{renderStars(feedback.overall_rating)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Food: {feedback.food_quality_rating}/5 • Service: {feedback.service_rating}/5
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-sm text-gray-900 truncate">
                            {feedback.comments || 'No comments provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-end">
                            {expandedFeedback === feedback.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                      <AnimatePresence>
                        {expandedFeedback === feedback.id && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-medium">Customer Details</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                    <div>
                                      <span className="text-gray-500 text-sm">Name:</span>
                                      <div>{feedback.customer_name || 'Not provided'}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-sm">Email:</span>
                                      <div>{feedback.customer_email || 'Not provided'}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-sm">Phone:</span>
                                      <div>{feedback.customer_phone || 'Not provided'}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="font-medium">Ratings Breakdown</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                                    <div>
                                      <span className="text-gray-500 text-sm">Overall:</span>
                                      <div className="flex">{renderStars(feedback.overall_rating)}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-sm">Food Quality:</span>
                                      <div className="flex">{renderStars(feedback.food_quality_rating)}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-sm">Service:</span>
                                      <div className="flex">{renderStars(feedback.service_rating)}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-sm">Value for Money:</span>
                                      <div className="flex">{renderStars(feedback.value_for_money_rating || 0)}</div>
                                    </div>
                                  </div>
                                </div>

                                {feedback.comments && (
                                  <div>
                                    <h3 className="font-medium">Comments</h3>
                                    <div className="mt-2 p-3 bg-white border rounded-md">
                                      {feedback.comments}
                                    </div>
                                  </div>
                                )}

                                {feedback.items_feedback && feedback.items_feedback.length > 0 && (
                                  <div>
                                    <h3 className="font-medium">Item Feedback</h3>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {feedback.items_feedback.map((item, i) => (
                                        <div key={i} className="p-3 bg-white border rounded-md">
                                          <div className="font-medium">{item.item_name}</div>
                                          <div className="flex mt-1">{renderStars(item.rating)}</div>
                                          {item.comment && <div className="mt-2 text-sm">{item.comment}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No feedback data found
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default FeedbackManagement;
