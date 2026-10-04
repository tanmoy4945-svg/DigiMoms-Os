/**
 * Universal Image URL Processing and Validation Utility
 * Supports:
 * - Google Drive share/view/open links
 * - Dropbox share links
 * - Imgur page links
 * - Postimages / Postimg links
 * - Unsplash links
 * - Supabase / Firebase / AWS S3 / CDN / Direct image URLs
 * - Data URIs and Blob URIs
 */

/**
 * Extracts Google Drive File ID from various link formats
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;

  // Format 1: /file/d/FILE_ID/view or /file/d/FILE_ID
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];

  // Format 2: ?id=FILE_ID or &id=FILE_ID or docs.google.com/uc?id=FILE_ID
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  // Format 3: lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match) return lh3Match[1];

  // Format 4: drive.google.com/thumbnail?id=FILE_ID
  const thumbMatch = url.match(/drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (thumbMatch) return thumbMatch[1];

  return null;
}

/**
 * Normalizes any image URL into a direct, embeddable image source format.
 * Does NOT require file extensions like .jpg, .png, .webp.
 */
export function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  // Data URIs or Blob URIs are returned as-is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Ensure protocol if missing (e.g. "images.unsplash.com/...")
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // 1. Google Drive Links
  const driveFileId = extractGoogleDriveFileId(url);
  if (driveFileId) {
    // Google's direct high-res image CDN format for public files
    return `https://lh3.googleusercontent.com/d/${driveFileId}`;
  }

  // 2. Dropbox Links
  if (url.includes('dropbox.com')) {
    url = url.replace(/([?&])dl=[01]/, '$1raw=1');
    if (!url.includes('raw=1')) {
      url += (url.includes('?') ? '&' : '?') + 'raw=1';
    }
    return url;
  }

  // 3. Imgur Page Links
  if (url.match(/https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/)) {
    const match = url.match(/https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/);
    if (match && match[1] && match[1] !== 'a' && match[1] !== 'gallery') {
      return `https://i.imgur.com/${match[1]}.jpg`;
    }
  }

  // 4. Postimages / Postimg
  if (url.match(/https?:\/\/(?:www\.)?postimg\.cc\/([a-zA-Z0-9]+)$/)) {
    const match = url.match(/https?:\/\/(?:www\.)?postimg\.cc\/([a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      return `https://i.postimg.cc/${match[1]}/image.jpg`;
    }
  }

  // 5. Unsplash photo page links
  if (url.match(/https?:\/\/(?:www\.)?unsplash\.com\/photos\/([a-zA-Z0-9_-]+)/)) {
    const match = url.match(/https?:\/\/(?:www\.)?unsplash\.com\/photos\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://images.unsplash.com/photo-${match[1]}?auto=format&fit=crop&w=1200&q=80`;
    }
  }

  return url;
}

/**
 * Returns alternative fallback formats for Google Drive images in case primary fails
 */
export function getGoogleDriveFallbackUrl(url: string): string | null {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;

  if (url.includes('lh3.googleusercontent.com')) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }
  if (url.includes('thumbnail')) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

export interface ImageValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  error?: string;
}

/**
 * Validates that an image URL can actually be loaded and rendered in the browser.
 * Returns the normalized URL on success, or an error message on failure.
 */
export async function validateAndNormalizeImageUrl(
  rawUrl: string,
  timeoutMs = 8000
): Promise<ImageValidationResult> {
  const trimmed = rawUrl ? rawUrl.trim() : '';
  if (!trimmed) {
    return { isValid: false, normalizedUrl: '', error: 'Image URL cannot be empty.' };
  }

  const normalized = normalizeImageUrl(trimmed);

  // Data URIs or Blob URIs are assumed valid
  if (normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return { isValid: true, normalizedUrl: normalized };
  }

  // Test loading the primary normalized URL
  const canLoadPrimary = await testImageCanLoad(normalized, timeoutMs);
  if (canLoadPrimary) {
    return { isValid: true, normalizedUrl: normalized };
  }

  // If primary failed and it's a Google Drive URL, test fallback thumbnail format
  const driveFileId = extractGoogleDriveFileId(trimmed);
  if (driveFileId) {
    const fallbackUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`;
    if (fallbackUrl !== normalized) {
      const canLoadFallback = await testImageCanLoad(fallbackUrl, timeoutMs);
      if (canLoadFallback) {
        return { isValid: true, normalizedUrl: fallbackUrl };
      }
    }
  }

  return {
    isValid: false,
    normalizedUrl: normalized,
    error: 'Unable to load image from the provided URL. Please verify that the link is publicly accessible (e.g. for Google Drive, ensure access is set to "Anyone with the link can view") and points to a valid image.'
  };
}

/**
 * Internal helper to test if an image URL loads in the DOM with natural dimensions
 */
function testImageCanLoad(url: string, timeoutMs: number): Promise<boolean> {
  if (!url || !url.trim()) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const img = new Image();
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
    };

    timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);

    img.onload = () => {
      cleanup();
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(false);
    };

    img.src = url;
  });
}
