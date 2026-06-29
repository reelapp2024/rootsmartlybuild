import { API_BASE_URL, isValidHttpUrl, toAbsoluteMediaUrl } from '../../../config';

/**
 * Uploads a file to the backend /uploadFile endpoint.
 * Returns the absolute, validated media URL on success.
 * Throws on any failure (bad response, missing URL, invalid URL).
 *
 * The caller is responsible for managing progress UI — this just performs the POST and
 * parses the response.
 */
export const uploadFileToApi = async (
  file: File,
  token: string | null | undefined,
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  // Don't send an empty Authorization header — many backends reject that.
  const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

  const url = `${API_BASE_URL}/uploadFile`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (netErr: any) {
    // `fetch` only throws on network-level errors (CORS, DNS, offline, server down).
    // Surface the actual cause instead of the generic "Failed to fetch" string.
    const msg = netErr?.message || String(netErr);
    throw new Error(
      `Network error uploading to ${url} — ${msg}. Check: (1) backend is running, (2) VITE_API_URL in .env is correct, (3) CORS allows this origin.`
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.clone().text();
      detail = body ? ` — ${body.slice(0, 200)}` : '';
    } catch {}
    throw new Error(`Upload failed (HTTP ${response.status})${detail}`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('Upload server returned non-JSON response.');
  }

  const uploadedUrl: string = data?.data?.url || data?.url || '';

  if (!uploadedUrl) {
    throw new Error('Upload succeeded but server returned no URL.');
  }

  const fullUrl = toAbsoluteMediaUrl(uploadedUrl);
  if (!isValidHttpUrl(fullUrl)) {
    throw new Error(`Server returned an invalid file URL: "${uploadedUrl}"`);
  }

  return fullUrl;
};

/**
 * Normalizes section.content.images (which can contain strings or objects) into
 * a uniform array of `{ id, url }`. Used by the background upload logic to
 * merge a newly uploaded URL at a given index.
 */
export const normalizeSectionImages = (images: unknown): Array<{ id: string; url: string }> => {
  if (!Array.isArray(images)) return [];
  return images
    .map((item, index) => {
      if (typeof item === 'string') return { id: `img-${index}`, url: item };
      if (item && typeof item === 'object') {
        const raw = item as { id?: unknown; url?: unknown };
        return {
          id: String(raw.id || `img-${index}`),
          url: String(raw.url || ''),
        };
      }
      return { id: `img-${index}`, url: '' };
    })
    .filter(item => !!item.url);
};

/**
 * Parses a `backgroundImage.N` upload target field into the numeric index.
 * Returns 0 for plain `backgroundImage` or malformed values.
 */
export const parseBackgroundImageIndex = (field: string): number => {
  const match = field.match(/^backgroundImage\.(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
};
