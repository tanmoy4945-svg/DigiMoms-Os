import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Star, Heart, X, Send } from 'lucide-react';
import { t } from '../../utils/i18n';

interface FeedbackModalProps {
  restaurantId: string;
  orderId: string;
  tableNumber: string;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  restaurantId,
  orderId,
  tableNumber,
  onClose
}) => {
  const { submitCustomerFeedback, language } = useSaaS();

  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCustomerFeedback({
      restaurant_id: restaurantId,
      order_id: orderId,
      table_number: tableNumber,
      food_rating: foodRating,
      service_rating: serviceRating,
      cleanliness_rating: cleanlinessRating,
      overall_rating: overallRating,
      comment
    });
    onClose();
  };

  const StarSelector = ({ labelKey, value, onChange }: { labelKey: keyof typeof import('../../utils/i18n').translations['en']; value: number; onChange: (val: number) => void }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-semibold text-slate-300">{t(labelKey, language)}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-125 transition-all focus:outline-none"
          >
            <Star className={`w-5 h-5 ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-bold text-white">{t('feedback', language)}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <StarSelector labelKey="food_rating" value={foodRating} onChange={setFoodRating} />
            <StarSelector labelKey="service_rating" value={serviceRating} onChange={setServiceRating} />
            <StarSelector labelKey="cleanliness" value={cleanlinessRating} onChange={setCleanlinessRating} />
            <StarSelector labelKey="overall_rating" value={overallRating} onChange={setOverallRating} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Your Comments / Suggestions</label>
            <textarea
              rows={3}
              placeholder="Tell us what you loved..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            {t('submit_feedback', language)} <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
