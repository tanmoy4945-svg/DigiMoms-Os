import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import {
  UtensilsCrossed, UserCheck, ChefHat, QrCode, Globe, ShieldCheck,
  Smartphone, ArrowRight, Sparkles, LogIn
} from 'lucide-react';
import { Language } from '../../types';

interface MobileAppPortalProps {
  onOpenPublicWebsite?: () => void;
}

export const MobileAppPortal: React.FC<MobileAppPortalProps> = ({ onOpenPublicWebsite }) => {
  const {
    setActiveView,
    currentOwner,
    currentStaff,
    language,
    setLanguage,
    activeShortCode
  } = useSaaS();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 safe-area-pt safe-area-pb animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-base bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              DigiMoms
            </span>
            <span className="ml-1.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Mobile App
            </span>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          {(['en', 'bn', 'hi'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                language === lang ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'en' ? 'EN' : lang === 'bn' ? 'বাংলা' : 'हिन्दी'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Welcome Hero */}
      <div className="py-6 space-y-6 max-w-md mx-auto w-full">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Restaurant OS App</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Select Your Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Choose your login type to manage orders, kitchen terminal, or scan customer dining table QR codes.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="space-y-3">
          {/* 1. Restaurant Owner Card */}
          <button
            onClick={() => {
              setActiveView(currentOwner ? 'owner-dashboard' : 'owner-login');
              window.history.pushState({}, '', '/login-owner');
            }}
            className="w-full p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-emerald-950/40 border-2 border-emerald-500/30 hover:border-emerald-500/60 transition-all flex items-center justify-between text-left group shadow-xl cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                  Restaurant Owner Portal
                  {currentOwner && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                      Logged in
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live orders, billing, menu setup, GST & analytics
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* 2. Waiter & Kitchen Staff Card */}
          <button
            onClick={() => {
              if (currentStaff) {
                setActiveView(currentStaff.role === 'kitchen' ? 'kitchen-terminal' : 'waiter-terminal');
              } else {
                setActiveView('staff-login');
              }
              window.history.pushState({}, '', '/login-staff');
            }}
            className="w-full p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-amber-950/40 border-2 border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center justify-between text-left group shadow-xl cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                  Staff & Kitchen Terminal
                  {currentStaff && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                      {currentStaff.name} ({currentStaff.role})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Waiter floor operations & Kitchen KDS live display
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* 3. Customer QR Dine-In Ordering */}
          <button
            onClick={() => {
              setActiveView('customer-qr');
              window.history.pushState({}, '', `/q/${activeShortCode || 'DEMO'}`);
            }}
            className="w-full p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border-2 border-indigo-500/30 hover:border-indigo-500/60 transition-all flex items-center justify-between text-left group shadow-xl cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base">
                  Customer Table QR Ordering
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scan dining table QR to order food & call waiter
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      {/* Footer Switch to Desktop/Marketing Website */}
      <div className="text-center pt-4 pb-2 space-y-2 max-w-md mx-auto w-full">
        {onOpenPublicWebsite && (
          <button
            onClick={onOpenPublicWebsite}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Open Desktop / Marketing Website</span>
          </button>
        )}
        <p className="text-[10px] text-slate-500">
          DigiMoms Restaurant OS v2.0 • Enterprise Cloud Architecture
        </p>
      </div>
    </div>
  );
};
