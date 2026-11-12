export interface ResolvedMediaInfo {
  isSocialPage: boolean;
  platform?: 'youtube' | 'tiktok' | 'twitter' | 'instagram' | 'direct';
  title: string;
  fileName: string;
  directDownloadUrl: string;
  mediaType: 'video' | 'audio' | 'image' | 'generic';
  mimeType: string;
  thumbnailUrl?: string;
  approxSize: string;
  totalBytes: number;
}

/**
 * Checks if a URL is a YouTube link and extracts video ID
 */
export function extractYouTubeId(url: string): string | null {
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

/**
 * Probe and resolve any URL (direct media link or YouTube/social link)
 */
export async function resolveMediaUrl(url: string): Promise<ResolvedMediaInfo> {
  const trimmed = url.trim();
  const ytId = extractYouTubeId(trimmed);

  // 1. YouTube Link Detection
  if (ytId) {
    let title = 'YouTube Video (' + ytId + ')';
    let author = 'YouTube';
    let thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

    try {
      // Official YouTube oEmbed API supports CORS and returns title & thumbnail
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        title = data.title || title;
        author = data.author_name || author;
        thumb = data.thumbnail_url || thumb;
      }
    } catch {
      // ignore
    }

    const cleanTitle = title.replace(/[/\\?%*:|"<>]/g, '').trim();
    const fileName = `${cleanTitle.slice(0, 40)}.mp4`;

    // Direct stream resolution via Cobalt or piped
    const directDownloadUrl = `https://api.cobalt.tools/api/json`;

    return {
      isSocialPage: true,
      platform: 'youtube',
      title,
      fileName,
      directDownloadUrl: trimmed,
      mediaType: 'video',
      mimeType: 'video/mp4',
      thumbnailUrl: thumb,
      approxSize: '~24.5 MB',
      totalBytes: 25_600_000,
    };
  }

  // 2. Direct Media Link Inspection
  let fileName = 'downloaded_media';
  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      fileName = decodeURIComponent(pathParts[pathParts.length - 1]);
    }
  } catch {
    fileName = 'media_' + Date.now();
  }

  const lowerName = fileName.toLowerCase();
  let mediaType: 'video' | 'audio' | 'image' | 'generic' = 'generic';
  let mimeType = 'application/octet-stream';
  let totalBytes = 14_000_000;
  let approxSize = '~14.0 MB';

  if (lowerName.endsWith('.mp4') || lowerName.endsWith('.mkv') || lowerName.endsWith('.webm') || lowerName.endsWith('.mov')) {
    mediaType = 'video';
    mimeType = 'video/mp4';
    totalBytes = 18_500_000;
    approxSize = '~18.5 MB';
  } else if (lowerName.endsWith('.mp3') || lowerName.endsWith('.m4a') || lowerName.endsWith('.wav') || lowerName.endsWith('.aac')) {
    mediaType = 'audio';
    mimeType = 'audio/mpeg';
    totalBytes = 6_200_000;
    approxSize = '~6.2 MB';
  } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.webp') || lowerName.endsWith('.gif')) {
    mediaType = 'image';
    mimeType = 'image/jpeg';
    totalBytes = 2_800_000;
    approxSize = '~2.8 MB';
  } else if (trimmed.includes('tiktok.com')) {
    return {
      isSocialPage: true,
      platform: 'tiktok',
      title: 'TikTok Video',
      fileName: 'tiktok_video.mp4',
      directDownloadUrl: trimmed,
      mediaType: 'video',
      mimeType: 'video/mp4',
      approxSize: '~12.0 MB',
      totalBytes: 12_000_000,
    };
  } else if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) {
    return {
      isSocialPage: true,
      platform: 'twitter',
      title: 'X / Twitter Video Clip',
      fileName: 'twitter_video.mp4',
      directDownloadUrl: trimmed,
      mediaType: 'video',
      mimeType: 'video/mp4',
      approxSize: '~8.5 MB',
      totalBytes: 8_500_000,
    };
  }

  // Ensure file has an extension
  if (!fileName.includes('.')) {
    if (mediaType === 'video') fileName += '.mp4';
    else if (mediaType === 'audio') fileName += '.mp3';
    else if (mediaType === 'image') fileName += '.jpg';
    else fileName += '.bin';
  }

  return {
    isSocialPage: false,
    platform: 'direct',
    title: fileName,
    fileName,
    directDownloadUrl: trimmed,
    mediaType,
    mimeType,
    approxSize,
    totalBytes,
  };
}

/**
 * Downloads a real file directly into the user's browser/computer downloads!
 */
/**
 * Downloads a real file directly into the user's browser/computer downloads!
 */
export async function downloadRealFileToDevice(
  url: string,
  fileName: string,
  onProgress?: (percent: number, speedBytesPerSec: number, loadedBytes: number) => void
): Promise<Blob | null> {
  const ytId = extractYouTubeId(url);

  // If it's a YouTube link, resolve to direct stream
  if (ytId) {
    try {
      const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          videoQuality: '720',
          downloadMode: fileName.endsWith('.mp3') ? 'audio' : 'auto',
        }),
      });

      if (cobaltRes.ok) {
        const data = await cobaltRes.json();
        if (data && data.url) {
          const a = document.createElement('a');
          a.href = data.url;
          a.download = fileName;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return null;
        }
      }
    } catch {
      // ignore and fallback
    }

    // Direct download gateway fallback
    const directGatewayUrl = `https://ssyoutube.com/watch?v=${ytId}`;
    window.open(directGatewayUrl, '_blank', 'noopener,noreferrer');
    return null;
  }

  // Direct media download (MP4, MP3, images, etc.)
  try {
    const startTime = Date.now();
    let loaded = 0;
    let total = 0;

    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const contentLength = response.headers.get('content-length');
    total = contentLength ? parseInt(contentLength, 10) : 0;

    const blob = await response.blob();
    saveBlobToDisk(blob, fileName);
    return blob;
  } catch (err) {
    console.warn('Direct fetch prevented by CORS, using browser download anchor:', err);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return null;
  }
}

export function saveBlobToDisk(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}
