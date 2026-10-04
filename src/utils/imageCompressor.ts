/**
 * Intelligent Client-Side Image Compression Utility
 * Automatically compresses images to specific target file weight ranges:
 * - Food Items: 60 - 120 KB (Optimized for menu cards & fast QR loading)
 * - Restaurant Web Banners: 150 - 200 KB (Optimized for hero headers & sliders)
 * - Restaurant Logos: 20 - 40 KB (Optimized for header badges & navigation)
 */

export type ImageCompressionType = 'food' | 'banner' | 'logo';

export interface CompressionPreset {
  type: ImageCompressionType;
  label: string;
  minKb: number;
  maxKb: number;
  idealKb: number;
  maxDimension: number;
}

export const COMPRESSION_PRESETS: Record<ImageCompressionType, CompressionPreset> = {
  food: {
    type: 'food',
    label: 'Food Item Image',
    minKb: 60,
    maxKb: 120,
    idealKb: 90,
    maxDimension: 900,
  },
  banner: {
    type: 'banner',
    label: 'Restaurant Banner Image',
    minKb: 150,
    maxKb: 200,
    idealKb: 175,
    maxDimension: 1600,
  },
  logo: {
    type: 'logo',
    label: 'Restaurant Logo',
    minKb: 20,
    maxKb: 40,
    idealKb: 30,
    maxDimension: 450,
  },
};

export interface CompressionResult {
  dataUrl: string;
  sizeKb: number;
  originalSizeKb: number;
  type: ImageCompressionType;
  width: number;
  height: number;
  infoText: string;
  success: boolean;
}

/**
 * Calculates byte size in KB from base64 Data URL
 */
export function getDataUrlSizeInKb(dataUrl: string): number {
  if (!dataUrl) return 0;
  const commaIdx = dataUrl.indexOf(',');
  const base64Str = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const padding = base64Str.endsWith('==') ? 2 : base64Str.endsWith('=') ? 1 : 0;
  const bytes = (base64Str.length * 3) / 4 - padding;
  return Math.round((bytes / 1024) * 10) / 10;
}

/**
 * Loads image from File, Blob, or URL into an HTMLImageElement
 */
function loadImageSource(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image source: ' + err));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('FileReader returned empty result'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Compresses an image to the exact target weight range for the specified type:
 * - food: 60 - 120 KB
 * - banner: 150 - 200 KB
 * - logo: 20 - 40 KB
 */
export async function compressImage(
  source: File | Blob | string,
  type: ImageCompressionType,
  originalFilename?: string
): Promise<CompressionResult> {
  const preset = COMPRESSION_PRESETS[type];
  const originalSizeKb = source instanceof File || source instanceof Blob 
    ? Math.round((source.size / 1024) * 10) / 10 
    : typeof source === 'string' && source.startsWith('data:') 
      ? getDataUrlSizeInKb(source) 
      : 0;

  try {
    const img = await loadImageSource(source);
    let origWidth = img.naturalWidth || img.width;
    let origHeight = img.naturalHeight || img.height;

    // 1. Initial aspect ratio scaling to preset maxDimension
    let width = origWidth;
    let height = origHeight;
    const maxDim = preset.maxDimension;

    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Use white background for JPEG compression, unless transparent logo on WebP
    const isPng = (source instanceof File && source.type === 'image/png') || (typeof source === 'string' && source.startsWith('data:image/png'));
    const format = type === 'logo' && isPng ? 'image/webp' : 'image/jpeg';

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // 2. Binary search on compression quality to land between minKb and maxKb
    let lowQ = 0.15;
    let highQ = 0.96;
    let bestQuality = 0.82;
    let bestDataUrl = canvas.toDataURL(format, bestQuality);
    let bestKb = getDataUrlSizeInKb(bestDataUrl);

    // 5 iterations of binary search to dial into the sweet spot
    for (let i = 0; i < 6; i++) {
      const midQ = (lowQ + highQ) / 2;
      const testDataUrl = canvas.toDataURL(format, midQ);
      const testKb = getDataUrlSizeInKb(testDataUrl);

      // If already within exact range, stop
      if (testKb >= preset.minKb && testKb <= preset.maxKb) {
        bestDataUrl = testDataUrl;
        bestKb = testKb;
        bestQuality = midQ;
        break;
      }

      if (testKb > preset.maxKb) {
        highQ = midQ;
        bestDataUrl = testDataUrl;
        bestKb = testKb;
        bestQuality = midQ;
      } else {
        lowQ = midQ;
        bestDataUrl = testDataUrl;
        bestKb = testKb;
        bestQuality = midQ;
      }
    }

    // 3. If still exceeding maxKb even at low quality, scale down canvas resolution
    if (bestKb > preset.maxKb) {
      let scaleDown = Math.sqrt(preset.maxKb / bestKb) * 0.95;
      scaleDown = Math.max(0.5, Math.min(0.9, scaleDown));
      
      const smallW = Math.round(width * scaleDown);
      const smallH = Math.round(height * scaleDown);
      canvas.width = smallW;
      canvas.height = smallH;

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, smallW, smallH);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, smallW, smallH);

      bestDataUrl = canvas.toDataURL(format, 0.78);
      bestKb = getDataUrlSizeInKb(bestDataUrl);
      width = smallW;
      height = smallH;
    }

    // 4. Construct informative summary
    const formattedSize = bestKb >= 1024 ? `${(bestKb / 1024).toFixed(1)} MB` : `${Math.round(bestKb)} KB`;
    const formattedOrig = originalSizeKb >= 1024 ? `${(originalSizeKb / 1024).toFixed(1)} MB` : `${Math.round(originalSizeKb)} KB`;
    const infoText = originalSizeKb > 0
      ? `Compressed: ${formattedOrig} ➔ ${formattedSize} (Target: ${preset.minKb}-${preset.maxKb} KB)`
      : `Size: ${formattedSize} (Target: ${preset.minKb}-${preset.maxKb} KB)`;

    return {
      dataUrl: bestDataUrl,
      sizeKb: bestKb,
      originalSizeKb: originalSizeKb || bestKb,
      type,
      width,
      height,
      infoText,
      success: true,
    };
  } catch (err) {
    console.error('Image compression failed:', err);
    // Fallback: if source was already a string, return it; otherwise empty
    const fallbackUrl = typeof source === 'string' ? source : '';
    return {
      dataUrl: fallbackUrl,
      sizeKb: originalSizeKb || 0,
      originalSizeKb: originalSizeKb || 0,
      type,
      width: 0,
      height: 0,
      infoText: 'Compression failed, using original',
      success: false,
    };
  }
}
