import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Star, MessageSquare, Utensils, HeartHandshake } from 'lucide-react';

export const FeedbackViewer: React.FC = () => {
  const { currentOwner, feedbackList } = useSaaS();

  if (!currentOwner) return null;

  const restFeedback = feedbackList.filter(f => f.restaurant_id === currentOwner.id);

  const avgFood = restFeedback.length > 0 ? (restFeedback.reduce((acc, f) => acc + f.food_rating, 0) / restFeedback.length).toFixed(1) : '5.0';
  const avgService = restFeedback.length > 0 ? (restFeedback.reduce((acc, f) => acc + f.service_rating, 0) / restFeedback.length).toFixed(1) : '5.0';
  const avgOverall = restFeedback.length > 0 ? (restFeedback.reduce((acc, f) => acc + f.overall_rating, 0) / restFeedback.length).toFixed(1) : '5.0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Customer Feedback & Reviews</h2>
        <p className="text-xs text-slate-400">Guest ratings for food quality, service speed & cleanliness</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Overall Rating</div>
          <div className="text-3xl font-extrabold text-amber-400 flex items-center gap-2">
            <Star className="w-6 h-6 fill-amber-400" /> {avgOverall} / 5.0
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Food Quality Score</div>
          <div className="text-3xl font-extrabold text-emerald-400 flex items-center gap-2">
            <Utensils className="w-6 h-6" /> {avgFood} / 5.0
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Service Speed Score</div>
          <div className="text-3xl font-extrabold text-blue-400 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6" /> {avgService} / 5.0
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restFeedback.map(fb => (
          <div key={fb.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-base">{fb.table_number}</span>
              <span className="text-amber-400 font-bold text-sm flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" /> {fb.overall_rating} / 5
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div>Food: <strong className="text-white">{fb.food_rating}★</strong></div>
              <div>Service: <strong className="text-white">{fb.service_rating}★</strong></div>
              <div>Cleanliness: <strong className="text-white">{fb.cleanliness_rating}★</strong></div>
            </div>

            <p className="text-xs text-slate-200 italic leading-relaxed">
              "{fb.comment || 'No additional comment provided.'}"
            </p>

            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
              Submitted on {new Date(fb.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
