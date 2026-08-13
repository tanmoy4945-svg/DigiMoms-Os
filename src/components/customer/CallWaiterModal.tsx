import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { RequestType } from '../../types';
import { Bell, GlassWater, UtensilsCrossed, FileText, Sparkles, HelpCircle, X } from 'lucide-react';
import { t } from '../../utils/i18n';

interface CallWaiterModalProps {
  restaurantId: string;
  sessionId: string;
  tableNumber: string;
  onClose: () => void;
}

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({
  restaurantId,
  sessionId,
  tableNumber,
  onClose
}) => {
  const { sendCallWaiterRequest, language, restaurants } = useSaaS();
  const rest = restaurants.find(r => r.id === restaurantId);
  const contactNum = rest?.contact_mobile || rest?.owner_mobile || '8900415647';

  const options: { type: RequestType; labelKey: keyof typeof import('../../utils/i18n').translations['en']; icon: React.ReactNode }[] = [
    { type: 'call', labelKey: 'call_waiter', icon: <Bell className="w-5 h-5 text-amber-400" /> },
    { type: 'payment', labelKey: 'call_waiter', icon: <Bell className="w-5 h-5 text-emerald-400" /> },
    { type: 'water', labelKey: 'need_water', icon: <GlassWater className="w-5 h-5 text-blue-400" /> },
    { type: 'spoon', labelKey: 'need_spoon', icon: <UtensilsCrossed className="w-5 h-5 text-purple-400" /> },
    { type: 'tissue', labelKey: 'need_tissue', icon: <Sparkles className="w-5 h-5 text-emerald-400" /> },
    { type: 'cleaning', labelKey: 'need_cleaning', icon: <Sparkles className="w-5 h-5 text-sky-400" /> },
    { type: 'bill', labelKey: 'need_bill', icon: <FileText className="w-5 h-5 text-indigo-400" /> }
  ];

  const handleSelect = (type: RequestType) => {
    sendCallWaiterRequest(restaurantId, sessionId, tableNumber, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">{t('call_waiter', language)}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt.type)}
              className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left space-y-2 transition-all group"
            >
              <div className="p-2 rounded-xl bg-slate-900 w-fit group-hover:scale-110 transition-all">
                {opt.icon}
              </div>
              <div className="text-xs font-bold text-white leading-tight">
                {t(opt.labelKey, language)}
              </div>
            </button>
          ))}
        </div>

        {/* Direct Phone Call Fallback */}
        <div className="pt-2 border-t border-slate-800">
          <a
            href={`tel:${contactNum}`}
            className="w-full py-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 flex items-center justify-center gap-2 transition-all"
          >
            📞 Direct Call Staff / Restaurant (+91 {contactNum})
          </a>
        </div>
      </div>
    </div>
  );
};
