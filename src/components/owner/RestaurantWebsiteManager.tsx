import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import {
  Globe, Layout, Info, Wrench, DollarSign, Image, PhoneCall,
  Building2, ShieldCheck, Share2, Search, ExternalLink, Plus, Trash2, Edit2, CheckCircle2, Save,
  AlertCircle, Loader2
} from 'lucide-react';
import { validateAndNormalizeImageUrl } from '../../utils/imageUrl';
import { SmartImage } from '../common/SmartImage';
import {
  RestaurantWebsiteSettings, RestaurantServiceItem, RestaurantPricingItem,
  RestaurantLegalPages, RestaurantSocialLinks
} from '../../types';

interface RestaurantWebsiteManagerProps {
  restaurantId: string;
}

export const RestaurantWebsiteManager: React.FC<RestaurantWebsiteManagerProps> = ({ restaurantId }) => {
  const {
    restaurants,
    updateRestaurant,
    getWebsiteSettings,
    updateWebsiteSettings,
    getServices,
    addService,
    updateService,
    deleteService,
    getPricing,
    addPricingItem,
    updatePricingItem,
    deletePricingItem,
    getLegalPages,
    updateLegalPages,
    getSocialLinks,
    updateSocialLinks,
    setActiveSlug,
    setActiveView
  } = useSaaS();

  const restaurant = restaurants.find(r => r.id === restaurantId);

  const [activeSubTab, setActiveSubTab] = useState<
    'home' | 'about' | 'services' | 'pricing' | 'gallery' | 'contact' | 'business' | 'legal' | 'social' | 'seo'
  >('home');

  // Local state initialized from context
  const websiteConfig = getWebsiteSettings(restaurantId);
  const legalConfig = getLegalPages(restaurantId);
  const socialConfig = getSocialLinks(restaurantId);
  const servicesList = getServices(restaurantId);
  const pricingList = getPricing(restaurantId);

  // Form states
  const [homeForm, setHomeForm] = useState({
    name: restaurant?.name || '',
    logo: restaurant?.logo || '',
    banner: restaurant?.banner || '',
    short_description: restaurant?.short_description || websiteConfig.description || '',
    opening_time: websiteConfig.opening_time || '10:00 AM',
    closing_time: websiteConfig.closing_time || '10:00 PM',
    weekly_closed_day: websiteConfig.weekly_closed_day || 'None',
    phone: websiteConfig.phone || restaurant?.owner_mobile || '',
    whatsapp: websiteConfig.whatsapp || restaurant?.owner_mobile || '',
    email: websiteConfig.email || restaurant?.contact_email || ''
  });

  const [aboutForm, setAboutForm] = useState({
    about_us: websiteConfig.about_us || restaurant?.about_us || ''
  });

  const [contactForm, setContactForm] = useState({
    address: restaurant?.address || '',
    google_map_embed_url: websiteConfig.google_map_embed_url || restaurant?.maps_location_url || '',
    booking_info: websiteConfig.booking_info || '',
    website_url: websiteConfig.website_url || ''
  });

  const [businessForm, setBusinessForm] = useState({
    legal_business_name: restaurant?.name || '',
    gst: restaurant?.gst || '',
    fssai: restaurant?.fssai || '',
    city: restaurant?.city || '',
    state: restaurant?.state || '',
    pincode: restaurant?.pincode || ''
  });

  const [legalForm, setLegalForm] = useState({
    privacy_policy: legalConfig.privacy_policy || restaurant?.privacy_policy || '',
    terms_conditions: legalConfig.terms_conditions || restaurant?.terms_conditions || '',
    refund_policy: legalConfig.refund_policy || restaurant?.refund_cancellation_policy || '',
    cancellation_policy: legalConfig.cancellation_policy || '',
    shipping_policy: legalConfig.shipping_policy || restaurant?.shipping_delivery_policy || '',
    return_policy: legalConfig.return_policy || '',
    grievance_contact: legalConfig.grievance_contact || restaurant?.contact_us_info || '',
    disclaimer: legalConfig.disclaimer || ''
  });

  const [socialForm, setSocialForm] = useState({
    instagram: socialConfig.instagram || '',
    facebook: socialConfig.facebook || '',
    twitter: socialConfig.twitter || '',
    youtube: socialConfig.youtube || '',
    linkedin: socialConfig.linkedin || '',
    google_business: socialConfig.google_business || ''
  });

  const [seoForm, setSeoForm] = useState({
    seo_title: websiteConfig.seo_title || restaurant?.name || '',
    seo_description: websiteConfig.seo_description || websiteConfig.description || '',
    seo_keywords: websiteConfig.seo_keywords || 'restaurant, fine dining, online order, menu'
  });

  const [galleryInput, setGalleryInput] = useState('');

  // Service modal
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    duration: '',
    availability: 'Available Daily',
    sort_order: 1,
    is_active: true
  });

  // Pricing modal
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [pricingForm, setPricingForm] = useState({
    service_name: '',
    price: 0,
    offer_price: 0,
    unit: 'per service',
    description: '',
    show_price: true,
    is_active: true
  });

  // Image validation states
  const [homeImageError, setHomeImageError] = useState<string | null>(null);
  const [isSavingHome, setIsSavingHome] = useState(false);

  const [galleryImageError, setGalleryImageError] = useState<string | null>(null);
  const [isAddingGallery, setIsAddingGallery] = useState(false);

  const [serviceImageError, setServiceImageError] = useState<string | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);

  if (!restaurant) {
    return <div className="text-slate-400 p-6">Restaurant not found.</div>;
  }

  const handleSaveHome = async () => {
    setHomeImageError(null);
    setIsSavingHome(true);

    let logoUrl = homeForm.logo ? homeForm.logo.trim() : '';
    let bannerUrl = homeForm.banner ? homeForm.banner.trim() : '';

    if (logoUrl) {
      const resLogo = await validateAndNormalizeImageUrl(logoUrl);
      if (!resLogo.isValid) {
        setIsSavingHome(false);
        setHomeImageError(`Logo Image Error: ${resLogo.error}`);
        return;
      }
      logoUrl = resLogo.normalizedUrl;
    }

    if (bannerUrl) {
      const resBanner = await validateAndNormalizeImageUrl(bannerUrl);
      if (!resBanner.isValid) {
        setIsSavingHome(false);
        setHomeImageError(`Banner Image Error: ${resBanner.error}`);
        return;
      }
      bannerUrl = resBanner.normalizedUrl;
    }

    setHomeForm(prev => ({ ...prev, logo: logoUrl, banner: bannerUrl }));

    await updateRestaurant(restaurantId, {
      name: homeForm.name,
      logo: logoUrl,
      banner: bannerUrl,
      short_description: homeForm.short_description
    });
    await updateWebsiteSettings(restaurantId, {
      opening_time: homeForm.opening_time,
      closing_time: homeForm.closing_time,
      weekly_closed_day: homeForm.weekly_closed_day,
      phone: homeForm.phone,
      whatsapp: homeForm.whatsapp,
      email: homeForm.email,
      description: homeForm.short_description
    });
    setIsSavingHome(false);
  };

  const handleSaveAbout = async () => {
    await updateWebsiteSettings(restaurantId, {
      about_us: aboutForm.about_us
    });
    await updateRestaurant(restaurantId, { about_us: aboutForm.about_us });
  };

  const handleSaveContact = async () => {
    await updateRestaurant(restaurantId, {
      address: contactForm.address,
      maps_location_url: contactForm.google_map_embed_url
    });
    await updateWebsiteSettings(restaurantId, {
      google_map_embed_url: contactForm.google_map_embed_url,
      booking_info: contactForm.booking_info,
      website_url: contactForm.website_url
    });
  };

  const handleSaveBusiness = async () => {
    await updateRestaurant(restaurantId, {
      gst: businessForm.gst,
      fssai: businessForm.fssai,
      city: businessForm.city,
      state: businessForm.state,
      pincode: businessForm.pincode
    });
  };

  const handleSaveLegal = async () => {
    await updateLegalPages(restaurantId, legalForm);
  };

  const handleSaveSocial = async () => {
    await updateSocialLinks(restaurantId, socialForm);
  };

  const handleSaveSeo = async () => {
    await updateWebsiteSettings(restaurantId, seoForm);
  };

  const handleAddGalleryImage = async () => {
    if (!galleryInput.trim()) return;
    setGalleryImageError(null);
    setIsAddingGallery(true);

    const res = await validateAndNormalizeImageUrl(galleryInput);
    if (!res.isValid) {
      setIsAddingGallery(false);
      setGalleryImageError(`Gallery Photo Error: ${res.error}`);
      return;
    }

    const currentList = websiteConfig.gallery_urls || [];
    const updated = [...currentList, res.normalizedUrl];
    await updateWebsiteSettings(restaurantId, { gallery_urls: updated });
    setGalleryInput('');
    setIsAddingGallery(false);
  };

  const handleRemoveGalleryImage = async (idx: number) => {
    const currentList = websiteConfig.gallery_urls || [];
    const updated = currentList.filter((_, i) => i !== idx);
    await updateWebsiteSettings(restaurantId, { gallery_urls: updated });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name) return;
    setServiceImageError(null);
    setIsSavingService(true);

    let imageUrl = serviceForm.image ? serviceForm.image.trim() : '';
    if (imageUrl) {
      const res = await validateAndNormalizeImageUrl(imageUrl);
      if (!res.isValid) {
        setIsSavingService(false);
        setServiceImageError(`Service Image Error: ${res.error}`);
        return;
      }
      imageUrl = res.normalizedUrl;
    }

    const finalServiceForm = { ...serviceForm, image: imageUrl };

    if (editingServiceId) {
      await updateService(editingServiceId, finalServiceForm);
    } else {
      await addService(restaurantId, finalServiceForm);
    }
    setIsSavingService(false);
    setShowServiceModal(false);
    setEditingServiceId(null);
    setServiceForm({ name: '', description: '', price: 0, image: '', duration: '', availability: 'Available Daily', sort_order: 1, is_active: true });
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingForm.service_name) return;
    if (editingPricingId) {
      await updatePricingItem(editingPricingId, pricingForm);
    } else {
      await addPricingItem(restaurantId, pricingForm);
    }
    setShowPricingModal(false);
    setEditingPricingId(null);
    setPricingForm({ service_name: '', price: 0, offer_price: 0, unit: 'per service', description: '', show_price: true, is_active: true });
  };

  const previewUrl = `/r/${restaurant.slug}`;

  return (
    <div className="space-y-6">
      {/* Header & Website URL preview banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Public Website & Portfolio Manager</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage public homepage, services, pricing, legal policies, and business info for <span className="text-white font-bold">{restaurant.name}</span>.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveSlug(restaurant.slug);
            setActiveView('public-restaurant');
          }}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0"
        >
          <ExternalLink className="w-4 h-4" /> Preview Website ({previewUrl})
        </button>
      </div>

      {/* Submenus Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 custom-scrollbar">
        {[
          { id: 'home', label: 'Website Home', icon: Layout },
          { id: 'about', label: 'About', icon: Info },
          { id: 'services', label: 'Services', icon: Wrench },
          { id: 'pricing', label: 'Pricing', icon: DollarSign },
          { id: 'gallery', label: 'Gallery', icon: Image },
          { id: 'contact', label: 'Contact', icon: PhoneCall },
          { id: 'business', label: 'Business Info', icon: Building2 },
          { id: 'legal', label: 'Legal Pages', icon: ShieldCheck },
          { id: 'social', label: 'Social Links', icon: Share2 },
          { id: 'seo', label: 'SEO Settings', icon: Search }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white bg-slate-900/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: WEBSITE HOME */}
      {activeSubTab === 'home' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layout className="w-4 h-4 text-blue-400" /> Basic Website & Branding Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Restaurant / Hotel Name</label>
              <input
                type="text"
                value={homeForm.name}
                onChange={e => setHomeForm({ ...homeForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Logo URL
                <span className="text-[10px] text-slate-400 block font-normal">(Google Drive, Supabase, CDN, or direct image URL)</span>
              </label>
              <input
                type="text"
                value={homeForm.logo}
                onChange={e => {
                  setHomeImageError(null);
                  setHomeForm({ ...homeForm, logo: e.target.value });
                }}
                placeholder="Paste Image URL (Google Drive, Supabase, CDN...)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
              {homeForm.logo && (
                <div className="mt-2 flex items-center gap-2">
                  <SmartImage src={homeForm.logo} alt="Logo Preview" className="w-10 h-10 rounded-xl object-cover border border-slate-800" />
                  <span className="text-[10px] text-slate-400">Live Preview</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">
                Cover / Banner URL
                <span className="text-[10px] text-slate-400 block font-normal">(Google Drive, Supabase, CDN, or direct image URL)</span>
              </label>
              <input
                type="text"
                value={homeForm.banner}
                onChange={e => {
                  setHomeImageError(null);
                  setHomeForm({ ...homeForm, banner: e.target.value });
                }}
                placeholder="Paste Image URL (Google Drive, Supabase, CDN...)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
              {homeForm.banner && (
                <div className="mt-2 flex items-center gap-2">
                  <SmartImage src={homeForm.banner} alt="Banner Preview" className="w-20 h-10 rounded-xl object-cover border border-slate-800" />
                  <span className="text-[10px] text-slate-400">Live Preview</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">Short Description / Catchphrase</label>
              <textarea
                rows={2}
                value={homeForm.short_description}
                onChange={e => setHomeForm({ ...homeForm, short_description: e.target.value })}
                placeholder="e.g. Fine dining Indian & Continental delicacies in authentic ambiance."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Opening Time</label>
              <input
                type="text"
                value={homeForm.opening_time}
                onChange={e => setHomeForm({ ...homeForm, opening_time: e.target.value })}
                placeholder="10:00 AM"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Closing Time</label>
              <input
                type="text"
                value={homeForm.closing_time}
                onChange={e => setHomeForm({ ...homeForm, closing_time: e.target.value })}
                placeholder="11:00 PM"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Weekly Closed Day</label>
              <input
                type="text"
                value={homeForm.weekly_closed_day}
                onChange={e => setHomeForm({ ...homeForm, weekly_closed_day: e.target.value })}
                placeholder="None or Tuesday"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={homeForm.phone}
                onChange={e => setHomeForm({ ...homeForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={homeForm.whatsapp}
                onChange={e => setHomeForm({ ...homeForm, whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={homeForm.email}
                onChange={e => setHomeForm({ ...homeForm, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          {homeImageError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm text-rose-200">Image Verification Failed</p>
                <p className="mt-1 font-normal text-rose-300">{homeImageError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleSaveHome}
            disabled={isSavingHome}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {isSavingHome ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" /> Verifying Image URLs...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Website Home Settings
              </>
            )}
          </button>
        </div>
      )}

      {/* SUBTAB 2: ABOUT */}
      {activeSubTab === 'about' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" /> About Us Story
          </h4>

          <div>
            <label className="block font-bold text-slate-300 mb-2 text-xs">Full Restaurant Story / About Us Content</label>
            <textarea
              rows={8}
              value={aboutForm.about_us}
              onChange={e => setAboutForm({ ...aboutForm, about_us: e.target.value })}
              placeholder="Tell customers about your kitchen heritage, master chefs, organic sourcing, and dining experience..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed"
            />
          </div>

          <button
            onClick={handleSaveAbout}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" /> Save About Us Content
          </button>
        </div>
      )}

      {/* SUBTAB 3: SERVICES */}
      {activeSubTab === 'services' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" /> Restaurant Services & Amenities
              </h4>
              <p className="text-xs text-slate-400">Configure services like Party Hall, Catering, Dining, Home Delivery, Banquet, etc.</p>
            </div>

            <button
              onClick={() => {
                setEditingServiceId(null);
                setServiceForm({ name: '', description: '', price: 0, image: '', duration: '', availability: 'Available Daily', sort_order: servicesList.length + 1, is_active: true });
                setShowServiceModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Custom Service
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicesList.map(service => (
              <div key={service.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative">
                {service.image && (
                  <SmartImage src={service.image} alt={service.name} className="w-full h-32 object-cover rounded-xl mb-2" />
                )}
                <div className="flex items-start justify-between">
                  <h5 className="font-bold text-white text-sm">{service.name}</h5>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${service.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="font-bold text-emerald-400">₹{service.price}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingServiceId(service.id);
                        setServiceForm({
                          name: service.name,
                          description: service.description,
                          price: service.price,
                          image: service.image || '',
                          duration: service.duration || '',
                          availability: service.availability,
                          sort_order: service.sort_order,
                          is_active: service.is_active
                        });
                        setShowServiceModal(true);
                      }}
                      className="text-slate-400 hover:text-blue-400 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {servicesList.length === 0 && (
              <div className="col-span-full text-center py-8 text-xs text-slate-500">
                No custom services added yet. Click 'Add Custom Service' above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: PRICING */}
      {activeSubTab === 'pricing' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Public Pricing & Package Rates
              </h4>
              <p className="text-xs text-slate-400">Public service rates with optional pricing visibility toggle (`show_price`).</p>
            </div>

            <button
              onClick={() => {
                setEditingPricingId(null);
                setPricingForm({ service_name: '', price: 0, offer_price: 0, unit: 'per service', description: '', show_price: true, is_active: true });
                setShowPricingModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Pricing Item
            </button>
          </div>

          <div className="space-y-3">
            {pricingList.map(item => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.service_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.show_price ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                      {item.show_price ? 'Price Shown' : 'Price Hidden'}
                    </span>
                  </div>
                  {item.description && <p className="text-slate-400 text-xs mt-1">{item.description}</p>}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    {item.show_price ? (
                      <>
                        <div className="text-sm font-bold text-emerald-400">
                          ₹{item.price} <span className="text-[10px] text-slate-500 font-normal">/{item.unit}</span>
                        </div>
                        {item.offer_price ? (
                          <div className="text-[10px] text-amber-400 font-bold">Offer: ₹{item.offer_price}</div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 font-bold">On Request</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPricingId(item.id);
                        setPricingForm({
                          service_name: item.service_name,
                          price: item.price,
                          offer_price: item.offer_price || 0,
                          unit: item.unit,
                          description: item.description || '',
                          show_price: item.show_price,
                          is_active: item.is_active
                        });
                        setShowPricingModal(true);
                      }}
                      className="text-slate-400 hover:text-blue-400 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePricingItem(item.id)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {pricingList.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                No pricing items added yet. Click 'Add Pricing Item' above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 5: GALLERY */}
      {activeSubTab === 'gallery' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Image className="w-4 h-4 text-blue-400" /> Photo Gallery
          </h4>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={galleryInput}
                onChange={e => {
                  setGalleryImageError(null);
                  setGalleryInput(e.target.value);
                }}
                placeholder="Paste Image URL (e.g. Google Drive, Supabase, CDN, or direct URL...)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              />
              <button
                onClick={handleAddGalleryImage}
                disabled={isAddingGallery}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isAddingGallery ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Verifying...
                  </>
                ) : (
                  'Add Photo'
                )}
              </button>
            </div>

            {galleryImageError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{galleryImageError}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(websiteConfig.gallery_urls || []).map((url, idx) => (
              <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <SmartImage src={url} alt={`Gallery ${idx + 1}`} className="w-full h-32 object-cover" />
                <button
                  onClick={() => handleRemoveGalleryImage(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: CONTACT */}
      {activeSubTab === 'contact' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-blue-400" /> Contact & Location Info
          </h4>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Physical Address</label>
              <textarea
                rows={2}
                value={contactForm.address}
                onChange={e => setContactForm({ ...contactForm, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Google Maps Location Embed / Link URL</label>
              <input
                type="text"
                value={contactForm.google_map_embed_url}
                onChange={e => setContactForm({ ...contactForm, google_map_embed_url: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Table Booking / Inquiry Instructions</label>
              <textarea
                rows={2}
                value={contactForm.booking_info}
                onChange={e => setContactForm({ ...contactForm, booking_info: e.target.value })}
                placeholder="For group bookings, call us 2 hours prior or message on WhatsApp."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSaveContact}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" /> Save Contact Information
          </button>
        </div>
      )}

      {/* SUBTAB 7: BUSINESS INFORMATION */}
      {activeSubTab === 'business' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" /> Business Registration & Tax Info
          </h4>
          <p className="text-xs text-slate-400">Optional GST and FSSAI information. Only displayed publicly if configured.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">GST Number (Optional)</label>
              <input
                type="text"
                value={businessForm.gst}
                onChange={e => setBusinessForm({ ...businessForm, gst: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white uppercase font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">FSSAI Registration Number (Optional)</label>
              <input
                type="text"
                value={businessForm.fssai}
                onChange={e => setBusinessForm({ ...businessForm, fssai: e.target.value })}
                placeholder="10019000000000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={businessForm.city}
                onChange={e => setBusinessForm({ ...businessForm, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">State & Pincode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={businessForm.state}
                  onChange={e => setBusinessForm({ ...businessForm, state: e.target.value })}
                  placeholder="State"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
                <input
                  type="text"
                  value={businessForm.pincode}
                  onChange={e => setBusinessForm({ ...businessForm, pincode: e.target.value })}
                  placeholder="Pincode"
                  className="w-28 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveBusiness}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" /> Save Business Information
          </button>
        </div>
      )}

      {/* SUBTAB 8: LEGAL PAGES */}
      {activeSubTab === 'legal' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Restaurant Legal & Customer Policies
          </h4>
          <p className="text-xs text-slate-400">Maintain custom, restaurant-specific legal policies. These are completely separate from DigiMoms SaaS policies.</p>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Privacy Policy</label>
              <textarea
                rows={3}
                value={legalForm.privacy_policy}
                onChange={e => setLegalForm({ ...legalForm, privacy_policy: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={legalForm.terms_conditions}
                onChange={e => setLegalForm({ ...legalForm, terms_conditions: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Refund & Cancellation Policy</label>
              <textarea
                rows={3}
                value={legalForm.refund_policy}
                onChange={e => setLegalForm({ ...legalForm, refund_policy: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Shipping & Delivery Policy</label>
              <textarea
                rows={3}
                value={legalForm.shipping_policy}
                onChange={e => setLegalForm({ ...legalForm, shipping_policy: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Grievance / Nodal Contact Info</label>
              <textarea
                rows={2}
                value={legalForm.grievance_contact}
                onChange={e => setLegalForm({ ...legalForm, grievance_contact: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed"
              />
            </div>
          </div>

          <button
            onClick={handleSaveLegal}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" /> Save Legal Policies
          </button>
        </div>
      )}

      {/* SUBTAB 9: SOCIAL LINKS */}
      {activeSubTab === 'social' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-400" /> Social Media Channels
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Instagram URL</label>
              <input
                type="text"
                value={socialForm.instagram}
                onChange={e => setSocialForm({ ...socialForm, instagram: e.target.value })}
                placeholder="https://instagram.com/yourrestaurant"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Facebook URL</label>
              <input
                type="text"
                value={socialForm.facebook}
                onChange={e => setSocialForm({ ...socialForm, facebook: e.target.value })}
                placeholder="https://facebook.com/yourrestaurant"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">YouTube URL</label>
              <input
                type="text"
                value={socialForm.youtube}
                onChange={e => setSocialForm({ ...socialForm, youtube: e.target.value })}
                placeholder="https://youtube.com/@yourrestaurant"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Google Business Listing URL</label>
              <input
                type="text"
                value={socialForm.google_business}
                onChange={e => setSocialForm({ ...socialForm, google_business: e.target.value })}
                placeholder="https://g.page/yourrestaurant"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSocial}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" /> Save Social Media Links
          </button>
        </div>
      )}

      {/* SUBTAB 10: SEO SETTINGS */}
      {activeSubTab === 'seo' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" /> Search Engine Optimization (SEO)
          </h4>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Page Meta Title</label>
              <input
                type="text"
                value={seoForm.seo_title}
                onChange={e => setSeoForm({ ...seoForm, seo_title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Page Meta Description</label>
              <textarea
                rows={3}
                value={seoForm.seo_description}
                onChange={e => setSeoForm({ ...seoForm, seo_description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Meta Keywords (Comma separated)</label>
              <input
                type="text"
                value={seoForm.seo_keywords}
                onChange={e => setSeoForm({ ...seoForm, seo_keywords: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSeo}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" /> Save SEO Settings
          </button>
        </div>
      )}

      {/* SERVICE MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Party Hall & Celebrations"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="AC party hall for up to 100 guests with sound system."
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={serviceForm.duration}
                    onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    placeholder="e.g. 4 Hours"
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Image URL
                  <span className="text-[10px] text-slate-400 block font-normal">(Google Drive, Supabase, CDN, or direct URL)</span>
                </label>
                <input
                  type="text"
                  value={serviceForm.image}
                  onChange={e => {
                    setServiceImageError(null);
                    setServiceForm({ ...serviceForm, image: e.target.value });
                  }}
                  placeholder="Paste Image URL (e.g. Google Drive, Supabase, CDN...)"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
                {serviceForm.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <SmartImage src={serviceForm.image} alt="Service Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                    <span className="text-[10px] text-slate-400">Live Preview</span>
                  </div>
                )}
              </div>

              {serviceImageError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{serviceImageError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="srv_active"
                  checked={serviceForm.is_active}
                  onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600"
                />
                <label htmlFor="srv_active" className="text-slate-300 font-bold">Active / Visible on Website</label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setServiceImageError(null);
                    setShowServiceModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingService ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Verifying...
                    </>
                  ) : (
                    'Save Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRICING MODAL */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">{editingPricingId ? 'Edit Pricing Item' : 'Add Pricing Item'}</h3>

            <form onSubmit={handleSavePricing} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Service / Package Name</label>
                <input
                  type="text"
                  required
                  value={pricingForm.service_name}
                  onChange={e => setPricingForm({ ...pricingForm, service_name: e.target.value })}
                  placeholder="e.g. Birthday Party Package"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={pricingForm.price}
                    onChange={e => setPricingForm({ ...pricingForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Offer Price (₹)</label>
                  <input
                    type="number"
                    value={pricingForm.offer_price}
                    onChange={e => setPricingForm({ ...pricingForm, offer_price: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={pricingForm.unit}
                    onChange={e => setPricingForm({ ...pricingForm, unit: e.target.value })}
                    placeholder="per plate"
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={pricingForm.description}
                  onChange={e => setPricingForm({ ...pricingForm, description: e.target.value })}
                  placeholder="Includes 3 starters, 2 main courses, and dessert."
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_price_chk"
                    checked={pricingForm.show_price}
                    onChange={e => setPricingForm({ ...pricingForm, show_price: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-600"
                  />
                  <label htmlFor="show_price_chk" className="text-slate-300 font-bold">Display exact price publicly (show_price = true)</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prc_active"
                    checked={pricingForm.is_active}
                    onChange={e => setPricingForm({ ...pricingForm, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600"
                  />
                  <label htmlFor="prc_active" className="text-slate-300 font-bold">Active Item</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Pricing Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
