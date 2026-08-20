import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, Clock, Send } from 'lucide-react';
import { useSaaS } from '../../context/SaaSContext';

export const ContactPage: React.FC = () => {
  const { showToast } = useSaaS();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Your message has been received! Our support team will call you back shortly.', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-white">Contact DigiMoms Support</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm">
          Have questions about QR Ordering, payment gateway integration, or enterprise onboarding? We're available 7 days a week.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Direct Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xl font-bold text-white">Direct Enterprise Support</h3>

            <div className="space-y-4 pt-2">
              <a
                href="https://wa.me/919475388085"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 transition-all"
              >
                <MessageSquare className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase">WhatsApp Instant Help</div>
                  <div className="text-base font-bold text-white">+91 9475388085</div>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <Phone className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase">Direct Helpline</div>
                  <div className="text-base font-bold text-white">+91 9475388085</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <Mail className="w-6 h-6 text-purple-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase">Support Email</div>
                  <div className="text-base font-bold text-white">support@digimoms.com</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <Clock className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase">Support Operating Hours</div>
                  <div className="text-sm font-medium text-slate-200">Monday - Sunday: 10:00 AM - 10:00 PM IST</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-white">Request a Callback / Demo</h3>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-center space-y-3">
              <div className="text-2xl font-bold">Message Delivered!</div>
              <p className="text-xs text-emerald-300">
                Thank you for contacting DigiMoms. Our onboarding representative will reach out via phone/WhatsApp (+91 9475388085) shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message / Restaurant Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your restaurant, location, and requirement..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                Send Request <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
