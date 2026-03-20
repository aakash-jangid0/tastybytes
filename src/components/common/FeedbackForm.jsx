import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog.jsx';
import { Button } from './ui/button.jsx';
import { StarRating } from './ui/star-rating.jsx';
import { Textarea } from './ui/textarea.jsx';
import { Label } from './ui/label.jsx';
import { Separator } from './ui/separator.jsx';

export const FeedbackForm = ({ 
  order, 
  isOpen, 
  onOpenChange,
  onFeedbackSubmitted 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    overallRating: 5,
    foodQualityRating: 5,
    serviceRating: 5,
    deliveryTimeRating: 5,
    valueForMoneyRating: 5,
    comments: '',
    customerName: order?.customer_name || '',
    customerEmail: '',
    customerPhone: '',
    itemsFeedback: order?.items?.map(item => ({
      item_id: item.id,
      item_name: item.name,
      rating: 5,
      comment: ''
    })) || []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('order_feedback')
        .insert([{
          order_id: order?.id,
          user_id: order?.user_id,
          overall_rating: formData.overallRating,
          food_quality_rating: formData.foodQualityRating,
          service_rating: formData.serviceRating,
          delivery_time_rating: formData.deliveryTimeRating,
          value_for_money_rating: formData.valueForMoneyRating,
          comments: formData.comments,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          items_feedback: formData.itemsFeedback
        }]);
      
      if (error) throw error;
      
      toast.success('Thank you for your feedback!');
      onOpenChange(false);
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (error) {
      console.error('Error submitting feedback:', error.message);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemRatingChange = (index, value) => {
    const updatedItems = [...formData.itemsFeedback];
    updatedItems[index] = { ...updatedItems[index], rating: value };
    setFormData(prev => ({
      ...prev,
      itemsFeedback: updatedItems
    }));
  };

  const handleItemCommentChange = (index, value) => {
    const updatedItems = [...formData.itemsFeedback];
    updatedItems[index] = { ...updatedItems[index], comment: value };
    setFormData(prev => ({
      ...prev,
      itemsFeedback: updatedItems
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Feedback</DialogTitle>
          <DialogDescription>
            We'd love to hear about your experience with order #{order?.id?.substring(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Overall ratings section */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Overall Experience</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="overallRating">Overall Experience</Label>
                <StarRating 
                  id="overallRating"
                  value={formData.overallRating} 
                  onChange={(val) => handleRatingChange('overallRating', val)} 
                />
              </div>
              
              <div>
                <Label htmlFor="foodQualityRating">Food Quality</Label>
                <StarRating 
                  id="foodQualityRating"
                  value={formData.foodQualityRating} 
                  onChange={(val) => handleRatingChange('foodQualityRating', val)} 
                />
              </div>
              
              <div>
                <Label htmlFor="serviceRating">Service</Label>
                <StarRating 
                  id="serviceRating"
                  value={formData.serviceRating} 
                  onChange={(val) => handleRatingChange('serviceRating', val)} 
                />
              </div>
              
              <div>
                <Label htmlFor="deliveryTimeRating">Delivery Time</Label>
                <StarRating 
                  id="deliveryTimeRating"
                  value={formData.deliveryTimeRating} 
                  onChange={(val) => handleRatingChange('deliveryTimeRating', val)} 
                />
              </div>
              
              <div>
                <Label htmlFor="valueForMoneyRating">Value for Money</Label>
                <StarRating 
                  id="valueForMoneyRating"
                  value={formData.valueForMoneyRating} 
                  onChange={(val) => handleRatingChange('valueForMoneyRating', val)} 
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                placeholder="Tell us more about your experience..."
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <Separator />

          {/* Individual items feedback section */}
          {formData.itemsFeedback?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Item Feedback</h3>
              
              {formData.itemsFeedback.map((item, index) => (
                <div key={index} className="border p-4 rounded-md">
                  <h4 className="font-medium">{item.item_name}</h4>
                  
                  <div className="mt-2">
                    <Label htmlFor={`item-rating-${index}`}>Rating</Label>
                    <StarRating
                      id={`item-rating-${index}`}
                      value={item.rating}
                      onChange={(val) => handleItemRatingChange(index, val)}
                    />
                  </div>
                  
                  <div className="mt-2">
                    <Label htmlFor={`item-comment-${index}`}>Comments</Label>
                    <Textarea
                      id={`item-comment-${index}`}
                      placeholder={`Any comments about the ${item.item_name}?`}
                      value={item.comment}
                      onChange={(e) => handleItemCommentChange(index, e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackForm;
