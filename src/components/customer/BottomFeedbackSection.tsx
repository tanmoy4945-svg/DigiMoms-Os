import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Star, MessageSquare, Send, CheckCircle2, Heart, Sparkles, User, Phone, Utensils, ThumbsUp } from 'lucide-react';
import { t } from '../../utils/i18n';

interface BottomFeedbackSectionProps {
  restaurantId: string;
  tableNumber: string;
  orderId?: string;
  customerMobile?: string;
}

export const BottomFeedbackSection: React.FC<BottomFeedbackSectionProps> = ({
  restaurantId,
  tableNumber,
  orderId,
  customerMobile
}) => {
  const { submitCustomerFeedback, language } = useSaaS();

  const [overallRating, setOverallRating] = useState<number>(5);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [showDetailedRatings, setShowDetailedRatings] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>(customerMobile || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`digimoms_feedback_submitted_${restaurantId}_${tableNumber}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  const ratingDescriptions: Record<number, string> = {
    5: '⭐⭐⭐⭐⭐ Exceptional & Delicious!',
    4: '⭐⭐⭐⭐ Very Good Dining',
    3: '⭐⭐⭐ Average Experience',
    2: '⭐⭐ Needs Improvement',
    1: '⭐ Poor Experience'
  };

  const quickReviewTags = [
    'Delicious Food 🍲',
    'Lightning Fast Service ⚡',
    'Spotless Clean & Hygienic ✨',
    'Polite & Friendly Staff 🤝',
    'Great Value for Money 💰',
    'Must Visit Again! ❤️'
  ];

  const handleTagClick = (tag: string) => {
    if (!comment.includes(tag)) {
      setComment(prev => prev ? `${prev} • ${tag}` : tag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitCustomerFeedback({
        restaurant_id: restaurantId,
        order_id: orderId || undefined,
        table_number: tableNumber,
        food_rating: foodRating,
        service_rating: serviceRating,
        cleanliness_rating: cleanlinessRating,
        overall_rating: overallRating,
        comment: comment.trim() || 'Great food and courteous service!',
        customer_name: guestName.trim() || 'Dining Guest',
        customer_mobile: guestPhone.trim() || undefined
      } as any);

      try {
        localStorage.setItem(`digimoms_feedback_submitted_${restaurantId}_${tableNumber}`, 'true');
      } catch (e) {}

      setHasSubmitted(true);
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="w-full mt-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 border border-emerald-500/40 shadow-xl text-center space-y-3 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-extrabold text-white">
            Thank You For Your Feedback & Rating!
          </h4>
          <p className="text-xs text-emerald-300 font-medium">
            আপনার মূল্যবান মতামত সফলভাবে গ্রহণ করা হয়েছে।
          </p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Your review has been forwarded to the restaurant management and published on their public website to help other guests.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setHasSubmitted(false)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline"
          >
            Update or Submit Another Note
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-8 p-5 sm:p-6 rounded-3xl bg-slate-900/95 border-2 border-amber-500/30 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">
              Rate Your Dining Experience / মতামত দিন
            </h3>
            <p className="text-[11px] text-slate-400">
              Shows on our public website & directly in owner ratings
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold">
          Table #{tableNumber.replace(/^Table\s+/i, '')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating Selector */}
        <div className="text-center space-y-2 py-1">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Overall Rating <span className="text-amber-400">*</span>
          </label>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setOverallRating(star);
                  setFoodRating(star);
                  setServiceRating(star);
                  setCleanlinessRating(star);
                }}
                className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                    star <= overallRating
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'text-slate-700 hover:text-slate-500'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-xs font-bold text-amber-300">
            {ratingDescriptions[overallRating] || 'Tap stars to rate'}
          </div>
        </div>

        {/* Optional Detailed Ratings Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowDetailedRatings(!showDetailedRatings)}
            className="text-[11px] text-slate-400 hover:text-slate-200 font-medium underline"
          >
            {showDetailedRatings ? '▲ Hide detailed criteria' : '▼ Rate Food Quality, Speed & Cleanliness separately'}
          </button>
        </div>

        {showDetailedRatings && (
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            {/* Food Rating */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Food Quality & Taste
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setFoodRating(s)}>
                    <Star className={`w-4 h-4 ${s <= foodRating ? 'text-emerald-400 fill-emerald-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Service Speed */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Service Speed & Staff
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setServiceRating(s)}>
                    <Star className={`w-4 h-4 ${s <= serviceRating ? 'text-blue-400 fill-blue-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Cleanliness */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-purple-400" /> Ambiance & Cleanliness
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setCleanlinessRating(s)}>
                    <Star className={`w-4 h-4 ${s <= cleanlinessRating ? 'text-purple-400 fill-purple-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Review Tags */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
            Quick Feedback Tags (Click to add):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickReviewTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-medium transition-all hover:border-amber-500/40"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Your Comment or Suggestions (মতামত / মন্তব্য)
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked or how we can improve..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none resize-none transition-all placeholder:text-slate-600"
          />
        </div>

        {/* Customer Name & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Your Name (Optional)
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Rahul Sen"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Mobile Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-95"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Submit Feedback & Review (মতামত জমা দিন)
        </button>
      </form>
    </div>
  );
};
