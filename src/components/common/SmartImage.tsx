import React, { useState, useEffect } from 'react';
import { normalizeImageUrl, getGoogleDriveFallbackUrl } from '../../utils/imageUrl';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
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
  const initialUrl = normalizeImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState(initialUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(normalizeImageUrl(src));
    setHasError(false);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Check for Google Drive fallback
    const gDriveFallback = getGoogleDriveFallbackUrl(currentSrc);
    if (gDriveFallback && gDriveFallback !== currentSrc) {
      setCurrentSrc(gDriveFallback);
      return;
    }

    // Check for user provided fallback
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }

    setHasError(true);
    if (onError) onError(e);
  };

  if (hasError && !fallbackSrc) {
    return (
      <div className={`bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-bold p-1 text-center select-none ${className}`}>
        Image unavailable
      </div>
    );
  }

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};
