/**
 * Safe JSON fetch utility for DigiMoms OS
 * Prevents "Unexpected token 'T', The page c... is not valid JSON" errors
 * by validating HTTP status, response text, and headers before parsing JSON.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  rawText?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();

    const isJsonLikely =
      contentType.includes('application/json') ||
      (rawText.trim().startsWith('{') && rawText.trim().endsWith('}')) ||
      (rawText.trim().startsWith('[') && rawText.trim().endsWith(']'));

    if (isJsonLikely) {
      try {
        const parsed = JSON.parse(rawText) as T;
        return {
          ok: res.ok,
          status: res.status,
          data: parsed,
          error: !res.ok
            ? (parsed as any)?.error || (parsed as any)?.message || `HTTP ${res.status}`
            : undefined,
          rawText
        };
      } catch (parseError: any) {
        console.warn(`[safeFetchJson] JSON parse error for ${url}:`, parseError.message);
        return {
          ok: false,
          status: res.status,
          data: null,
          error: `Payment server returned non-JSON data: ${rawText.substring(0, 100)}`,
          rawText
        };
      }
    }

    // Response was not JSON (e.g. HTML error page like "The page cannot be found")
    console.warn(`[safeFetchJson] Non-JSON response for ${url} (status ${res.status}): ${rawText.substring(0, 100)}`);
    return {
      ok: false,
      status: res.status,
      data: null,
      error: res.ok
        ? `Unexpected text response from server: ${rawText.substring(0, 80)}`
        : `Server Error (${res.status}): ${rawText.substring(0, 80)}`,
      rawText
    };
  } catch (networkError: any) {
    console.error(`[safeFetchJson] Network error connecting to ${url}:`, networkError);
    return {
      ok: false,
      status: 0,
      data: null,
      error: networkError.message || 'Unable to connect to payment server. Please check your connection.',
      rawText: ''
    };
  }
}
