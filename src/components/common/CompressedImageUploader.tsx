import React, { useState, useRef } from 'react';
import { Upload, Link2, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { compressImage, ImageCompressionType, COMPRESSION_PRESETS, CompressionResult } from '../../utils/imageCompressor';
import { SmartImage } from './SmartImage';

interface CompressedImageUploaderProps {
  label: string;
  type: ImageCompressionType;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  className?: string;
  previewHeightClass?: string;
}

export const CompressedImageUploader: React.FC<CompressedImageUploaderProps> = ({
  label,
  type,
  value,
  onChange,
  helperText,
  className = '',
  previewHeightClass = 'w-14 h-14'
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preset = COMPRESSION_PRESETS[type];

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset errors
    setErrorMsg(null);
    setIsCompressing(true);

    try {
      const result = await compressImage(file, type, file.name);
      if (result.success && result.dataUrl) {
        setCompressionResult(result);
        onChange(result.dataUrl);
      } else {
        setErrorMsg('Failed to process image file. Please try another image.');
      }
    } catch (err: any) {
      console.error('File compression error:', err);
      setErrorMsg(err.message || 'Error processing image.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setErrorMsg(null);
    setCompressionResult(null);
    onChange(newUrl);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label & Target Size Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Target: {preset.minKb} - {preset.maxKb} KB
          </span>
        </label>

        {/* Switch between Upload File vs Paste URL */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
              mode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3 h-3" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
              mode === 'url' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3 h-3" />
            URL
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Uploader Body */}
      {mode === 'upload' ? (
        <div className="space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-950/70 hover:bg-slate-900/60 rounded-2xl p-4 transition-all text-center group flex flex-col items-center justify-center gap-1.5"
          >
            {isCompressing ? (
              <div className="flex items-center gap-2 text-xs text-amber-400 font-bold py-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Compressing image to {preset.minKb}-{preset.maxKb} KB...</span>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 group-hover:bg-blue-600/20 text-blue-400 flex items-center justify-center transition-all">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                  Click to Upload or Snap Photo
                </div>
                <div className="text-[10px] text-slate-400">
                  Any camera photo or image automatically compresses to <strong className="text-amber-300 font-mono">{preset.minKb} - {preset.maxKb} KB</strong>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste image URL (e.g. Google Drive, Supabase, CDN...)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono"
          />
        </div>
      )}

      {/* Compression Result Badge */}
      {compressionResult && compressionResult.success && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{compressionResult.infoText}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-300">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Preview Thumbnail if an image is set */}
      {value && (
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <SmartImage
            src={value}
            alt={label}
            className={`${previewHeightClass} rounded-xl object-cover border border-slate-800 shrink-0`}
          />
          <div className="text-[11px] text-slate-300 space-y-0.5 overflow-hidden">
            <div className="font-bold text-white truncate">Image Active</div>
            <div className="text-[10px] text-slate-400 truncate">
              {value.startsWith('data:') ? '✓ Compressed locally (Ready to Save)' : value}
            </div>
          </div>
        </div>
      )}

      {helperText && <p className="text-[10px] text-slate-500">{helperText}</p>}
    </div>
  );
};
