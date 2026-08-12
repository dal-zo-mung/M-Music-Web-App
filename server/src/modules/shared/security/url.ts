const ALLOWED_YOUTUBE_HOSTS = new Set([
  'm.youtube.com',
  'music.youtube.com',
  'www.youtube.com',
  'youtu.be',
  'youtube.com'
]);

export function normalizeYouTubeUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '';
  }

  try {
    const url = new URL(value.trim());
    const protocol = url.protocol.toLowerCase();
    const host = url.hostname.toLowerCase();

    if ((protocol !== 'https:' && protocol !== 'http:') || !ALLOWED_YOUTUBE_HOSTS.has(host)) {
      return '';
    }

    return url.toString();
  } catch {
    return '';
  }
}
