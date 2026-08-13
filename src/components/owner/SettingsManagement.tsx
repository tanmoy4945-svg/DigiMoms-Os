import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Building2, Image, MapPin, Clock, FileText, Save, Globe, Shield, Phone, Sparkles, CheckSquare, Square, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { validateAndNormalizeImageUrl } from '../../utils/imageUrl';
import { SmartImage } from '../common/SmartImage';

export const SettingsManagement: React.FC = () => {
  const { currentOwner, updateOwnerProfile } = useSaaS();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'location' | 'services' | 'about' | 'tax' | 'legal'>('profile');

  const [form, setForm] = useState({
    name: currentOwner?.name || '',
    slug: currentOwner?.slug || '',
    owner_name: currentOwner?.owner_name || '',
    contact_mobile: currentOwner?.contact_mobile || currentOwner?.owner_mobile || '',
    owner_mobile: currentOwner?.owner_mobile || '',
    whatsapp_number: currentOwner?.whatsapp_number || currentOwner?.contact_mobile || '',
    contact_email: currentOwner?.contact_email || '',
    logo: currentOwner?.logo || '',
    banner: currentOwner?.banner || '',
    address: currentOwner?.address || '',
    city: currentOwner?.city || '',
    state: currentOwner?.state || '',
    pincode: currentOwner?.pincode || '',
    maps_location_url: currentOwner?.maps_location_url || '',
    business_hours: currentOwner?.business_hours || '10:00 AM - 10:00 PM',
    weekly_closing_day: currentOwner?.weekly_closing_day || 'None',
    gst: currentOwner?.gst || '',
    fssai: currentOwner?.fssai || '',
    short_description: currentOwner?.short_description || 'Authentic multi-cuisine restaurant serving delicious culinary creations.',
    detailed_description: currentOwner?.detailed_description || 'Welcome to our restaurant! We bring you handcrafted dishes prepared with the freshest local ingredients and authentic culinary traditions.',
    about_us: currentOwner?.about_us || 'Founded with a passion for exceptional taste and heartwarming hospitality, our restaurant offers a memorable dining experience for families and food lovers.',
    enabled_services: currentOwner?.enabled_services || ['dine_in', 'table_ordering', 'takeaway', 'delivery', 'catering', 'reservation'],
    privacy_policy: currentOwner?.privacy_policy || `PRIVACY POLICY
We value your privacy. We collect customer phone numbers and dining preferences solely to process table orders, generate digital invoices, and improve guest service. We never sell or share your personal data with unauthorized third parties.`,
    terms_conditions: currentOwner?.terms_conditions || `TERMS & CONDITIONS
1. All orders placed via our QR ordering system or website are final once sent to the kitchen.
2. Prices listed on the menu are inclusive of applicable taxes unless specified otherwise.
3. Payment must be cleared prior to leaving the restaurant table or upon delivery confirmation.`,
    refund_cancellation_policy: currentOwner?.refund_cancellation_policy || `REFUND & CANCELLATION POLICY
1. Cancellations are permitted prior to kitchen preparation approval.
2. Refunds for failed online transactions will be credited back to the original payment method within 5-7 business days.
3. Food item quality complaints will be addressed immediately by management through dish replacement or bill adjustment.`,
    shipping_delivery_policy: currentOwner?.shipping_delivery_policy || `SHIPPING & DELIVERY POLICY
1. Table orders are served directly to your designated table number.
2. Takeaway items will be ready for pickup at our main counter within 15-25 minutes.
3. Home delivery service (where enabled) is completed within a 5km radius within 30-45 minutes.`,
    contact_us_info: currentOwner?.contact_us_info || `CUSTOMER SUPPORT & LEGAL NOTICE
For feedback, reservations, or inquiries, please call us or send a WhatsApp message to our official customer care line.`
  });

  const [isValidatingImages, setIsValidatingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!currentOwner) return null;

  const toggleService = (serviceKey: string) => {
    const current = form.enabled_services || [];
    if (current.includes(serviceKey)) {
      setForm({ ...form, enabled_services: current.filter(s => s !== serviceKey) });
    } else {
      setForm({ ...form, enabled_services: [...current, serviceKey] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError(null);
    setSaveSuccessMsg(null);
    setIsValidatingImages(true);

    let logoUrl = form.logo ? form.logo.trim() : '';
    let bannerUrl = form.banner ? form.banner.trim() : '';

    if (logoUrl) {
      const resLogo = await validateAndNormalizeImageUrl(logoUrl);
      if (!resLogo.isValid) {
        setIsValidatingImages(false);
        setImageError(`Logo Image Error: ${resLogo.error}`);
        return;
      }
      logoUrl = resLogo.normalizedUrl;
    }

    if (bannerUrl) {
      const resBanner = await validateAndNormalizeImageUrl(bannerUrl);
      if (!resBanner.isValid) {
        setIsValidatingImages(false);
        setImageError(`Banner Image Error: ${resBanner.error}`);
        return;
      }
      bannerUrl = resBanner.normalizedUrl;
    }

    const updatedForm = { ...form, logo: logoUrl, banner: bannerUrl };
    setForm(updatedForm);
    await updateOwnerProfile(updatedForm);
    setIsValidatingImages(false);
    setSaveSuccessMsg('Restaurant Profile & Settings Saved Successfully!');
  };

  const AVAILABLE_SERVICES = [
    { key: 'dine_in', label: 'Dine-in Experience', desc: 'In-restaurant seated dining' },
    { key: 'table_ordering', label: 'QR Table Ordering', desc: 'Self-serve QR ordering at table' },
    { key: 'takeaway', label: 'Takeaway / Parcel', desc: 'Order & pickup at counter' },
    { key: 'delivery', label: 'Home Delivery', desc: 'Doorstep delivery to guests' },
    { key: 'catering', label: 'Catering Services', desc: 'Bulk food orders for events' },
    { key: 'party_booking', label: 'Party & Hall Booking', desc: 'Private event space hosting' },
    { key: 'reservation', label: 'Table Reservation', desc: 'Advance table booking' }
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white">Restaurant Profile & Public Website Settings</h2>
          <p className="text-xs text-slate-400">
            Manage your restaurant profile, contact details, public URL (/r/{form.slug}), legal policies & services
          </p>
        </div>

        <a
          href={`/r/${form.slug}`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
        >
          <Globe className="w-4 h-4" /> View Public Page (/r/{form.slug})
        </a>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { key: 'profile', label: 'Branding & Contact', icon: Building2 },
          { key: 'location', label: 'Address & Maps', icon: MapPin },
          { key: 'services', label: 'Public Services', icon: Sparkles },
          { key: 'about', label: 'About & Story', icon: FileText },
          { key: 'tax', label: 'GST & FSSAI', icon: Shield },
          { key: 'legal', label: 'Legal Policies', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeSubTab === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
        {/* SUBTAB 1: BRANDING & CONTACT */}
        {activeSubTab === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> Basic Information & Branding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Public URL Slug *
                  <span className="text-[10px] text-slate-400 block font-normal">(Public page URL: /r/{form.slug})</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Call Restaurant Contact *
                </label>
                <input
                  type="tel"
                  required
                  value={form.contact_mobile}
                  onChange={(e) => setForm({ ...form, contact_mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp Support Number
                </label>
                <input
                  type="tel"
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  placeholder="e.g. 919475388085"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Public Email
                </label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="info@restaurant.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Logo Image URL
                  <span className="text-[10px] text-slate-400 block font-normal">(Google Drive, Supabase, CDN, or direct URL)</span>
                </label>
                <input
                  type="text"
                  value={form.logo}
                  onChange={(e) => {
                    setImageError(null);
                    setSaveSuccessMsg(null);
                    setForm({ ...form, logo: e.target.value });
                  }}
                  placeholder="Paste image URL (e.g. Google Drive, Supabase, CDN...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                />
                {form.logo && (
                  <div className="mt-2 flex items-center gap-2">
                    <SmartImage src={form.logo} alt="Logo Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                    <span className="text-[10px] text-slate-400">Live Preview</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Banner Image URL
                  <span className="text-[10px] text-slate-400 block font-normal">(Google Drive, Supabase, CDN, or direct URL)</span>
                </label>
                <input
                  type="text"
                  value={form.banner}
                  onChange={(e) => {
                    setImageError(null);
                    setSaveSuccessMsg(null);
                    setForm({ ...form, banner: e.target.value });
                  }}
                  placeholder="Paste image URL (e.g. Google Drive, Supabase, CDN...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                />
                {form.banner && (
                  <div className="mt-2 flex items-center gap-2">
                    <SmartImage src={form.banner} alt="Banner Preview" className="w-24 h-12 rounded-xl object-cover border border-slate-800" />
                    <span className="text-[10px] text-slate-400">Live Preview</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Hours</label>
                <input
                  type="text"
                  value={form.business_hours}
                  onChange={(e) => setForm({ ...form, business_hours: e.target.value })}
                  placeholder="10:00 AM - 11:00 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Weekly Closing Day</label>
                <select
                  value={form.weekly_closing_day}
                  onChange={(e) => setForm({ ...form, weekly_closing_day: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                >
                  <option value="None">Open 7 Days a Week</option>
                  <option value="Monday">Monday Closed</option>
                  <option value="Tuesday">Tuesday Closed</option>
                  <option value="Wednesday">Wednesday Closed</option>
                  <option value="Thursday">Thursday Closed</option>
                  <option value="Friday">Friday Closed</option>
                  <option value="Saturday">Saturday Closed</option>
                  <option value="Sunday">Sunday Closed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: LOCATION & ADDRESS */}
        {activeSubTab === 'location' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" /> Location & Google Maps Link
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Business Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Building Name, Street, Landmark..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Siliguri"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. West Bengal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="734001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Google Maps Location Link
                <span className="text-[10px] text-slate-400 block font-normal">(Displayed on public website for directions)</span>
              </label>
              <input
                type="url"
                value={form.maps_location_url}
                onChange={(e) => setForm({ ...form, maps_location_url: e.target.value })}
                placeholder="https://maps.google.com/?q=..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* SUBTAB 3: SERVICES OFFERED */}
        {activeSubTab === 'services' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Public Offered Services
            </h3>
            <p className="text-xs text-slate-400">
              Select which services your restaurant actually provides. Only checked services will be highlighted on your public profile.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {AVAILABLE_SERVICES.map(srv => {
                const isSelected = (form.enabled_services || []).includes(srv.key);
                return (
                  <div
                    key={srv.key}
                    onClick={() => toggleService(srv.key)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-sm text-white">{srv.label}</div>
                      <div className="text-xs text-slate-400">{srv.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 4: ABOUT & STORY */}
        {activeSubTab === 'about' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" /> Short Description & About Us Story
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Short Catchy Tagline
                <span className="text-[10px] text-slate-400 block font-normal">(Displays under restaurant title on public header)</span>
              </label>
              <input
                type="text"
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Introduction</label>
              <textarea
                rows={3}
                value={form.detailed_description}
                onChange={(e) => setForm({ ...form, detailed_description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">About Us Story & Heritage</label>
              <textarea
                rows={4}
                value={form.about_us}
                onChange={(e) => setForm({ ...form, about_us: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* SUBTAB 5: GST & FSSAI TAX INFO */}
        {activeSubTab === 'tax' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" /> Business Registrations (GST & FSSAI)
            </h3>
            <p className="text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/20">
              ℹ️ GST and FSSAI are OPTIONAL. If you provide them, they will be legally printed on customer food bills and public footer. If left blank, NO empty fields or fake numbers will ever be displayed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  placeholder="19ABCDE1234F1Z5"
                  value={form.gst}
                  onChange={(e) => setForm({ ...form, gst: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">FSSAI License Number (Optional)</label>
                <input
                  type="text"
                  placeholder="12821001000456"
                  value={form.fssai}
                  onChange={(e) => setForm({ ...form, fssai: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 6: LEGAL POLICIES */}
        {activeSubTab === 'legal' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" /> Public Website Legal Policies
            </h3>
            <p className="text-xs text-slate-400">
              Customize your restaurant's legal policies shown on /r/{form.slug}/privacy-policy, /r/{form.slug}/terms, etc.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Privacy Policy</label>
              <textarea
                rows={3}
                value={form.privacy_policy}
                onChange={(e) => setForm({ ...form, privacy_policy: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={form.terms_conditions}
                onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Refund & Cancellation Policy</label>
              <textarea
                rows={3}
                value={form.refund_cancellation_policy}
                onChange={(e) => setForm({ ...form, refund_cancellation_policy: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shipping & Delivery Policy</label>
              <textarea
                rows={3}
                value={form.shipping_delivery_policy}
                onChange={(e) => setForm({ ...form, shipping_delivery_policy: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Support Notice</label>
              <textarea
                rows={2}
                value={form.contact_us_info}
                onChange={(e) => setForm({ ...form, contact_us_info: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:border-rose-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* IMAGE VALIDATION ERROR ALERT */}
        {imageError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm text-rose-200">Image Load Verification Failed</p>
              <p className="mt-1 font-normal text-rose-300">{imageError}</p>
            </div>
          </div>
        )}

        {/* SAVE SUCCESS MESSAGE */}
        {saveSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Changes will update your live profile at <span className="text-blue-400 font-mono">/r/{form.slug}</span> immediately.
          </div>
          <button
            type="submit"
            disabled={isValidatingImages}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isValidatingImages ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" /> Verifying Image URLs...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Profile & Legal Policies
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
