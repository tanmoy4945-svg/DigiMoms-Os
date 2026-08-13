import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { QrCode, Plus, RotateCcw, Download, Phone, Eye, X } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export const TableManagement: React.FC = () => {
  const { currentOwner, tables, addTable, clearTableSession, setActiveShortCode, setActiveView } = useSaaS();
  const [newTableName, setNewTableName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrModalTable, setQrModalTable] = useState<{ number: string; code: string; url: string; qrData: string } | null>(null);

  if (!currentOwner) return null;

  const restTables = tables.filter(t => t.restaurant_id === currentOwner.id);

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTableName.trim()) {
      addTable(newTableName.trim());
      setNewTableName('');
      setShowAddModal(false);
    }
  };

  const generateQrDataUrl = async (shortCode: string): Promise<string> => {
    const fullUrl = `${window.location.origin}/q/${shortCode}`;
    try {
      return await QRCode.toDataURL(fullUrl, {
        width: 400,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error("QR Generation error", err);
      return '';
    }
  };

  const printQrCard = async (tableNum: string, shortCode: string) => {
    const qrDataUrl = await generateQrDataUrl(shortCode);
    const doc = new jsPDF({ unit: 'mm', format: 'a5' });

    // Outer dark slate background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 148, 210, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(currentOwner.name.toUpperCase(), 74, 22, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246); // blue-400
    doc.text(`SCAN QR CODE TO ORDER FOOD`, 74, 30, { align: 'center' });

    // White Stand Card Container
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 36, 108, 142, 6, 6, 'F');

    // Table Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(tableNum.toUpperCase(), 74, 48, { align: 'center' });

    // Embed actual QR Image in PDF
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 44, 53, 60, 60);
    }

    // Code & Short Link
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Permanent Table Code: ${shortCode}`, 74, 118, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Link: ${window.location.host}/q/${shortCode}`, 74, 125, { align: 'center' });

    // --- CALL RESTAURANT / CONTACT NUMBER SECTION ---
    const contactNum = currentOwner.contact_mobile || currentOwner.owner_mobile || '8900415647';
    doc.setFillColor(239, 246, 255); // Soft blue pill
    doc.roundedRect(26, 132, 96, 22, 4, 4, 'F');

    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.4);
    doc.roundedRect(26, 132, 96, 22, 4, 4, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(29, 78, 216); // blue-700
    doc.text(`NEED ASSISTANCE / CALL RESTAURANT`, 74, 140, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Call: +91 ${contactNum}`, 74, 148, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`(Restaurant Owner / Staff Contact)`, 74, 168, { align: 'center' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Scan with any mobile camera to view menu', 74, 188, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Powered by DigiMoms Smart Restaurant OS', 74, 195, { align: 'center' });

    doc.save(`QR_Card_${currentOwner.slug}_${tableNum.replace(/\s+/g, '_')}.pdf`);
  };

  const handlePreviewQr = async (tableNum: string, shortCode: string) => {
    const qrDataUrl = await generateQrDataUrl(shortCode);
    setQrModalTable({
      number: tableNum,
      code: shortCode,
      url: `${window.location.origin}/q/${shortCode}`,
      qrData: qrDataUrl
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Table & Permanent QR Code System</h2>
          <p className="text-xs text-slate-400">Manage dining tables, permanent QR links & active dining sessions</p>
        </div>

        <button
          onClick={() => {
            setNewTableName(`Table 0${restTables.length + 1}`);
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New Table
        </button>
      </div>

      {/* Tables Grid */}
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
              className={`p-6 rounded-3xl border-2 backdrop-blur-md flex flex-col justify-between space-y-4 shadow-xl transition-all ${statusColors[table.status]}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-white">{table.table_number}</h3>
                  <p className="text-xs font-mono text-slate-400">Code: <strong className="text-blue-400">{table.short_code}</strong></p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-slate-950/80">
                  {table.status}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Permanent QR Link</div>
                <div className="text-xs font-mono text-indigo-300 font-semibold truncate">/q/{table.short_code}</div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => printQrCard(table.table_number, table.short_code)}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" /> Printable QR Card PDF
                </button>

                <button
                  onClick={() => handlePreviewQr(table.table_number, table.short_code)}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center justify-center gap-2 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> Preview QR Code
                </button>

                <button
                  onClick={() => {
                    setActiveShortCode(table.short_code);
                    setActiveView('customer-qr');
                    window.history.pushState({}, '', `/q/${table.short_code}`);
                  }}
                  className="w-full py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" /> Test Customer View
                </button>

                {table.status === 'occupied' && (
                  <button
                    onClick={() => clearTableSession(table.id)}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear & Release Table
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Preview Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
              <div>
                <h3 className="text-base font-bold text-white">{qrModalTable.number} Stand QR</h3>
                <p className="text-xs text-slate-400">{currentOwner.name}</p>
              </div>
              <button onClick={() => setQrModalTable(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white space-y-3 inline-block shadow-inner">
              {qrModalTable.qrData ? (
                <img src={qrModalTable.qrData} alt="QR Code" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-500">Generating...</div>
              )}
              <div className="text-xs font-bold text-slate-900">{qrModalTable.number}</div>
              <div className="text-[10px] text-slate-600 font-mono">Code: {qrModalTable.code}</div>
            </div>

            {/* Call Restaurant Contact info */}
            <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-xs text-blue-200 flex items-center justify-center gap-2">
              <Phone className="w-4 h-4 text-blue-400" />
              <span>Call Restaurant: <strong className="text-white font-mono">+91 {currentOwner.contact_mobile || currentOwner.owner_mobile || '8900415647'}</strong></span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => printQrCard(qrModalTable.number, qrModalTable.code)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Printable PDF
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
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Generate Table & QR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
