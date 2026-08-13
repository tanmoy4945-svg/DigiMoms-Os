import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Check, Zap, Sparkles, Building2, ArrowRight } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { addRestaurant, loginOwner, setActiveView } = useSaaS();

  const [showRegModal, setShowRegModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    owner_name: '',
    owner_mobile: '',
    password: '',
    address: '',
    gst: '',
    fssai: ''
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.owner_mobile) {
      alert('Please fill in required fields.');
      return;
    }

    const created = addRestaurant({
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      owner_name: formData.owner_name,
      owner_mobile: formData.owner_mobile,
      password_hash: formData.password || 'owner123',
      address: formData.address,
      gst: formData.gst,
      fssai: formData.fssai
    });

    // Auto log in as owner
    loginOwner(created.owner_mobile, created.password_hash || 'owner123');
    setShowRegModal(false);
    setActiveView('owner-dashboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          Transparent SaaS Pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
          Simple Plans for Restaurants of Any Size
        </h1>
        <p className="text-slate-400 text-base">
          Start with 15 days 100% free trial. Upgrade anytime. All plans include full QR ordering, Kitchen KDS & Waiter Call systems.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Trial Plan */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 relative flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Free Trial</h3>
            <div className="text-4xl font-extrabold text-white">₹0 <span className="text-sm font-normal text-slate-400">/ 15 Days</span></div>
            <p className="text-xs text-slate-400">Ideal for testing DigiMoms OS in your restaurant.</p>
            <ul className="space-y-3 pt-4 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited QR Menu Scans</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 10 Active Table QR Codes</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Kitchen KDS Terminal</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Waiter Call Notifications</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> jsPDF Digital Invoices</li>
            </ul>
          </div>

          <button
            onClick={() => setShowRegModal(true)}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
          >
            Start 15-Day Free Trial
          </button>
        </div>

        {/* Pro Plan */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-950/80 to-slate-900 border-2 border-blue-500/80 space-y-6 relative flex flex-col justify-between shadow-2xl shadow-blue-500/20">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Most Popular
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Pro Monthly</h3>
            <div className="text-4xl font-extrabold text-white">₹999 <span className="text-sm font-normal text-slate-400">/ month</span></div>
            <p className="text-xs text-slate-300">Full power for busy restaurants, cafes & bars.</p>
            <ul className="space-y-3 pt-4 text-sm text-slate-200">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> Unlimited Table QR Codes</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> Multi-language (EN, BN, HI)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> Razorpay Live Payment Gateway</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> Staff & Waiter Accounts</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> Detailed Sales Analytics & CSV Export</li>
            </ul>
          </div>

          <button
            onClick={() => setShowRegModal(true)}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
          >
            Register Restaurant Now
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 relative flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Annual Growth</h3>
            <div className="text-4xl font-extrabold text-white">₹8,999 <span className="text-sm font-normal text-slate-400">/ year</span></div>
            <p className="text-xs text-slate-400">Save 25% with annual billing + Dedicated VIP support.</p>
            <ul className="space-y-3 pt-4 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Everything in Pro Plan</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Priority WhatsApp Support (+91 9475388085)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Custom Domain Support</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Dedicated Account Manager</li>
            </ul>
          </div>

          <button
            onClick={() => setShowRegModal(true)}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all"
          >
            Get Annual Pass
          </button>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Register Your Restaurant</h3>
              </div>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spice Garden Restaurant"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    setFormData({ ...formData, name, slug });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL Slug (domain.com/r/slug)</label>
                <input
                  type="text"
                  placeholder="spice-garden"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-blue-400 font-mono focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Owner Full Name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit mobile"
                    value={formData.owner_mobile}
                    onChange={(e) => setFormData({ ...formData, owner_mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Login Password</label>
                <input
                  type="password"
                  placeholder="Default: owner123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                Launch Restaurant OS Now <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
