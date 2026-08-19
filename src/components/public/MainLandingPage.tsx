import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { landingTranslations } from '../../utils/landingTranslations';
import { Language } from '../../types';
import {
  QrCode, ChefHat, ShieldCheck, Zap, Smartphone, BarChart3,
  Globe, CheckCircle2, ArrowRight, Utensils, PhoneCall,
  Laptop, Code, Sparkles, Lock, Bot, GraduationCap,
  Compass, HeartHandshake, Layers, HelpCircle, Check, FileText, MapPin
} from 'lucide-react';

export const MainLandingPage: React.FC = () => {
  const { setActiveView, language, setLanguage } = useSaaS();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const t = landingTranslations[language || 'en'] || landingTranslations.en;

  return (
    <div className="space-y-16 pb-20 bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">

      {/* HERO BANNER & LANGUAGE PICKER BAR */}
      <section className="relative pt-10 pb-16 px-4 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-900">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">

          {/* 3-Language Translator Bar */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 px-3 py-1 text-slate-300 text-xs font-semibold">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{t.langBannerTitle}:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(['en', 'bn', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    language === lang
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'bn' ? 'বাংলা' : 'हिन्दी'}
                </button>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-blue-400 shrink-0" />
            {t.heroTag}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            {t.heroTitleLine1} <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              {t.heroTitleLine2}
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setActiveView('public-pricing')}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              {t.ctaGetOs} <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('customer-qr')}
              className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-base border border-slate-700/80 flex items-center gap-2 transition-all"
            >
              <QrCode className="w-5 h-5 text-indigo-400" /> {t.ctaTestQr}
            </button>
          </div>

          {/* Stats / Value Highlights */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-white">{t.statPrice}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t.statPriceSub}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">{t.statTrial}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t.statTrialSub}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-purple-400">{t.statAgency}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t.statAgencySub}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-amber-400">{t.statPrivate}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t.statPrivateSub}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FLAGSHIP OS OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Utensils className="w-3.5 h-3.5" /> {t.osTag}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.osTitle}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            {t.osSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-blue-500/40 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">1</div>
            <h3 className="text-lg font-bold text-white">{t.osStep1Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{t.osStep1Desc}</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black">2</div>
            <h3 className="text-lg font-bold text-white">{t.osStep2Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{t.osStep2Desc}</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-black">3</div>
            <h3 className="text-lg font-bold text-white">{t.osStep3Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{t.osStep3Desc}</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black">4</div>
            <h3 className="text-lg font-bold text-white">{t.osStep4Title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{t.osStep4Desc}</p>
          </div>
        </div>
      </section>

      {/* SECTION 1: WHY CHOOSE DIGIMOMS SMART RESTAURANT OS? */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="text-center space-y-3 relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> {t.whyChooseTag}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">{t.whyChooseTitle}</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t.whyChooseSub}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {t.whyChoosePoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 hover:border-blue-500/40 transition-all"
              >
                <div className="flex items-center gap-2 text-blue-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">{pt.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">{pt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT YOU GET WITH DIGIMOMS OS (12 CARDS) */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" /> {t.whatYouGetTag}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.whatYouGetTitle}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            {t.whatYouGetSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.whatYouGetCards.map((card, idx) => {
            const icons = [Laptop, QrCode, Utensils, ChefHat, PhoneCall, Zap, Smartphone, FileText, BarChart3, ShieldCheck, Bot, GraduationCap];
            const IconComp = icons[idx % icons.length];
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-indigo-500/50 hover:bg-slate-900 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <IconComp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{card.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: MORE THAN SOFTWARE */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 space-y-8 shadow-2xl">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5" /> {t.moreThanSoftwareTag}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.moreThanSoftwareTitle}</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t.moreThanSoftwareSub}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.moreThanSoftwarePillars.map((pil, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                  0{idx + 1}
                </div>
                <h3 className="text-base font-bold text-white">{pil.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{pil.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/20 text-amber-200/90 text-xs leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>{t.moreThanSoftwareDisclaimer}</p>
          </div>
        </div>
      </section>

      {/* SECTION 4: YOUR AI HELP ASSISTANT */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-blue-500/30 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="text-center space-y-3 relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Bot className="w-4 h-4 text-blue-400" /> {t.aiAssistantTag}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.aiAssistantTitle}</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t.aiAssistantSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {/* Capabilities List */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" /> {t.aiCapabilitiesTitle}
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {t.aiCapabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Language & India Context Card */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" /> {t.aiLanguagesTitle}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t.aiLanguagesDesc}
                </p>
                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-bold text-sm text-white">English</div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-bold text-sm text-white">বাংলা</div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-bold text-sm text-white">हिन्दी</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200/90 leading-relaxed flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>{t.aiContextNotice}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: LEARN WHILE YOU WORK */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" /> {t.learnTag}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.learnTitle}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            {t.learnSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.learnPoints.map((lp, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{lp.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{lp.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 max-w-3xl mx-auto">
          {t.learnDisclaimer}
        </div>
      </section>

      {/* SECTION 6: OUR JOURNEY & OUR VISION */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Our Journey */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" /> {t.journeyTag}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{t.journeyTitle}</h2>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-amber-300 font-bold">
                <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">{t.journeyFounder}</span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">{t.journeyEstablished}</span>
                <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" /> Andulia, Sabang, Paschim Medinipur, WB
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pt-2">
                {t.journeyStory}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setActiveView('public-about');
                  window.history.pushState({}, '', '/about');
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-all"
              >
                Read Full About Us & Company Profile <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Our Vision */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" /> {t.visionTag}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{t.visionTitle}</h2>
              <blockquote className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-blue-200 font-medium text-sm italic">
                {t.visionStatement}
              </blockquote>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {t.visionPillars.map((vp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="font-bold text-white">{vp.title}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{vp.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 7: RESTAURANT DATA PRIVACY & TENANT ISOLATION */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
                <Lock className="w-3.5 h-3.5" /> {t.privacyTag}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{t.privacyTitle}</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {t.privacySub}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {t.privacyPoints.map((pt, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: DIGIMOMS MARKETING AGENCY SERVICES */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Laptop className="w-3.5 h-3.5" /> {t.agencyTag}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.agencyTitle}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            {t.agencySub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">{t.agencyService1Title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t.agencyService1Desc}</p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">{t.agencyService2Title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t.agencyService2Desc}</p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">{t.agencyService3Title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t.agencyService3Desc}</p>
          </div>
        </div>
      </section>

      {/* SECTION 9: PRICING & SUBSCRIPTION SUMMARY */}
      <section className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
            {t.pricingTag}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">{t.pricingTitle}</h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            {t.pricingSub}
          </p>
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto space-y-3">
            <div className="text-sm font-bold text-blue-400">{t.pricingPlanMonthly}</div>
            <div className="text-4xl font-black text-white">{t.pricingPlanPrice}</div>
            <p className="text-xs text-slate-400 leading-relaxed">{t.pricingPlanDesc}</p>
            <button
              onClick={() => setActiveView('public-pricing')}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all mt-2"
            >
              {t.contactCta}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 10: FAQ ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> {t.faqTag}
          </div>
          <h2 className="text-3xl font-black text-white">{t.faqTitle}</h2>
        </div>

        <div className="space-y-4">
          {t.faqItems.map((item, idx) => (
            <div key={idx} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-white hover:text-blue-400 transition-all"
              >
                <span>{item.q}</span>
                <span className="text-lg font-mono text-slate-500">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/50">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 11: LEGAL & PLATFORM DISCLAIMER */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-center text-xs text-slate-400">
          <div className="font-bold text-slate-300">{t.legalDisclaimerTitle}</div>
          <p className="leading-relaxed">{t.legalDisclaimerText}</p>
        </div>
      </section>

      {/* SECTION 12: CONTACT & AGENCY SUPPORT */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 border border-blue-500/30 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {t.contactTitle}
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            {t.contactSub}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setActiveView('public-pricing')}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl transition-all"
            >
              {t.contactCta}
            </button>
            <a
              href="https://wa.me/919475388085"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-base transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-5 h-5" /> {t.whatsappCta}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
