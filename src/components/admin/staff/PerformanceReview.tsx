import React from 'react';
import { Star, Plus, Edit, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  staff_id: string;
  review_date: string;
  rating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  goals_achieved: string[];
  areas_of_improvement: string[];
  comments: string;
  next_review_date: string;
  reviewer_id?: string;
  reviewer_name?: string;
}

interface PerformanceReviewProps {
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'staff_id'>) => void;
  onEditReview: (id: string, review: Partial<Review>) => void;
  onDeleteReview: (id: string) => void;
  isLoading: boolean;
}

const ratingColors: Record<string, string> = {
  excellent: 'text-emerald-600 bg-emerald-50',
  good: 'text-blue-600 bg-blue-50',
  satisfactory: 'text-yellow-600 bg-yellow-50',
  needs_improvement: 'text-orange-600 bg-orange-50',
  unsatisfactory: 'text-red-600 bg-red-50',
};

const PerformanceReview: React.FC<PerformanceReviewProps> = ({ reviews, onDeleteReview, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No performance reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Star className="w-5 h-5" /> Performance Reviews
      </h3>
      {reviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className={`px-2 py-1 rounded text-sm font-medium ${ratingColors[review.rating] || 'text-gray-600 bg-gray-50'}`}>
                {review.rating.replace('_', ' ')}
              </span>
              <span className="ml-3 text-sm text-gray-500">
                {new Date(review.review_date).toLocaleDateString()}
              </span>
            </div>
            <button onClick={() => onDeleteReview(review.id)} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {review.comments && <p className="text-gray-700 text-sm mt-2">{review.comments}</p>}
          {review.goals_achieved.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500">Goals Achieved:</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {review.goals_achieved.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
          {review.areas_of_improvement.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500">Areas of Improvement:</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {review.areas_of_improvement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PerformanceReview;
