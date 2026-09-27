import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Clock, Sparkles } from 'lucide-react';
import { SmartImage } from './SmartImage';

export interface FoodImageModalItem {
  name: string;
  image_url: string;
  price?: number;
  is_veg?: boolean;
  description?: string;
  prep_time?: number;
}

interface FoodImageModalProps {
  item: FoodImageModalItem | null;
  onClose: () => void;
  onAction?: (item: FoodImageModalItem) => void;
  actionLabel?: string;
}

export const FoodImageModal: React.FC<FoodImageModalProps> = ({
  item,
  onClose,
  onAction,
  actionLabel = 'Order This Item'
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (item) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
      setIsZoomed(false);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-3 sm:p-6 bg-slate-950/92 backdrop-blur-xl animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between py-2 px-1 text-white z-10 mb-2">
        <div className="flex items-center gap-2 overflow-hidden pr-3">
          <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
            item.is_veg !== false ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'
          }`} />
          <h2 className="text-base sm:text-lg font-black truncate">{item.name}</h2>
          {item.price !== undefined && (
            <span className="text-sm font-extrabold text-amber-400 shrink-0 ml-1">₹{item.price}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-bold"
            title={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4 text-amber-400" /> : <ZoomIn className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isZoomed ? 'Actual Size' : 'Zoom'}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 border border-slate-700/80 transition-all flex items-center gap-1 text-xs font-bold"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Full-Screen Image Container */}
      <div
        className="w-full max-w-4xl flex-1 max-h-[70vh] sm:max-h-[75vh] flex items-center justify-center relative overflow-hidden rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl p-2 cursor-pointer"
        onClick={() => setIsZoomed(!isZoomed)}
        title="Click to toggle zoom"
      >
        <div className={`w-full h-full flex items-center justify-center transition-transform duration-300 ease-out ${
          isZoomed ? 'scale-125 overflow-auto' : 'scale-100'
        }`}>
          <SmartImage
            src={item.image_url}
            alt={item.name}
            className="max-w-full max-h-full object-contain rounded-2xl drop-shadow-2xl transition-all"
          />
        </div>

        {/* Tap/Click hint badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 backdrop-blur-md pointer-events-none flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{isZoomed ? 'Click to minimize' : 'Click photo to zoom'}</span>
        </div>
      </div>

      {/* Bottom Information Card */}
      <div className="w-full max-w-4xl mt-3 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xl">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-white text-sm">{item.name}</span>
            {item.price !== undefined && (
              <span className="font-black text-emerald-400 text-sm">₹{item.price}</span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
              item.is_veg !== false ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
            }`}>
              {item.is_veg !== false ? 'Pure Veg' : 'Non-Veg'}
            </span>
            {item.prep_time && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> {item.prep_time} mins prep
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 sm:line-clamp-3">
              {item.description}
            </p>
          )}
        </div>

        {onAction && (
          <button
            type="button"
            onClick={() => {
              onAction(item);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all shrink-0 flex items-center justify-center gap-2"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
