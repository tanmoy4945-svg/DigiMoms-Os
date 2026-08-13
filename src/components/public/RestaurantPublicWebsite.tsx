import React, { useState, useEffect } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { SmartImage } from '../common/SmartImage';
import { supabase } from '../../lib/supabase';
import {
  Restaurant, MenuItem, MenuCategory, Table,
  RestaurantWebsiteSettings, RestaurantServiceItem,
  RestaurantPricingItem, RestaurantLegalPages, RestaurantSocialLinks
} from '../../types';
import {
  QrCode, MapPin, Clock, ShieldCheck, Utensils, Star, Phone, Search,
  MessageCircle, Mail, ExternalLink, Calendar, CheckCircle2, ChevronRight,
  Info, Sparkles, Building2, Globe, FileText, Loader2, AlertCircle,
  UserCheck, ChefHat, Lock
} from 'lucide-react';

export const RestaurantPublicWebsite: React.FC = () => {
  const { activeSlug, setActiveView, setActiveShortCode } = useSaaS();

  // Route slug resolution - strictly from activeSlug or window.location.pathname
  const pathSlug = typeof window !== 'undefined'
    ? window.location.pathname.split('/r/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0]
    : '';
  const targetSlug = (activeSlug || pathSlug || '').trim().toLowerCase();

  // Sub-page tab state
  const [activeTab, setActiveTab] = useState<'menu' | 'about' | 'services' | 'contact' | 'privacy-policy' | 'terms' | 'refund-cancellation' | 'shipping-delivery' | 'cookie-policy'>('menu');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Independent Async Supabase Load state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restMenu, setRestMenu] = useState<MenuItem[]>([]);
  const [restCategories, setRestCategories] = useState<MenuCategory[]>([]);
  const [restTable, setRestTable] = useState<Table | null>(null);
  const [webSettings, setWebSettings] = useState<RestaurantWebsiteSettings | null>(null);
  const [legalSettings, setLegalSettings] = useState<RestaurantLegalPages | null>(null);
  const [socialSettings, setSocialSettings] = useState<RestaurantSocialLinks | null>(null);
  const [servicesList, setServicesList] = useState<RestaurantServiceItem[]>([]);
  const [pricingList, setPricingList] = useState<RestaurantPricingItem[]>([]);

  useEffect(() => {
    // Parse tab from current subpath e.g. /r/slug/privacy-policy
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/privacy-policy')) setActiveTab('privacy-policy');
    else if (path.includes('/terms')) setActiveTab('terms');
    else if (path.includes('/refund-cancellation')) setActiveTab('refund-cancellation');
    else if (path.includes('/shipping-delivery')) setActiveTab('shipping-delivery');
    else if (path.includes('/contact')) setActiveTab('contact');
    else if (path.includes('/about')) setActiveTab('about');
    else if (path.includes('/services')) setActiveTab('services');
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchRestaurantFromSupabase = async () => {
      if (!targetSlug) {
        if (isMounted) {
          setRestaurant(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        // 1. STRICT Supabase query using slug
        const { data: rest, error: restErr } = await supabase
          .from('restaurants')
          .select('*')
          .ilike('slug', targetSlug)
          .maybeSingle();

        if (restErr) {
          console.error("Supabase restaurant query error:", restErr);
        }

        if (!rest) {
          if (isMounted) {
            setRestaurant(null);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setRestaurant(rest as Restaurant);
        }

        // 2. Fetch associated menus, categories, and table for QR ordering
        const [{ data: menuData }, { data: catData }, { data: tableData }] = await Promise.all([
          supabase.from('menus').select('*').eq('restaurant_id', rest.id).order('sort_order', { ascending: true }),
          supabase.from('menu_categories').select('*').eq('restaurant_id', rest.id).order('sort_order', { ascending: true }),
          supabase.from('tables').select('*').eq('restaurant_id', rest.id).limit(1)
        ]);

        if (isMounted) {
          if (menuData) {
            const mapped: MenuItem[] = menuData.map((m: any) => ({
              id: m.id,
              restaurant_id: m.restaurant_id,
              category_id: m.category_id,
              name: m.name,
              description: m.description || '',
              price: Number(m.price),
              image_url: m.image_url || '',
              prep_time: m.prep_time || 15,
              is_veg: m.is_veg ?? true,
              is_available: m.is_available ?? true,
              is_popular: m.is_popular ?? false,
              is_recommended: m.is_recommended ?? false,
              spicy_level: m.spicy_level || 0,
              sort_order: m.sort_order || 1
            }));
            setRestMenu(mapped.filter(m => m.is_available));
          }

          if (catData) setRestCategories(catData.filter((c: any) => !c.is_hidden) as MenuCategory[]);
          if (tableData && tableData.length > 0) setRestTable(tableData[0] as Table);
        }

        // 3. Fetch website configuration tables if present
        try {
          const { data: webData } = await supabase.from('restaurant_website_settings').select('*').eq('restaurant_id', rest.id).maybeSingle();
          if (webData && isMounted) setWebSettings(webData as RestaurantWebsiteSettings);
          else if (isMounted) {
            setWebSettings({
              id: crypto.randomUUID(),
              restaurant_id: rest.id,
              about_us: rest.about_us || `Welcome to ${rest.name}! We serve delicious culinary creations prepared with fresh, high-quality ingredients. Experience great food and friendly hospitality with us.`,
              description: rest.short_description || `Official website and digital menu of ${rest.name}.`,
              opening_time: '10:00 AM',
              closing_time: '10:00 PM',
              weekly_closed_day: 'None',
              phone: rest.contact_mobile || rest.owner_mobile,
              whatsapp: rest.owner_mobile,
              email: rest.contact_email || '',
              google_map_embed_url: rest.maps_location_url || '',
              gallery_urls: [rest.banner, rest.logo].filter(Boolean) as string[],
              seo_title: rest.name,
              seo_description: `Official website of ${rest.name}. View menu, explore services, and order online.`,
              seo_keywords: `${rest.name}, restaurant, fine dining, online order, menu`,
              booking_info: 'Call or WhatsApp us for table reservations.',
              website_url: `/r/${rest.slug}`
            });
          }
        } catch { /* Table might not exist */ }

        try {
          const { data: legData } = await supabase.from('restaurant_legal_pages').select('*').eq('restaurant_id', rest.id).maybeSingle();
          if (legData && isMounted) setLegalSettings(legData as RestaurantLegalPages);
          else if (isMounted) {
            setLegalSettings({
              id: crypto.randomUUID(),
              restaurant_id: rest.id,
              privacy_policy: `Privacy Policy for ${rest.name}: We respect customer privacy and protect your contact and order data.`,
              terms_conditions: `Terms & Conditions for ${rest.name}: All dining and takeaway orders are subject to availability and house rules.`,
              refund_policy: `Refund Policy for ${rest.name}: Refunds for cancelled orders or payment disputes are processed within 3-5 business days upon management approval.`,
              cancellation_policy: `Cancellation Policy: Orders can be cancelled prior to kitchen preparation.`,
              shipping_policy: `Delivery Policy for ${rest.name}: Local doorstep food delivery within 5 km radius.`,
              return_policy: `Return Policy: Food items are non-returnable once delivered and accepted.`,
              grievance_contact: `For complaints or queries, contact restaurant management at ${rest.owner_mobile}.`,
              disclaimer: `Prices and taxes subject to government regulatory policies.`
            });
          }
        } catch { /* Table might not exist */ }

        try {
          const { data: socData } = await supabase.from('restaurant_social_links').select('*').eq('restaurant_id', rest.id).maybeSingle();
          if (socData && isMounted) setSocialSettings(socData as RestaurantSocialLinks);
        } catch { /* Table might not exist */ }

        try {
          const { data: srvData } = await supabase.from('restaurant_services').select('*').eq('restaurant_id', rest.id).order('sort_order', { ascending: true });
          if (srvData && srvData.length > 0 && isMounted) setServicesList(srvData as RestaurantServiceItem[]);
          else if (isMounted) {
            setServicesList([
              { id: crypto.randomUUID(), restaurant_id: rest.id, name: 'Dine-In Comfort', description: 'Enjoy our comfortable seating and full table service.', price: 0, image: '', duration: '', availability: 'Daily', sort_order: 1, is_active: true },
              { id: crypto.randomUUID(), restaurant_id: rest.id, name: 'QR Table Ordering', description: 'Instant contactless menu and ordering at your table.', price: 0, image: '', duration: '', availability: 'Daily', sort_order: 2, is_active: true },
              { id: crypto.randomUUID(), restaurant_id: rest.id, name: 'Takeaway & Parcel', description: 'Fast takeaway pickup for busy schedules.', price: 0, image: '', duration: '', availability: 'Daily', sort_order: 3, is_active: true }
            ]);
          }
        } catch { /* Table might not exist */ }

        try {
          const { data: prcData } = await supabase.from('restaurant_pricing').select('*').eq('restaurant_id', rest.id);
          if (prcData && isMounted) setPricingList(prcData as RestaurantPricingItem[]);
        } catch { /* Table might not exist */ }

      } catch (err) {
        console.error("Error fetching restaurant website:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRestaurantFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [targetSlug]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4 mx-auto" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">Loading restaurant website...</p>
      </div>
    );
  }

  // Strict 404 - Slug Not Found
  if (!restaurant) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto text-2xl font-bold">
            ?
          </div>
          <h2 className="text-2xl font-black text-white">Restaurant Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The requested restaurant slug <span className="font-mono text-blue-400">/r/{targetSlug || 'unknown'}</span> does not exist or has been removed.
          </p>
          <div className="pt-2">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
            >
              Return to DigiMoms Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredMenu = restMenu.filter(item => {
    const matchesCat = selectedCat === 'all' || item.category_id === selectedCat;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const launchCustomerQr = () => {
    if (restTable) {
      setActiveShortCode(restTable.short_code);
    }
    setActiveView('customer-qr');
  };

  const SERVICE_LABELS: Record<string, { title: string; desc: string; icon: any }> = {
    dine_in: { title: 'Dine-in Service', desc: 'Comfortable seated dining with table service', icon: Utensils },
    table_ordering: { title: 'QR Table Ordering', desc: 'Scan permanent table QR code to view menu & place instant orders', icon: QrCode },
    takeaway: { title: 'Takeaway & Parcel', desc: 'Quick parcel pickup at our dedicated takeaway counter', icon: Building2 },
    delivery: { title: 'Home Delivery', desc: 'Fast doorstep delivery across city limits', icon: Globe },
    catering: { title: 'Event Catering', desc: 'Custom outdoor & indoor catering menus for special occasions', icon: Sparkles },
    party_booking: { title: 'Party Hall & Celebrations', desc: 'Private dining space for birthdays, anniversaries & corporate parties', icon: Calendar },
    reservation: { title: 'Table Reservation', desc: 'Reserve your favorite table in advance by call or WhatsApp', icon: Phone }
  };

  const enabledServices = restaurant.enabled_services && restaurant.enabled_services.length > 0
    ? restaurant.enabled_services
    : ['dine_in', 'table_ordering', 'takeaway', 'delivery', 'reservation'];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between">
      <div className="space-y-8 pb-12">
        {/* Top Restaurant Header Bar */}
        <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Restaurant Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('menu')}>
              {restaurant.logo ? (
                <SmartImage
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black text-lg">
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">{restaurant.name}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    {webSettings?.weekly_closed_day && webSettings.weekly_closed_day !== 'None'
                      ? `OPEN • ${webSettings.weekly_closed_day} Closed`
                      : 'OPEN TODAY'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block line-clamp-1">
                  {restaurant.city ? `${restaurant.city} • ` : ''}{restaurant.short_description || webSettings?.description || 'Authentic dining experience'}
                </p>
              </div>
            </div>

            {/* Header Navigation & Portal Logins */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'menu' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'about' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'services' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Services
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'contact' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Contact
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              {/* OWNER LOGIN BUTTON */}
              <button
                onClick={() => setActiveView('owner-login')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold flex items-center gap-1.5 transition-all"
                title="Restaurant Owner Login"
              >
                <UserCheck className="w-3.5 h-3.5" /> OWNER LOGIN
              </button>

              {/* WORKER LOGIN BUTTON */}
              <button
                onClick={() => setActiveView('staff-login')}
                className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold flex items-center gap-1.5 transition-all"
                title="Restaurant Staff / Worker Login"
              >
                <ChefHat className="w-3.5 h-3.5" /> WORKER LOGIN
              </button>
            </div>
          </div>
        </header>

        {/* Top Banner & Profile Header */}
        <div className="relative w-full bg-slate-900 border-b border-slate-800">
          <div className="h-56 sm:h-72 w-full overflow-hidden relative">
            <SmartImage
              src={restaurant.banner || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'}
              alt={restaurant.name}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-4 lg:px-8 relative -mt-20 pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                <SmartImage
                  src={restaurant.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200'}
                  alt={restaurant.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-slate-950 bg-slate-900 shadow-2xl object-cover shrink-0"
                />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{restaurant.name}</h1>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                      {webSettings?.weekly_closed_day && webSettings.weekly_closed_day !== 'None'
                        ? `OPEN • ${webSettings.weekly_closed_day} Closed`
                        : 'OPEN TODAY'}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                    {restaurant.short_description || webSettings?.description || 'Authentic restaurant & dining experience'}
                  </p>

                  <p className="text-slate-400 text-xs flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {restaurant.address || 'Main Address'}{restaurant.city ? `, ${restaurant.city}` : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {restaurant.business_hours || `${webSettings?.opening_time || '10:00 AM'} - ${webSettings?.closing_time || '10:00 PM'}`}
                    </span>
                  </p>

                  {/* Show GST and FSSAI ONLY if provided */}
                  {(restaurant.gst || restaurant.fssai) && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-mono text-slate-400 pt-1">
                      {restaurant.gst && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          GSTIN: <strong className="text-white">{restaurant.gst}</strong>
                        </span>
                      )}
                      {restaurant.fssai && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          FSSAI Lic: <strong className="text-white">{restaurant.fssai}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
                {(restaurant.contact_mobile || webSettings?.phone) && (
                  <a
                    href={`tel:${restaurant.contact_mobile || webSettings?.phone}`}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" /> Call Now
                  </a>
                )}

                {(restaurant.whatsapp_number || webSettings?.whatsapp) && (
                  <a
                    href={`https://wa.me/${(restaurant.whatsapp_number || webSettings?.whatsapp || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold border border-emerald-500/30 flex items-center gap-2 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                )}

                <button
                  onClick={launchCustomerQr}
                  className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <QrCode className="w-4 h-4 text-blue-200" /> Scan Table QR / Order Food
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-[60px] z-30">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center gap-2 overflow-x-auto custom-scrollbar py-3">
              {[
                { key: 'menu', label: 'Menu & Dishes', icon: Utensils },
                { key: 'about', label: 'About Us', icon: Info },
                { key: 'services', label: 'Services', icon: Sparkles },
                { key: 'contact', label: 'Contact & Location', icon: Phone },
                { key: 'privacy-policy', label: 'Privacy Policy', icon: FileText },
                { key: 'terms', label: 'Terms & Conditions', icon: FileText },
                { key: 'refund-cancellation', label: 'Refund Policy', icon: FileText },
                { key: 'shipping-delivery', label: 'Delivery Policy', icon: FileText },
                { key: 'cookie-policy', label: 'Cookie Policy', icon: FileText }
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      setActiveTab(t.key as any);
                      if (typeof window !== 'undefined') {
                        window.history.pushState({}, '', `/r/${restaurant.slug}/${t.key === 'menu' ? '' : t.key}`);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      activeTab === t.key
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-8">
        {/* VIEW 1: MENU & DISHES */}
        {activeTab === 'menu' && (
          <div className="space-y-6 animate-fade-in">
            {/* Search & Categories */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search dishes by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Displaying {filteredMenu.length} freshly prepared items
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setSelectedCat('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCat === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Dishes ({restMenu.length})
              </button>
              {restCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCat === cat.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenu.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex gap-4"
                >
                  <SmartImage
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'}
                    alt={item.name}
                    className="w-24 h-24 rounded-2xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-white text-sm leading-snug">{item.name}</span>
                        <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${item.is_veg ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'}`} />
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                      <div className="text-base font-black text-white">₹{item.price}</div>
                      <button
                        onClick={launchCustomerQr}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all"
                      >
                        Order At Table
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredMenu.length === 0 && (
                <div className="col-span-full p-8 text-center bg-slate-900/50 border border-slate-800 rounded-3xl text-slate-400 text-xs">
                  No menu items found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: ABOUT US */}
        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-400" /> About {restaurant.name}
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {webSettings?.about_us || restaurant.about_us || restaurant.short_description || `${restaurant.name} is dedicated to serving top-quality culinary dishes with fresh ingredients and extraordinary taste.`}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-semibold">Operating Hours</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" /> {restaurant.business_hours || `${webSettings?.opening_time || '10:00 AM'} - ${webSettings?.closing_time || '10:00 PM'}`}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-semibold">Weekly Closing</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-400" /> {webSettings?.weekly_closed_day || restaurant.weekly_closing_day || 'Open 7 Days'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SERVICES */}
        {activeTab === 'services' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white">Services Offered</h2>
              <p className="text-xs text-slate-400">Services provided at {restaurant.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {servicesList.length > 0 ? (
                servicesList.map(srv => (
                  <div key={srv.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{srv.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{srv.description}</p>
                      {srv.price > 0 && (
                        <div className="text-xs font-bold text-blue-400 mt-2">Starting from ₹{srv.price}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                enabledServices.map(serviceKey => {
                  const srv = SERVICE_LABELS[serviceKey] || { title: serviceKey, desc: 'Available service', icon: Utensils };
                  const Icon = srv.icon;
                  return (
                    <div key={serviceKey} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{srv.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{srv.desc}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: CONTACT & LOCATION */}
        {activeTab === 'contact' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Phone className="w-6 h-6 text-emerald-400" /> Contact & Location Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 block font-semibold">Address</span>
                    <p className="text-sm font-medium text-white leading-relaxed">
                      {restaurant.address || 'Address Details'}{restaurant.city ? `, ${restaurant.city}` : ''}{restaurant.state ? `, ${restaurant.state}` : ''} {restaurant.pincode || ''}
                    </p>
                  </div>

                  {(restaurant.contact_mobile || webSettings?.phone) && (
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 block font-semibold">Phone Number</span>
                      <a href={`tel:${restaurant.contact_mobile || webSettings?.phone}`} className="text-sm font-bold text-blue-400 hover:underline flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {restaurant.contact_mobile || webSettings?.phone}
                      </a>
                    </div>
                  )}

                  {(restaurant.whatsapp_number || webSettings?.whatsapp) && (
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 block font-semibold">WhatsApp Chat</span>
                      <a
                        href={`https://wa.me/${(restaurant.whatsapp_number || webSettings?.whatsapp || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-emerald-400 hover:underline flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" /> Chat on WhatsApp (+{restaurant.whatsapp_number || webSettings?.whatsapp})
                      </a>
                    </div>
                  )}

                  {(restaurant.contact_email || webSettings?.email) && (
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 block font-semibold">Email</span>
                      <a href={`mailto:${restaurant.contact_email || webSettings?.email}`} className="text-sm font-bold text-purple-400 hover:underline flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {restaurant.contact_email || webSettings?.email}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" /> Google Maps Directions
                  </h3>
                  {(restaurant.maps_location_url || webSettings?.google_map_embed_url) ? (
                    <a
                      href={restaurant.maps_location_url || webSettings?.google_map_embed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                    >
                      <ExternalLink className="w-4 h-4" /> Open Directions on Google Maps
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Located at {restaurant.address || 'our address'}. Contact restaurant directly for exact map directions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEGAL VIEWS: PRIVACY / TERMS / REFUND / DELIVERY / COOKIE */}
        {['privacy-policy', 'terms', 'refund-cancellation', 'shipping-delivery', 'cookie-policy'].includes(activeTab) && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
              <h2 className="text-2xl font-black text-white capitalize">
                {activeTab.replace('-', ' ')}
              </h2>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line">
                {activeTab === 'privacy-policy' && (legalSettings?.privacy_policy || restaurant.privacy_policy || `Privacy Policy for ${restaurant.name}: We respect customer privacy and protect your contact and order data.`)}
                {activeTab === 'terms' && (legalSettings?.terms_conditions || restaurant.terms_conditions || `Terms & Conditions for ${restaurant.name}: All dining and takeaway orders are subject to availability and house rules.`)}
                {activeTab === 'refund-cancellation' && (legalSettings?.refund_policy || restaurant.refund_cancellation_policy || `Refund & Cancellation Policy for ${restaurant.name}: Refunds for cancelled orders or payment disputes are processed upon management approval.`)}
                {activeTab === 'shipping-delivery' && (legalSettings?.shipping_policy || restaurant.shipping_delivery_policy || `Delivery Policy for ${restaurant.name}: Local doorstep food delivery and takeaway pickup guidelines.`)}
                {activeTab === 'cookie-policy' && (legalSettings?.disclaimer || `Cookie Policy for ${restaurant.name}: We use essential cookies to maintain browsing preferences and active order status.`)}
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-2">
                <span>This legal policy is issued by <strong className="text-slate-200">{restaurant.name}</strong> ({restaurant.owner_name}).</span>
                {restaurant.gst && <span className="font-mono text-slate-300">GSTIN: {restaurant.gst}</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Restaurant Dedicated Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800 mt-16 pt-12 pb-8 w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
            {/* Col 1: Restaurant Brand & Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {restaurant.logo ? (
                  <SmartImage src={restaurant.logo} alt={restaurant.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black">
                    {restaurant.name.charAt(0)}
                  </div>
                )}
                <span className="font-extrabold text-white text-base">{restaurant.name}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {webSettings?.description || restaurant.short_description || `Official website of ${restaurant.name}. Serving delicious culinary creations.`}
              </p>

              {/* Show GST and FSSAI ONLY if provided */}
              {(restaurant.gst || restaurant.fssai) && (
                <div className="space-y-1 font-mono text-[11px] text-slate-400 pt-1">
                  {restaurant.gst && <div>GSTIN: <span className="text-white font-bold">{restaurant.gst}</span></div>}
                  {restaurant.fssai && <div>FSSAI Lic: <span className="text-white font-bold">{restaurant.fssai}</span></div>}
                </div>
              )}
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button onClick={() => setActiveTab('menu')} className="hover:text-white transition-colors">Menu & Dishes</button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('about')} className="hover:text-white transition-colors">About Us</button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('services')} className="hover:text-white transition-colors">Services Offered</button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('contact')} className="hover:text-white transition-colors">Contact & Location</button>
                </li>
                <li>
                  <button onClick={launchCustomerQr} className="hover:text-blue-400 transition-colors flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Scan Table QR
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal Policies */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Legal Policies</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button onClick={() => setActiveTab('privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('terms')} className="hover:text-white transition-colors">Terms & Conditions</button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('refund-cancellation')} className="hover:text-white transition-colors">Refund & Cancellation</button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('shipping-delivery')} className="hover:text-white transition-colors">Delivery Policy</button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('cookie-policy')} className="hover:text-white transition-colors">Cookie Policy</button>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact & Staff Portals */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Contact & Staff</h4>
              <div className="space-y-2 text-slate-400">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {restaurant.address || 'Address Details'}</p>
                {(restaurant.contact_mobile || webSettings?.phone) && (
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {restaurant.contact_mobile || webSettings?.phone}</p>
                )}
                {(restaurant.contact_email || webSettings?.email) && (
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {restaurant.contact_email || webSettings?.email}</p>
                )}
                <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {restaurant.business_hours || `${webSettings?.opening_time || '10:00 AM'} - ${webSettings?.closing_time || '10:00 PM'}`}</p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveView('owner-login')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1"
                >
                  <UserCheck className="w-3 h-3 text-emerald-400" /> Owner Login
                </button>
                <button
                  onClick={() => setActiveView('staff-login')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1"
                >
                  <ChefHat className="w-3 h-3 text-amber-400" /> Worker Login
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} <strong className="text-white">{restaurant.name}</strong>. All Rights Reserved.
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>Powered by</span>
              <strong className="text-slate-200">DigiMoms</strong>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
