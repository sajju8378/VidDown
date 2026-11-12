export type MediaType = 'video' | 'audio' | 'image' | 'generic';

export type DownloadStatus =
  | 'idle'
  | 'probing'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface SimulatedDownloadItem {
  id: string;
  originalUrl: string;
  fileName: string;
  mediaType: MediaType;
  mimeType: string;
  totalBytes: number;
  downloadedBytes: number;
  progress: number;
  speedBytesPerSec: number;
  status: DownloadStatus;
  destinationFolder: string;
  timestamp: number;
  previewUrl?: string;
  errorMessage?: string;
}

export interface AndroidProjectFile {
  path: string;
  category: 'kotlin' | 'gradle' | 'xml' | 'ci' | 'wrapper';
  description: string;
  content: string;
}

export interface SampleMediaLink {
  title: string;
  type: MediaType;
  mimeType: string;
  size: string;
  approxBytes: number;
  url: string;
  description: string;
}
