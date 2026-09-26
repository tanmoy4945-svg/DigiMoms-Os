import React, { useState, useEffect } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { 
  QrCode, 
  Plus, 
  RotateCcw, 
  Download, 
  Eye, 
  X, 
  Sparkles, 
  Check, 
  Printer, 
  Image as ImageIcon, 
  FileText
} from 'lucide-react';
import { 
  downloadStandPng, 
  downloadStandPdf, 
  printStandDirectly, 
  renderStandToCanvas, 
  STAND_THEME 
} from '../../utils/qrPrintGenerator';
import { DIGIMOMS_OFFICIAL } from '../../config/officialDetails';

export const TableManagement: React.FC = () => {
  const { currentOwner, tables, addTable, clearTableSession, setActiveShortCode, setActiveView } = useSaaS();
  const [newTableName, setNewTableName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  // QR Preview Modal state
  const [qrModalTable, setQrModalTable] = useState<{
    number: string;
    code: string;
    url: string;
  } | null>(null);

  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  if (!currentOwner) return null;

  const restTables = tables.filter(t => t.restaurant_id === currentOwner.id);
  const restaurantContact = currentOwner.contact_mobile || currentOwner.owner_mobile || '9475388085';
  const restaurantWhatsApp = currentOwner.whatsapp_number || restaurantContact;

  const getStandOptions = (tableNum: string, shortCode: string) => ({
    restaurantName: currentOwner.name || 'DigiMoms Restaurant',
    tableNumber: tableNum,
    shortCode,
    restaurantContact,
    whatsappNumber: restaurantWhatsApp,
    address: currentOwner.address || undefined
  });

  // Re-generate live canvas preview whenever modal opens
  useEffect(() => {
    if (!qrModalTable) {
      setPreviewDataUrl(null);
      return;
    }

    let isMounted = true;
    setIsPreviewLoading(true);

    const generatePreview = async () => {
      try {
        const options = getStandOptions(qrModalTable.number, qrModalTable.code);
        const canvas = await renderStandToCanvas(options);
        if (isMounted) {
          setPreviewDataUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Failed to generate stand preview:', err);
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    };

    generatePreview();

    return () => {
      isMounted = false;
    };
  }, [qrModalTable]);

  const showFeedback = (msg: string) => {
    setDownloadFeedback(msg);
    setTimeout(() => setDownloadFeedback(null), 4000);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTableName.trim()) {
      addTable(newTableName.trim());
      setNewTableName('');
      setShowAddModal(false);
    }
  };

  // 1. Download as High-Resolution PNG (Instant file in Downloads folder)
  const handleDownloadPng = async (tableNum: string, shortCode: string) => {
    setIsDownloading(true);
    try {
      const options = getStandOptions(tableNum, shortCode);
      const success = await downloadStandPng(options);
      if (success) {
        showFeedback(`✓ ${tableNum} Stand PNG downloaded to your Downloads folder!`);
      } else {
        showFeedback(`⚠️ Download issue. Please try Print / PDF.`);
      }
    } catch (err) {
      console.error('Download PNG failed', err);
      showFeedback(`Error downloading image.`);
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Download as Standee PDF
  const handleDownloadPdf = async (tableNum: string, shortCode: string) => {
    setIsDownloading(true);
    try {
      const options = getStandOptions(tableNum, shortCode);
      const success = await downloadStandPdf(options);
      if (success) {
        showFeedback(`✓ ${tableNum} Standee PDF downloaded!`);
      } else {
        showFeedback(`⚠️ PDF generation issue.`);
      }
    } catch (err) {
      console.error('Download PDF failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // 3. Direct Print
  const handleDirectPrint = async (tableNum: string, shortCode: string) => {
    const options = getStandOptions(tableNum, shortCode);
    await printStandDirectly(options);
  };

  // Download All Tables
  const handleDownloadAllTables = async (format: 'png' | 'pdf') => {
    if (restTables.length === 0) return;
    setIsDownloading(true);
    showFeedback(`Starting download for all ${restTables.length} tables...`);
    try {
      for (const table of restTables) {
        const options = getStandOptions(table.table_number, table.short_code);
        if (format === 'png') {
          await downloadStandPng(options);
        } else {
          await downloadStandPdf(options);
        }
        await new Promise(res => setTimeout(res, 400));
      }
      showFeedback(`✓ All ${restTables.length} table stands downloaded!`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenPreview = (tableNum: string, shortCode: string) => {
    setQrModalTable({
      number: tableNum,
      code: shortCode,
      url: `${window.location.origin}/q/${shortCode}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Download Alert Toast */}
      {downloadFeedback && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-emerald-400 animate-bounce">
          <Check className="w-4 h-4" />
          {downloadFeedback}
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-5 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-extrabold text-white tracking-wide">
              Restaurant Tabletop QR Stand System
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              UPI Stand Size (4" x 6")
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Standard shop UPI tabletop stand format. Features a large high-contrast QR code, 3-language ordering header (English, বাংলা, हिंदी), direct WhatsApp Chat Ordering support, and official DigiMoms footer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download All Buttons */}
          {restTables.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => handleDownloadAllTables('png')}
                disabled={isDownloading}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Download all tables as PNG images (shows in phone gallery)"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                All PNG
              </button>
              <button
                onClick={() => handleDownloadAllTables('pdf')}
                disabled={isDownloading}
                className="px-3.5 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Download all tables as PDFs"
              >
                <FileText className="w-3.5 h-3.5" />
                All PDF
              </button>
            </div>
          )}

          {/* Add Table Button */}
          <button
            onClick={() => {
              setNewTableName(`Table 0${restTables.length + 1}`);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add New Table
          </button>
        </div>
      </div>

      {/* Specifications & Overview Strip */}
      <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-300 gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>3-Language Header:</strong> SCAN TO ORDER | <span className="text-amber-300 font-semibold">অর্ডার করতে স্ক্যান করুন</span> | <span className="text-amber-300 font-semibold">ऑर्डर करने के लिए स्कैन करें</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 flex-wrap">
          <span>Theme: <strong className="text-amber-400">{STAND_THEME.name}</strong></span>
          <span>📞 Call: <strong className="text-white">+91 {restaurantContact}</strong></span>
          <span>💬 WA: <strong className="text-emerald-400">+91 {restaurantWhatsApp}</strong></span>
        </div>
      </div>

      {/* Dining Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {restTables.map((table) => {
          const statusColors = {
            available: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
            occupied: 'border-rose-500/50 bg-rose-950/20 text-rose-300',
            cleaning: 'border-sky-500/50 bg-sky-950/20 text-sky-300',
            reserved: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
            maintenance: 'border-slate-700 bg-slate-900 text-slate-400'
          };

          return (
            <div
              key={table.id}
              className={`p-5 rounded-3xl border-2 backdrop-blur-md flex flex-col justify-between space-y-4 shadow-xl transition-all ${statusColors[table.status]}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">{table.table_number}</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Code: <strong className="text-amber-400">{table.short_code}</strong>
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-slate-950/80">
                  {table.status}
                </span>
              </div>

              {/* Stand Thumbnail / Preview Click */}
              <div 
                onClick={() => handleOpenPreview(table.table_number, table.short_code)}
                className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-center space-y-1.5 cursor-pointer hover:border-amber-500/50 transition-all group"
              >
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-400 uppercase font-bold tracking-wider group-hover:text-amber-300">
                  <Eye className="w-3.5 h-3.5" />
                  Click to Preview Stand
                </div>
                <div className="text-[11px] font-mono text-indigo-300 truncate">
                  /q/{table.short_code}
                </div>
                <div className="text-[9px] text-slate-500">
                  Countertop Standee (4" x 6")
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Primary: Download PNG (Instant image) */}
                <button
                  onClick={() => handleDownloadPng(table.table_number, table.short_code)}
                  disabled={isDownloading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  title="Direct PNG image download - immediately visible in phone gallery/downloads"
                >
                  <Download className="w-3.5 h-3.5 text-slate-950" />
                  Download Stand (PNG Image)
                </button>

                {/* 2. Secondary: Download PDF & Preview */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadPdf(table.table_number, table.short_code)}
                    disabled={isDownloading}
                    className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <FileText className="w-3 h-3 text-amber-400" />
                    Stand PDF
                  </button>

                  <button
                    onClick={() => handleOpenPreview(table.table_number, table.short_code)}
                    className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3 h-3 text-sky-400" />
                    Preview
                  </button>
                </div>

                {/* Test Customer View */}
                <button
                  onClick={() => {
                    setActiveShortCode(table.short_code);
                    setActiveView('customer-qr');
                    window.history.pushState({}, '', `/q/${table.short_code}`);
                  }}
                  className="w-full py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/30 text-blue-300 font-semibold text-[11px] border border-blue-500/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <QrCode className="w-3 h-3" /> Test Customer Mobile View
                </button>

                {table.status === 'occupied' && (
                  <button
                    onClick={() => clearTableSession(table.id)}
                    className="w-full py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear & Release Table
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stand Preview Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl my-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{qrModalTable.number} Table Standee</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                    4" x 6"
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{currentOwner.name}</p>
              </div>
              <button
                onClick={() => setQrModalTable(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Stand Preview: Rendered directly from Canvas 2D engine */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800 relative">
              {isPreviewLoading ? (
                <div className="h-[480px] flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Generating high-resolution stand preview...</span>
                </div>
              ) : previewDataUrl ? (
                <div className="relative group max-w-[350px] w-full mx-auto">
                  <img
                    src={previewDataUrl}
                    alt={`${qrModalTable.number} Stand`}
                    className="w-full h-auto rounded-2xl shadow-2xl border-2 border-amber-500/40 block"
                  />
                </div>
              ) : (
                <div className="h-[480px] flex items-center justify-center text-rose-400 text-xs">
                  Preview rendering failed
                </div>
              )}

              <div className="text-[10px] text-slate-400 mt-2 text-center">
                ✨ 100% Exact Print Preview: What you see here is exactly what downloads into your folder.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDownloadPng(qrModalTable.number, qrModalTable.code)}
                  disabled={isDownloading}
                  className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  title="Direct PNG image file - downloads into your device Downloads folder"
                >
                  <ImageIcon className="w-4 h-4 text-slate-950" />
                  {isDownloading ? 'Downloading...' : 'Download Stand (PNG)'}
                </button>

                <button
                  onClick={() => handleDownloadPdf(qrModalTable.number, qrModalTable.code)}
                  disabled={isDownloading}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  title="Download standard 4x6 standee PDF"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  Download Stand (PDF)
                </button>
              </div>

              <button
                onClick={() => handleDirectPrint(qrModalTable.number, qrModalTable.code)}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                Direct Print Stand (4" x 6" Photo Paper)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Dining Table</h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Table Label / Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 05 or Family Booth A"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500"
                >
                  Generate Table & QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
