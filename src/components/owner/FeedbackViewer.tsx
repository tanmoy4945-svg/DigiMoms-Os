import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Star, Utensils, HeartHandshake, Sparkles, User, Phone, CheckCircle2, MessageSquare, Globe } from 'lucide-react';

export const FeedbackViewer: React.FC = () => {
  const { currentOwner, feedbackList } = useSaaS();
  const [filterRating, setFilterRating] = useState<'all' | '5' | '4' | '3_below'>('all');

  if (!currentOwner) return null;

  const restFeedback = feedbackList.filter(f => f.restaurant_id === currentOwner.id);

  const avgFood = restFeedback.length > 0 ? (restFeedback.reduce((acc, f) => acc + f.food_rating, 0) / restFeedback.length).toFixed(1) : '5.0';
  const avgService = restFeedback.length > 0 ? (restFeedback.reduce((acc, f) => acc + f.service_rating, 0) / restFeedback.length).toFixed(1) : '5.0';
  const avgCleanliness = restFeedback.length > 0 ? (restFeedback.reduce((acc, f) => acc + f.cleanliness_rating, 0) / restFeedback.length).toFixed(1) : '5.0';
  const avgOverall = restFeedback.length > 0 ? (restFeedback.reduce((acc, f) => acc + f.overall_rating, 0) / restFeedback.length).toFixed(1) : '5.0';

  const filteredList = restFeedback.filter(fb => {
    if (filterRating === '5') return fb.overall_rating === 5;
    if (filterRating === '4') return fb.overall_rating === 4;
    if (filterRating === '3_below') return fb.overall_rating <= 3;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Customer Feedback & Web Ratings
          </h2>
          <p className="text-xs text-slate-400">
            Real guest reviews and dining feedback published on your official public website
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>Synced with Public Website (/r/{currentOwner.slug})</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 bg-amber-950/10 space-y-1 shadow-sm">
          <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
            <span>Overall Score</span>
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300">{avgOverall} / 5.0</div>
          <div className="text-[11px] text-slate-400 font-medium">Based on {restFeedback.length} guest reviews</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Food Quality</span>
            <Utensils className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{avgFood} / 5.0</div>
          <div className="text-[11px] text-slate-500">Kitchen & Taste Score</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Service Speed</span>
            <HeartHandshake className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-400">{avgService} / 5.0</div>
          <div className="text-[11px] text-slate-500">Staff attentiveness</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Cleanliness</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400">{avgCleanliness} / 5.0</div>
          <div className="text-[11px] text-slate-500">Hygiene & Ambiance</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterRating('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterRating === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Reviews ({restFeedback.length})
        </button>
        <button
          onClick={() => setFilterRating('5')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            filterRating === '5'
              ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 5 Stars ({restFeedback.filter(f => f.overall_rating === 5).length})
        </button>
        <button
          onClick={() => setFilterRating('4')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            filterRating === '4'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-emerald-300'
          }`}
        >
          <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" /> 4 Stars ({restFeedback.filter(f => f.overall_rating === 4).length})
        </button>
        <button
          onClick={() => setFilterRating('3_below')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            filterRating === '3_below'
              ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-rose-300'
          }`}
        >
          Needs Improvement ({restFeedback.filter(f => f.overall_rating <= 3).length})
        </button>
      </div>

      {/* Reviews List */}
      {filteredList.length === 0 ? (
        <div className="text-center py-12 space-y-3 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-300">No Feedback Received Yet in this Category</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When guests place food orders via the Table QR code, they are prompted at the bottom of all pages to rate the food quality, speed, and dining experience.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map(fb => (
            <div key={fb.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>{fb.customer_name || fb.guest_name || 'Dining Guest'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {fb.table_number || 'QR Order'}
                      </span>
                    </div>
                    {fb.customer_mobile && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{fb.customer_mobile}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-amber-400 font-black text-sm flex items-center gap-1 justify-end">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= fb.overall_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                    {fb.overall_rating === 5 ? 'Excellent!' : fb.overall_rating === 4 ? 'Very Good' : 'Average'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                <div>Food: <strong className="text-emerald-300">{fb.food_rating}★</strong></div>
                <div>Service: <strong className="text-blue-300">{fb.service_rating}★</strong></div>
                <div>Hygiene: <strong className="text-purple-300">{fb.cleanliness_rating}★</strong></div>
              </div>

              <p className="text-xs text-slate-200 italic leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                "{fb.comment || 'Great dining experience! Delicious food.'}"
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1 text-emerald-400/80">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Published on Public Web
                </span>
                <span>
                  {new Date(fb.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
