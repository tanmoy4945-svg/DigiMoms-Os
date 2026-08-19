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
          <p>This website and digital platform is operated by <strong>DigiMoms Marketing Agency</strong> (Legal Operator: <strong>Tanmoy Jana</strong>). We respect your privacy and are committed to protecting all personal and operational data collected across our multi-tenant SaaS application platform.</p>
          
          <h3 className="font-bold text-white text-base pt-2">1. Information We Collect</h3>
          <p>We collect restaurant owner details (Name, Phone number, Business Address, GSTIN, FSSAI numbers), staff credentials, and transaction meta-data required to process dining sessions, manage kitchen workflow, and generate digital bills.</p>

          <h3 className="font-bold text-white text-base pt-2">2. Customer Dining & QR Ordering Data</h3>
          <p>Customers ordering via QR code do NOT require mandatory personal account creation. Dining preferences and cart orders are temporarily stored in active table sessions to facilitate swift kitchen preparation and invoice settlement.</p>

          <h3 className="font-bold text-white text-base pt-2">3. Payment Security & Data Handling</h3>
          <p>We do not store payment card details, CVVs, or online banking passwords on our servers. All digital transactions are handled via 256-bit SSL encrypted, PCI-DSS compliant secure payment systems supporting UPI, Credit/Debit Cards, and Net Banking.</p>

          <h3 className="font-bold text-white text-base pt-2">4. Data Isolation & Confidentiality</h3>
          <p>Every restaurant account operates within a strictly isolated database tenant. Sales figures, menu pricing, recipe information, and customer records remain strictly private and are never shared or sold to third parties.</p>

          <h3 className="font-bold text-white text-base pt-2">5. Legal Operator & Grievance Contact</h3>
          <p>For any privacy inquiries, data export requests, or grievances, you may contact our designated officer:</p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 mt-1">
            <p><strong className="text-white">Legal Operator:</strong> Tanmoy Jana</p>
            <p><strong className="text-white">Trade Name:</strong> DigiMoms Marketing Agency</p>
            <p><strong className="text-white">Address:</strong> Andulia, Lachhmi Chak, Sabang, Paschim Medinipur, West Bengal, 721144</p>
            <p><strong className="text-white">Email:</strong> tanmoy4945@gmail.com / support@digimoms.com</p>
            <p><strong className="text-white">WhatsApp Support:</strong> 24 Hours Active (+91 9475388085)</p>
            <p><strong className="text-white">Office Hours:</strong> Mon - Sat (10 AM - 9 PM IST)</p>
          </div>
        </div>
      )
    },
    terms: {
      title: 'Terms & Conditions',
      icon: <FileText className="w-6 h-6 text-purple-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-blue-200 font-semibold text-sm">
            This website is operated by DigiMoms Marketing Agency.
          </p>
          <p><strong>Last Updated:</strong> August 2026</p>
          <p>By registering, accessing, or using the DigiMoms Smart Restaurant OS, you agree to be bound by these Terms and Conditions.</p>

          <h3 className="font-bold text-white text-base pt-2">1. Operating Entity & Legal Ownership</h3>
          <p>The platform, services, and software are legally operated by <strong>Tanmoy Jana</strong> under the trade name <strong>DigiMoms Marketing Agency</strong>, located at <strong>Andulia, Lachhmi Chak, Sabang, Paschim Medinipur, West Bengal, 721144</strong>.</p>

          <h3 className="font-bold text-white text-base pt-2">2. SaaS Subscription & 15-Day Free Trial</h3>
          <p>New restaurants are provided a 15-day free trial period to evaluate all features of the operating system. Subscriptions can be activated or renewed at ₹999/month (INR) without losing existing restaurant data or invoice history.</p>

          <h3 className="font-bold text-white text-base pt-2">3. Multi-Tenant Isolation & Permitted Use</h3>
          <p>Each restaurant operates in a secure, isolated tenant environment. Users agree not to reverse engineer, probe, or attempt unauthorized access to other tenants or system infrastructure.</p>

          <h3 className="font-bold text-white text-base pt-2">4. Restaurant Responsibility</h3>
          <p>Restaurant owners are solely responsible for ensuring accurate menu pricing, food preparation standards, applicable GST/taxes, and statutory FSSAI compliance.</p>
        </div>
      )
    },
    refund: {
      title: 'Return, Refund & Cancellation Policy',
      icon: <HelpCircle className="w-6 h-6 text-emerald-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <h3 className="font-bold text-white text-base pt-1">Return & Refund Policy</h3>
          <p className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            We offer a 15-day free trial for DigiMoms Smart Restaurant OS. Once a paid subscription has started, it is non-refundable. In case of any billing error, the amount will be refunded to the original payment source within 5–7 business days.
          </p>

          <h3 className="font-bold text-white text-base pt-2">Cancellation Policy</h3>
          <p className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            Users can cancel their subscription at any time from the dashboard. The service will remain active until the end of the current billing cycle, after which no new charges will apply.
          </p>

          <h3 className="font-bold text-white text-base pt-2">Billing Queries & Support</h3>
          <p>For any billing clarification or assistance, please contact our support team:</p>
          <div className="text-xs text-slate-300 space-y-1">
            <p><strong>WhatsApp Support:</strong> 24 Hours Active (+91 9475388085)</p>
            <p><strong>Office Hours:</strong> Mon - Sat (10 AM - 9 PM IST)</p>
            <p><strong>Email:</strong> support@digimoms.com / tanmoy4945@gmail.com</p>
          </div>
        </div>
      )
    },
    shipping: {
      title: 'Shipping & Delivery Policy',
      icon: <FileText className="w-6 h-6 text-amber-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <h3 className="font-bold text-white text-base pt-1">Digital Service Delivery</h3>
          <p className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            All our services and software access are delivered digitally within 24–48 hours via email or account activation. There is no physical shipping or logistics delivery.
          </p>

          <h3 className="font-bold text-white text-base pt-2">Immediate System Access</h3>
          <p>Upon registration, your digital tenant dashboard, menu management tools, waiter interfaces, kitchen KDS, and printable QR assets become available online immediately.</p>
        </div>
      )
    },
    cookie: {
      title: 'Cookie Policy',
      icon: <AlertCircle className="w-6 h-6 text-sky-400" />,
      body: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>This application uses essential session storage and functional cookies solely to maintain active dining sessions, authenticated login state, and language preferences.</p>
          <p>We do NOT use third-party tracking or advertising cookies.</p>
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
