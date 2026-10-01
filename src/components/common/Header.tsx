import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { UtensilsCrossed, ShieldCheck, UserCheck, ChefHat, QrCode, Globe } from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/i18n';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    language,
    setLanguage,
    ceoAuthenticated,
    currentOwner,
    currentStaff,
    activeSlug,
    activeShortCode
  } = useSaaS();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('public-home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                DigiMoms
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Restaurant OS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Enterprise Multi-Tenant SaaS Operating System</p>
          </div>
        </div>

        {/* Global Quick Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveView('landing');
              window.history.pushState({}, '', '/');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeView === 'landing' || activeView === 'public-home' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('public_site', language)}
          </button>

          <button
            onClick={() => {
              setActiveView('public-about');
              window.history.pushState({}, '', '/about');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeView === 'public-about' || (activeView as any) === 'about' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'bn' ? 'আমাদের সম্পর্কে' : language === 'hi' ? 'हमारे बारे में' : 'About Us'}
          </button>

          <button
            onClick={() => {
              setActiveView(ceoAuthenticated ? 'ceo-dashboard' : 'ceo-login');
              window.history.pushState({}, '', '/login-ceo');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeView.startsWith('ceo') ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            {t('ceo_control', language)}
          </button>

          <button
            onClick={() => {
              setActiveView(currentOwner ? 'owner-dashboard' : 'owner-login');
              window.history.pushState({}, '', '/login-owner');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeView.startsWith('owner') ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
            {t('owner_portal', language)}
          </button>

          <button
            onClick={() => {
              if (currentStaff) {
                setActiveView(currentStaff.role === 'kitchen' ? 'kitchen-terminal' : 'waiter-terminal');
              } else {
                setActiveView('staff-login');
              }
              window.history.pushState({}, '', '/login-staff');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeView.includes('terminal') || activeView === 'staff-login' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-300" />
            {t('staff_terminal', language)}
          </button>

          <button
            onClick={() => {
              setActiveView('customer-qr');
              window.history.pushState({}, '', `/q/${activeShortCode}`);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeView === 'customer-qr' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-300" />
            {t('qr_order_app', language)}
          </button>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {(['en', 'bn', 'hi'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg uppercase font-semibold transition-all ${
                  language === lang ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'bn' ? 'বাংলা' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
