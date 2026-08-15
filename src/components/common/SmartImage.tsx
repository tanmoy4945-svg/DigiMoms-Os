import React, { useState, useEffect } from 'react';
import { normalizeImageUrl, getGoogleDriveFallbackUrl } from '../../utils/imageUrl';
import { Image as ImageIcon } from 'lucide-react';

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  alt: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  fallbackSrc,
  alt,
  onError,
  className = '',
  ...props
}) => {
  const initialUrl = normalizeImageUrl(src || '');
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl || (fallbackSrc ? normalizeImageUrl(fallbackSrc) : ''));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const normalized = normalizeImageUrl(src || '');
    if (normalized) {
      setCurrentSrc(normalized);
      setHasError(false);
    } else if (fallbackSrc) {
      setCurrentSrc(normalizeImageUrl(fallbackSrc));
      setHasError(false);
    } else {
      setCurrentSrc('');
      setHasError(false);
    }
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Check for Google Drive fallback
    if (currentSrc) {
      const gDriveFallback = getGoogleDriveFallbackUrl(currentSrc);
      if (gDriveFallback && gDriveFallback !== currentSrc) {
        setCurrentSrc(gDriveFallback);
        return;
      }
    }

    // Check for user provided fallback
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      const normFallback = normalizeImageUrl(fallbackSrc);
      if (normFallback && currentSrc !== normFallback) {
        setCurrentSrc(normFallback);
        return;
      }
    }

    setHasError(true);
    if (onError) onError(e);
  };

  // If no source provided or failed to load, render clean fallback container without raw img tag
  if (!currentSrc || hasError) {
    return (
      <div
        className={`bg-slate-800 text-slate-400 flex items-center justify-center p-2 text-center select-none overflow-hidden ${className}`}
        title={alt || 'Image'}
      >
        {alt && alt.length <= 4 ? (
          <span className="font-bold text-xs uppercase">{alt}</span>
        ) : (
          <ImageIcon className="w-4 h-4 opacity-50 shrink-0" />
        )}
      </div>
    );
  }

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt || 'Image'}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
};

