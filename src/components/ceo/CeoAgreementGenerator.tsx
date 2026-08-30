import React, { useState, useEffect, useRef } from 'react';
import { Restaurant } from '../../types';
import { generateRestaurantAgreementPdf, AgreementData, AgreementLanguage } from '../../utils/agreementPdfGenerator';
import { DIGIMOMS_OFFICIAL } from '../../config/officialDetails';
import { useSaaS } from '../../context/SaaSContext';
import {
  FileText, Download, Building2, User, Phone, MapPin,
  Calendar, DollarSign, Sparkles, CheckCircle2, Shield, Info, Edit3, Globe, Languages, Save, Loader2
} from 'lucide-react';

interface CeoAgreementGeneratorProps {
  restaurants: Restaurant[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CeoAgreementGenerator: React.FC<CeoAgreementGeneratorProps> = ({ restaurants, showToast }) => {
  const { updateRestaurant } = useSaaS();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(
    restaurants.length > 0 ? restaurants[0].id : ''
  );

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId) || restaurants[0] || null;

  // Language state: 'en' (English) or 'bn' (বাংলা)
  const [agreementLanguage, setAgreementLanguage] = useState<AgreementLanguage>('en');

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientOwner, setClientOwner] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(999);
  const [trialPeriodText, setTrialPeriodText] = useState('15 Days Free Trial');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [specialNotes, setSpecialNotes] = useState(
    'Complimentary onboarding & live menu setup included. Unlimited QR table scans and Kitchen Display System terminals.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingTerms, setIsSavingTerms] = useState(false);

  // Track the last initialized restaurant ID so user modifications are never overwritten on background re-renders
  const lastLoadedRestaurantIdRef = useRef<string | null>(null);

  // Sync with selected restaurant only when the selection actually changes
  useEffect(() => {
    if (selectedRestaurant && selectedRestaurant.id !== lastLoadedRestaurantIdRef.current) {
      lastLoadedRestaurantIdRef.current = selectedRestaurant.id;
      setClientName(selectedRestaurant.name || '');
      setClientOwner(selectedRestaurant.owner_name || '');
      setClientAddress(selectedRestaurant.address || '');
      setClientMobile(selectedRestaurant.owner_mobile || selectedRestaurant.contact_mobile || '');
      setMonthlyAmount(selectedRestaurant.subscription_amount || 999);
      
      const trialDays = selectedRestaurant.trial_days || 15;
      setTrialPeriodText(agreementLanguage === 'bn' ? `${trialDays} দিনের ফ্রি সার্ভিস (ট্রায়াল)` : `${trialDays} Days Free Service`);
      
      // Calculate start and end cleanly
      let startStr = new Date().toISOString().split('T')[0];
      if (selectedRestaurant.trial_start) {
        const parsedStart = new Date(selectedRestaurant.trial_start);
        if (!isNaN(parsedStart.getTime())) {
          startStr = parsedStart.toISOString().split('T')[0];
        }
      }
      setStartDate(startStr);

      if (selectedRestaurant.trial_end) {
        const parsedEnd = new Date(selectedRestaurant.trial_end);
        if (!isNaN(parsedEnd.getTime())) {
          setEndDate(parsedEnd.toISOString().split('T')[0]);
        } else {
          const d = new Date(startStr);
          d.setDate(d.getDate() + trialDays);
          setEndDate(d.toISOString().split('T')[0]);
        }
      } else {
        const d = new Date(startStr);
        d.setDate(d.getDate() + trialDays);
        setEndDate(d.toISOString().split('T')[0]);
      }
    }
  }, [selectedRestaurantId, selectedRestaurant]);

  // Handle saving modified terms back to the restaurant record
  const handleSaveTermsToRestaurant = async () => {
    if (!selectedRestaurant) return;
    try {
      setIsSavingTerms(true);
      const updates: Partial<Restaurant> = {
        name: clientName.trim() || selectedRestaurant.name,
        owner_name: clientOwner.trim() || selectedRestaurant.owner_name,
        address: clientAddress.trim() || selectedRestaurant.address,
        owner_mobile: clientMobile.trim() || selectedRestaurant.owner_mobile,
        monthly_subscription_fee: Number(monthlyAmount) || 999,
        trial_start: new Date(startDate).toISOString(),
        trial_end: new Date(endDate).toISOString()
      };
      await updateRestaurant(selectedRestaurant.id, updates);
      if (showToast) {
        showToast('Agreement terms & subscription dates saved to restaurant profile!', 'success');
      }
    } catch (err: any) {
      console.error('Failed to save agreement terms to restaurant:', err);
      if (showToast) {
        showToast(err.message || 'Failed to save terms', 'error');
      }
    } finally {
      setIsSavingTerms(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedRestaurant) {
      if (showToast) showToast('Please select a restaurant first', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      const agreementNumber = `AGR-DGM-${new Date().getFullYear()}-${selectedRestaurant.slug.toUpperCase().slice(0, 8)}`;
      const agreementDate = new Date().toLocaleDateString(agreementLanguage === 'bn' ? 'bn-IN' : 'en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const agreementData: AgreementData = {
        restaurant: selectedRestaurant,
        language: agreementLanguage,
        providerName: DIGIMOMS_OFFICIAL.companyName,
        subCompany: DIGIMOMS_OFFICIAL.subCompany,
        providerOwner: DIGIMOMS_OFFICIAL.ownerName,
        providerEmail: DIGIMOMS_OFFICIAL.email,
        providerPhone: DIGIMOMS_OFFICIAL.phone,
        providerAddress: DIGIMOMS_OFFICIAL.location,
        providerWebsites: DIGIMOMS_OFFICIAL.websites.join(' | '),
        clientName: clientName || selectedRestaurant.name,
        clientOwner: clientOwner || selectedRestaurant.owner_name || 'Authorized Representative',
        clientAddress: clientAddress || selectedRestaurant.address || 'Registered Location',
        clientMobile: clientMobile || selectedRestaurant.owner_mobile || selectedRestaurant.contact_mobile || 'N/A',
        monthlyAmount: Number(monthlyAmount) || 999,
        trialPeriodText: trialPeriodText || (agreementLanguage === 'bn' ? '১৫ দিনের ফ্রি ট্রায়াল' : '15 Days Free Trial'),
        startDate,
        endDate,
        agreementDate,
        specialNotes,
        agreementNumber
      };

      await generateRestaurantAgreementPdf(agreementData);

      if (showToast) {
        showToast(
          agreementLanguage === 'bn' 
            ? 'চুক্তিপত্র (বাংলা PDF) সফলভাবে ডাউনলোড হয়েছে!' 
            : 'Agreement PDF (English) generated & downloaded successfully!', 
          'success'
        );
      }
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      if (showToast) {
        showToast(err.message || 'Failed to generate PDF agreement', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Restaurant Agreement PDF Generator
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Official SaaS Contract
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Generate legal client-side service agreements in English or বাংলা (Bengali) with custom trial & subscription terms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setAgreementLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                agreementLanguage === 'en'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> English
            </button>
            <button
              onClick={() => setAgreementLanguage('bn')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                agreementLanguage === 'bn'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Languages className="w-3.5 h-3.5" /> বাংলা
            </button>
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating || !selectedRestaurant}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Generating PDF...' : `Generate ${agreementLanguage === 'bn' ? 'বাংলা' : 'English'} PDF`}
          </button>
        </div>
      </div>

      {/* Official Details Overview Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">{DIGIMOMS_OFFICIAL.companyName}</span>
          <span className="text-slate-500">({DIGIMOMS_OFFICIAL.productName})</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
          <span>Owner: <strong className="text-slate-200">{DIGIMOMS_OFFICIAL.ownerName}</strong> ({DIGIMOMS_OFFICIAL.location})</span>
          <span>WhatsApp / Ph: <strong className="text-emerald-400 font-bold">{DIGIMOMS_OFFICIAL.phone}</strong></span>
          <span>Email: <strong className="text-slate-200">{DIGIMOMS_OFFICIAL.email}</strong></span>
          <span>Gateways: <strong className="text-purple-400">{DIGIMOMS_OFFICIAL.supportedGateways.join(', ')}</strong></span>
        </div>
      </div>

      {/* Info notice about client-side PDF generation */}
      <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-blue-200 text-xs flex items-center gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          <strong>Zero Storage / Client-Side Guarantee:</strong> The agreement PDF is generated entirely in your browser memory and downloaded directly. No PDF blob, file, or binary is stored in Supabase Storage or database tables.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-400" /> 1. Select Restaurant & Configure Terms
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                {restaurants.length} Registered Tenants
              </span>
            </div>
          </div>

          {/* Restaurant Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Select Restaurant</label>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.slug}) — Owner: {r.owner_name} ({r.owner_mobile})
                </option>
              ))}
            </select>
          </div>

          {/* Restaurant Details (Auto-loaded, editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Restaurant Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Royal Bengal Dine"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" /> Owner / Authorized Person
              </label>
              <input
                type="text"
                value={clientOwner}
                onChange={(e) => setClientOwner(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Contact Phone
              </label>
              <input
                type="text"
                value={clientMobile}
                onChange={(e) => setClientMobile(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Business Address
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="e.g. Park Street, Kolkata"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-4">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Financial & Subscription Terms
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Monthly Subscription Fee (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  placeholder="999"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Free Service / Trial Period Text
                </label>
                <input
                  type="text"
                  value={trialPeriodText}
                  onChange={(e) => setTrialPeriodText(e.target.value)}
                  placeholder="e.g. 15 Days Free Trial"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Free Service Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" /> Free Service End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Special Notes / Custom Contract Terms (Optional)
              </label>
              <textarea
                rows={3}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Enter any special discount notes, hardware terms, or custom onboarding provisions..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Want to persist these start/end dates to the restaurant's profile?
              </span>
              <button
                type="button"
                onClick={handleSaveTermsToRestaurant}
                disabled={isSavingTerms || !selectedRestaurant}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingTerms ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-purple-400" />
                )}
                {isSavingTerms ? 'Saving Terms...' : 'Save Terms to Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Live Document Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Agreement Summary
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30 uppercase">
                {agreementLanguage === 'bn' ? 'বাংলা ভার্সন' : 'English Version'}
              </span>
            </div>

            {/* Document Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-extrabold text-white text-xs">{DIGIMOMS_OFFICIAL.companyName}</span>
                <span className="text-[10px] text-amber-400 font-mono">AGR-DGM-{(selectedRestaurant?.slug || 'REST').toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Client Restaurant</span>
                  <strong className="text-white block truncate">{clientName || 'Select Restaurant'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Authorized Person</span>
                  <strong className="text-slate-300 block truncate">{clientOwner || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Contact</span>
                  <span className="text-slate-400 block">{clientMobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Address</span>
                  <span className="text-slate-400 block truncate">{clientAddress || 'Registered Location'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Trial Period:</span>
                  <strong className="text-amber-300 font-mono">{trialPeriodText}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Trial Dates:</span>
                  <span className="text-slate-300 font-mono text-[10px]">{startDate} → {endDate}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-800">
                  <span className="text-slate-400">Post-Trial Fee:</span>
                  <strong className="text-emerald-400 font-mono font-bold text-xs">₹{monthlyAmount} / Month</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Included Gateways</span>
                <div className="flex items-center gap-2 font-semibold text-purple-300">
                  <span>PayU</span> • <span>PhonePe</span> • <span>Razorpay</span>
                </div>
              </div>

              {specialNotes && (
                <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 italic">
                  "{specialNotes}"
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                <span>Signatures: DigiMoms OS & Client</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Ready to Download
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating || !selectedRestaurant}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating Agreement PDF...' : `Download Official Agreement PDF (${agreementLanguage === 'bn' ? 'বাংলা' : 'English'})`}
            </button>
            <p className="text-[10px] text-center text-slate-400">
              The PDF will be generated in the browser and saved directly to your Downloads folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
