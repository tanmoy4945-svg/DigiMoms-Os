import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { UtensilsCrossed, MessageSquare, Phone, Shield, FileText, HelpCircle, Lock } from 'lucide-react';
import { LegalModal } from '../public/LegalModal';

export const Footer: React.FC = () => {
  const { setActiveView } = useSaaS();
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'refund' | 'shipping' | 'cookie' | null>(null);

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 px-4 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">DigiMoms OS</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Next-Generation Enterprise Multi-Tenant Smart Restaurant Operating System. Empowering 10,000+ dining establishments with QR ordering, kitchen automation & real-time analytics.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://wa.me/919475388085"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/80 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              WhatsApp Support: +91 9475388085
            </a>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => { setActiveView('landing'); window.history.pushState({}, '', '/'); }} className="hover:text-blue-400 transition-all">
                Home
              </button>
            </li>
            <li>
              <button onClick={() => { setActiveView('pricing'); window.history.pushState({}, '', '/pricing'); }} className="hover:text-blue-400 transition-all">
                SaaS Pricing & Plans
              </button>
            </li>
            <li>
              <button onClick={() => { setActiveView('contact'); window.history.pushState({}, '', '/contact'); }} className="hover:text-blue-400 transition-all">
                Contact & Demo Request
              </button>
            </li>
            <li>
              <button onClick={() => { setActiveView('ceo-login'); window.history.pushState({}, '', '/login-ceo'); }} className="hover:text-purple-400 transition-all flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> CEO Super Admin Portal
              </button>
            </li>
            <li>
              <button onClick={() => { setActiveView('owner-login'); window.history.pushState({}, '', '/login-owner'); }} className="hover:text-emerald-400 transition-all">
                Restaurant Owner Login
              </button>
            </li>
            <li>
              <button onClick={() => { setActiveView('staff-login'); window.history.pushState({}, '', '/login-staff'); }} className="hover:text-amber-400 transition-all">
                Kitchen & Waiter Login
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Legal & Compliance */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Legal & Compliance</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => setLegalType('privacy')} className="hover:text-slate-200 transition-all flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" /> Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => setLegalType('terms')} className="hover:text-slate-200 transition-all flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Terms & Conditions
              </button>
            </li>
            <li>
              <button onClick={() => setLegalType('refund')} className="hover:text-slate-200 transition-all flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> Refund & Cancellation
              </button>
            </li>
            <li>
              <button onClick={() => setLegalType('shipping')} className="hover:text-slate-200 transition-all flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Shipping & Delivery Policy
              </button>
            </li>
            <li>
              <button onClick={() => setLegalType('cookie')} className="hover:text-slate-200 transition-all flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" /> Cookie Policy
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact & Support */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Enterprise Contact</h4>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-400" />
              <span>Direct Hotline: +91 9475388085</span>
            </p>
            <p className="text-xs text-slate-400">
              Operating Hours: Mon - Sun (10:00 AM - 10:00 PM IST)
            </p>
            <div className="pt-2 text-xs text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-200">Razorpay Onboarding Compliant</span>
              <br />Digital SaaS Cloud Operating System for Restaurants & Hospitality.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© {new Date().getFullYear()} DigiMoms Smart Restaurant OS. All Rights Reserved.</p>
        <p className="font-medium text-slate-300">
          Technology Powered by <span className="text-blue-400 font-bold">DigiMoms Enterprise</span> | Version 2026 Edition
        </p>
      </div>

      {/* Render Legal Modal if active */}
      {legalType && (
        <LegalModal type={legalType} onClose={() => setLegalType(null)} />
      )}
    </footer>
  );
};
