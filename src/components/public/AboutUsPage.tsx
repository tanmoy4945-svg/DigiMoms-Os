import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { landingTranslations } from '../../utils/landingTranslations';
import {
  UserCheck, MapPin, Phone, Mail, Award, Shield,
  Zap, Clock, CheckCircle2, ArrowRight, HeartHandshake, Compass
} from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  const { setActiveView, language } = useSaaS();
  const t = landingTranslations[language || 'en'] || landingTranslations.en;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12 space-y-12">
      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" /> About Us & Company Profile
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          About DigiMoms & Leadership
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
          Founded by Tanmoy Jana, DigiMoms Marketing Agency is helping local businesses and restaurants in India with modern IT solutions and operating systems.
        </p>
      </div>

      {/* CEO & Founder Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
          {/* Avatar / Profile Badge */}
          <div className="flex flex-col items-center text-center space-y-4 md:border-r border-slate-800/80 md:pr-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-xl shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <UserCheck className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Tanmoy Jana</h2>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-0.5">Legal Operator & Founder</p>
              <p className="text-[11px] text-slate-400 mt-1">DigiMoms Marketing Agency</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Legal Operator
            </div>
          </div>

          {/* Details & Location */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-400" /> Leadership & Vision
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Founded by <strong>Tanmoy Jana</strong>, <strong>DigiMoms Marketing Agency</strong> is helping local businesses and restaurants in India with modern IT solutions and operating systems. Under his leadership, the agency engineered the <strong>DigiMoms Smart Restaurant OS</strong> — a complete multi-tenant operating system designed for speed, kitchen automation, and paperless QR ordering at an affordable rate of ₹999/month (INR) with a 15-day free trial.
              </p>
            </div>

            {/* Official Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" /> Registered Office Address
                </div>
                <div className="text-xs font-semibold text-white leading-snug">
                  Andulia, Lachhmi Chak, Sabang, Paschim Medinipur
                </div>
                <div className="text-xs text-slate-400">
                  West Bengal, 721144, India
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" /> WhatsApp Support & Direct
                </div>
                <div className="text-sm font-semibold text-white">
                  +91 9475388085
                </div>
                <div className="text-xs text-emerald-400 font-medium">
                  WhatsApp Support: 24 Hours Active
                </div>
                <div className="text-[11px] text-slate-400">
                  Office Time: Mon - Sat (10 AM - 9 PM IST)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-purple-400 shrink-0" /> Official Email
                </div>
                <div className="text-sm font-semibold text-white">
                  tanmoy4945@gmail.com
                </div>
                <div className="text-xs text-slate-400">
                  support@digimoms.com
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" /> Legal Structure
                </div>
                <div className="text-sm font-semibold text-white">
                  Trade Name: DigiMoms Marketing Agency
                </div>
                <div className="text-xs text-slate-400">
                  Legal Operator: Tanmoy Jana
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">0% Commission Model</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            We never take per-order commission from restaurants. Owners pay an honest, fixed monthly subscription (starting at ₹999/month) and keep 100% of their earnings.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Data Privacy & Security</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Every restaurant operates in an isolated tenant environment. Sales figures, menu recipes, and customer dining details are strictly private and never publicly exposed.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Authentic Support</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Direct personal onboarding and technical help directly from our team in Sabang, Paschim Medinipur, West Bengal. No automated call loops or fake bots.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 text-center space-y-4 shadow-xl">
        <h3 className="text-2xl font-bold text-white">Ready to connect with us?</h3>
        <p className="text-slate-300 text-sm max-w-md mx-auto">
          Start your 15-day trial today or reach out directly to Tanmoy Jana & the DigiMoms team.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setActiveView('public-pricing')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2"
          >
            View Pricing Plans <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveView('public-contact')}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
          >
            Contact Office
          </button>
        </div>
      </div>
    </div>
  );
};
