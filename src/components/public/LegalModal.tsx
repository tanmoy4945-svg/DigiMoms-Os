import React from 'react';
import { X, Shield, FileText, HelpCircle, AlertCircle } from 'lucide-react';

interface LegalModalProps {
  type?: 'privacy' | 'terms' | 'refund' | 'shipping' | 'cookie';
  onClose?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type = 'privacy', onClose }) => {
  const content = {
    privacy: {
      title: 'Privacy Policy',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p><strong>Effective Date:</strong> August 2026</p>
          <p>DigiMoms Smart Restaurant OS ("Company", "We", "Our") respects your privacy. This Privacy Policy outlines how we collect, use, and protect information across our multi-tenant SaaS application platform.</p>
          
          <h3 className="font-bold text-white text-base pt-2">1. Information We Collect</h3>
          <p>We collect restaurant owner details (Name, Phone number, Business Address, GSTIN, FSSAI numbers), staff credentials, and transaction meta-data required to process dining sessions and generate digital bills.</p>

          <h3 className="font-bold text-white text-base pt-2">2. Customer Dining Data</h3>
          <p>Customers ordering via QR code do NOT require mandatory account creation. Dining preferences and cart orders are stored in temporary table sessions to facilitate kitchen fulfillment.</p>

          <h3 className="font-bold text-white text-base pt-2">3. Payment Security</h3>
          <p>We do NOT store credit card details or bank passwords on our servers. All online payment flows use 256-bit SSL encrypted PCI-DSS compliant payment gateways supporting UPI, Cards, and Net Banking.</p>

          <h3 className="font-bold text-white text-base pt-2">4. Data Retention</h3>
          <p>Order records and invoices are securely saved for tax compliance. You may request data export or account closure by contacting our support hotline at +91 9475388085.</p>
        </div>
      )
    },
    terms: {
      title: 'Terms & Conditions',
      icon: <FileText className="w-6 h-6 text-purple-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p><strong>Last Updated:</strong> August 2026</p>
          <p>By registering or using the DigiMoms Smart Restaurant OS, you agree to these Terms and Conditions.</p>

          <h3 className="font-bold text-white text-base pt-2">1. SaaS Subscription & Free Access</h3>
          <p>New restaurants are granted a 15-day trial period or lifetime tier as configured by the CEO Super Administrator. Subscriptions can be renewed or upgraded without losing existing menu data or invoice history.</p>

          <h3 className="font-bold text-white text-base pt-2">2. Multi-Tenant Isolation</h3>
          <p>Each restaurant operates in a strictly isolated tenant environment (`restaurant_id`). Attempting cross-tenant data access, reverse engineering, or unauthorized API probing will result in immediate permanent suspension.</p>

          <h3 className="font-bold text-white text-base pt-2">3. Restaurant Responsibility</h3>
          <p>Restaurant owners are solely responsible for setting accurate food prices, GST taxes, FSSAI licenses, and verifying cash payments collected at table counters.</p>
        </div>
      )
    },
    refund: {
      title: 'Refund & Cancellation Policy',
      icon: <HelpCircle className="w-6 h-6 text-emerald-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p><strong>Policy Summary:</strong></p>
          <p>DigiMoms provides a digital cloud SaaS software service for restaurant management.</p>

          <h3 className="font-bold text-white text-base pt-2">1. Free Trial & Cancellation</h3>
          <p>Restaurants can evaluate all features during the 15-day free trial without submitting credit card details. Subscription payments can be cancelled at any time before the next billing cycle.</p>

          <h3 className="font-bold text-white text-base pt-2">2. Refund Requests</h3>
          <p>If you experience technical server downtime exceeding 24 hours that cannot be resolved by support, you may request a pro-rata refund for the unused subscription period within 7 days of payment.</p>

          <h3 className="font-bold text-white text-base pt-2">3. Contact Support</h3>
          <p>For refund requests or assistance, please reach out via WhatsApp at <strong>+91 9475388085</strong> with your Restaurant Name and Payment ID.</p>
        </div>
      )
    },
    shipping: {
      title: 'Shipping & Delivery Policy',
      icon: <FileText className="w-6 h-6 text-amber-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p><strong>Digital SaaS Product Delivery:</strong></p>
          <p>DigiMoms Smart Restaurant OS is a 100% cloud-based Software-as-a-Service (SaaS) platform. No physical goods or hard copies are shipped via courier.</p>

          <h3 className="font-bold text-white text-base pt-2">1. Instant Activation</h3>
          <p>Upon registration by the CEO or Restaurant Owner, the digital tenant instance, owner dashboard, kitchen terminals, and QR code generator are provisioned instantly.</p>

          <h3 className="font-bold text-white text-base pt-2">2. Printable QR Downloads</h3>
          <p>Table QR codes and invoices can be downloaded instantly in PDF format from the Owner Dashboard and printed using any standard office printer.</p>
        </div>
      )
    },
    cookie: {
      title: 'Cookie Policy',
      icon: <AlertCircle className="w-6 h-6 text-sky-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>This application uses essential session storage and local cookies solely to maintain active dining sessions, user authorization tokens, and language preferences.</p>
          <p>We do NOT use invasive third-party tracking or advertising cookies.</p>
        </div>
      )
    }
  };

  const selected = (type && content[type]) ? content[type] : content.privacy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            {selected.icon}
            <h2 className="text-xl font-bold text-white">{selected.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {selected.body}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
