const YOUTUBE_HOST_RE = /(^|\.)((youtube\.com)|(youtu\.be))$/i;
const GOOGLE_DRIVE_HOST_RE = /(^|\.)drive\.google\.com$/i;

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function hostMatches(hostname: string, re: RegExp): boolean {
  return re.test(hostname.toLowerCase());
}

export function isYouTubeUrl(url: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  return hostMatches(parsed.hostname, YOUTUBE_HOST_RE);
}

export function isGoogleDriveUrl(url: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  return hostMatches(parsed.hostname, GOOGLE_DRIVE_HOST_RE);
}

export function toGoogleDrivePreviewUrl(url: string): string {
  const parsed = parseUrl(url);
  if (!parsed) return url;

  const openId = parsed.searchParams.get("id");
  if (openId) {
    return `https://drive.google.com/file/d/${openId}/preview`;
  }

  const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
  if (fileMatch?.[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  return url;
}

/** Normalize known hosts (e.g. Google Drive → preview URL). YouTube links are returned as-is. */
export function normalizeExternalVideoUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) return url;

  if (isGoogleDriveUrl(url)) {
    return toGoogleDrivePreviewUrl(url);
  }

  return url;
}
