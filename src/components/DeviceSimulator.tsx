import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  History,
  Settings,
  Folder,
  Share2,
  Film,
  Volume2,
  Image as ImageIcon,
  Play,
  Pause,
  X,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Battery,
  Bell,
  Search,
  Clipboard,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import { SimulatedDownloadItem, MediaType } from '../types';
import { SAMPLE_MEDIA_LINKS } from '../data/sampleLinks';
import { resolveMediaUrl, downloadRealFileToDevice, extractYouTubeId } from '../utils/mediaResolver';

interface DeviceSimulatorProps {
  onOpenShareIntent: () => void;
  onOpenFolderPicker: () => void;
  chosenFolder: string;
  onOpenPlayer: (item: SimulatedDownloadItem) => void;
  sharedUrlPayload: string | null;
  onClearSharedUrl: () => void;
  sharedSourceApp: string;
}

export const DeviceSimulator: React.FC<DeviceSimulatorProps> = ({
  onOpenShareIntent,
  onOpenFolderPicker,
  chosenFolder,
  onOpenPlayer,
  sharedUrlPayload,
  onClearSharedUrl,
  sharedSourceApp,
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'history' | 'settings'>('download');
  const [urlInput, setUrlInput] = useState('');
  const [isProbing, setIsProbing] = useState(false);
  const [showNotificationShade, setShowNotificationShade] = useState(false);
  const [autoStartOnShare, setAutoStartOnShare] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Probed metadata state
  const [probedData, setProbedData] = useState<{
    fileName: string;
    mimeType: string;
    mediaType: MediaType;
    sizeFormatted: string;
    totalBytes: number;
  } | null>(null);

  // Active download state
  const [activeDownload, setActiveDownload] = useState<SimulatedDownloadItem | null>(null);

  // History list
  const [historyItems, setHistoryItems] = useState<SimulatedDownloadItem[]>([
    {
      id: 'hist-1',
      originalUrl: SAMPLE_MEDIA_LINKS[0].url,
      fileName: 'BigBuckBunny_720p.mp4',
      mediaType: 'video',
      mimeType: 'video/mp4',
      totalBytes: 10_500_000,
      downloadedBytes: 10_500_000,
      progress: 100,
      speedBytesPerSec: 0,
      status: 'completed',
      destinationFolder: 'Downloads / MediaDrop',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'hist-2',
      originalUrl: SAMPLE_MEDIA_LINKS[2].url,
      fileName: 'Canon_in_D_Piano.mp3',
      mediaType: 'audio',
      mimeType: 'audio/mpeg',
      totalBytes: 4_800_000,
      downloadedBytes: 4_800_000,
      progress: 100,
      speedBytesPerSec: 0,
      status: 'completed',
      destinationFolder: 'Downloads / MediaDrop',
      timestamp: Date.now() - 7200000,
    },
    {
      id: 'hist-3',
      originalUrl: SAMPLE_MEDIA_LINKS[3].url,
      fileName: 'NASA_Galaxy_NGC4414.jpg',
      mediaType: 'image',
      mimeType: 'image/jpeg',
      totalBytes: 2_100_000,
      downloadedBytes: 2_100_000,
      progress: 100,
      speedBytesPerSec: 0,
      status: 'completed',
      destinationFolder: 'Downloads / MediaDrop',
      timestamp: Date.now() - 86400000,
    },
  ]);

  // Handle incoming shared URL from external intent simulation
  useEffect(() => {
    if (sharedUrlPayload) {
      setUrlInput(sharedUrlPayload);
      setActiveTab('download');
      handleInspectLink(sharedUrlPayload, autoStartOnShare);
      onClearSharedUrl();
    }
  }, [sharedUrlPayload]);

  // Inspect link metadata
  const handleInspectLink = async (targetUrl: string, autoStart: boolean = false) => {
    if (!targetUrl.trim()) return;
    setIsProbing(true);

    const cleanUrl = targetUrl.trim();
    try {
      const resolved = await resolveMediaUrl(cleanUrl);
      setProbedData({
        fileName: resolved.fileName,
        mimeType: resolved.mimeType,
        mediaType: resolved.mediaType,
        sizeFormatted: resolved.approxSize,
        totalBytes: resolved.totalBytes,
      });

      if (autoStart) {
        startDownloadWithMeta(
          cleanUrl,
          resolved.fileName,
          resolved.mediaType,
          resolved.mimeType,
          resolved.totalBytes
        );
      }
    } catch (e) {
      console.warn('Failed to resolve URL:', e);
      // Fallback
      setProbedData({
        fileName: 'media_download.mp4',
        mimeType: 'video/mp4',
        mediaType: 'video',
        sizeFormatted: '~15.0 MB',
        totalBytes: 15_000_000,
      });
    } finally {
      setIsProbing(false);
    }
  };

  // Trigger actual file download to user's computer/phone
  const triggerActualDownload = (url: string, fileName: string) => {
    downloadRealFileToDevice(url, fileName);
    setDownloadToast(`Saved "${fileName.slice(0, 30)}..." to Downloads!`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  // Start real or chunked download
  const startDownloadWithMeta = (
    url: string,
    fileName: string,
    mediaType: MediaType,
    mimeType: string,
    totalBytes: number
  ) => {
    const newItem: SimulatedDownloadItem = {
      id: 'dl-' + Date.now(),
      originalUrl: url,
      fileName,
      mediaType,
      mimeType,
      totalBytes,
      downloadedBytes: 0,
      progress: 0,
      speedBytesPerSec: 4_500_000,
      status: 'downloading',
      destinationFolder: chosenFolder,
      timestamp: Date.now(),
    };

    setActiveDownload(newItem);

    // Also trigger actual file download to the user's real browser/device downloads!
    triggerActualDownload(url, fileName);
  };

  // Timer loop for active download progress simulation & completion
  useEffect(() => {
    if (!activeDownload || activeDownload.status !== 'downloading') return;

    const interval = setInterval(() => {
      setActiveDownload((prev) => {
        if (!prev || prev.status !== 'downloading') return prev;

        const speed = Math.floor(Math.random() * 1_200_000) + 3_800_000;
        const chunk = Math.floor(speed * 0.25);
        const nextBytes = Math.min(prev.downloadedBytes + chunk, prev.totalBytes);
        const nextProgress = Math.min(100, Math.round((nextBytes / prev.totalBytes) * 100));

        if (nextBytes >= prev.totalBytes) {
          const completedItem: SimulatedDownloadItem = {
            ...prev,
            downloadedBytes: prev.totalBytes,
            progress: 100,
            status: 'completed',
            speedBytesPerSec: 0,
          };

          setHistoryItems((hist) => [completedItem, ...hist]);
          return completedItem;
        }

        return {
          ...prev,
          downloadedBytes: nextBytes,
          progress: nextProgress,
          speedBytesPerSec: speed,
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [activeDownload?.status]);

  const handlePauseResume = () => {
    if (!activeDownload) return;
    setActiveDownload((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: prev.status === 'downloading' ? 'paused' : 'downloading',
      };
    });
  };

  const handleCancelDownload = () => {
    if (!activeDownload) return;
    setActiveDownload((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    setTimeout(() => setActiveDownload(null), 1200);
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec >= 1024 * 1024) return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
    return (bytesPerSec / 1024).toFixed(0) + ' KB/s';
  };

  // Current system clock
  const [clock, setClock] = useState('10:42');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto flex flex-col items-center select-none">
      {/* Device Outer Frame (Simulating modern Android Device) */}
      <div className="relative w-[360px] sm:w-[390px] h-[780px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col">
        {/* Hardware Frame Elements: Side buttons hint */}
        <div className="absolute -left-[7px] top-28 w-[3px] h-12 bg-slate-700 rounded-l-sm" />
        <div className="absolute -left-[7px] top-44 w-[3px] h-12 bg-slate-700 rounded-l-sm" />
        <div className="absolute -right-[7px] top-36 w-[3px] h-16 bg-slate-700 rounded-r-sm" />

        {/* Device Screen Container */}
        <div className="relative w-full h-full bg-slate-900 rounded-[38px] overflow-hidden flex flex-col border border-slate-800">
          {/* Top Status Bar with Camera Hole */}
          <div className="relative z-30 flex items-center justify-between px-6 pt-2 pb-1 text-[11px] font-mono text-slate-300">
            <span className="font-semibold">{clock}</span>

            {/* Camera Punch Hole */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 bg-black rounded-full border border-slate-800/80 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5">
              {activeDownload && activeDownload.status === 'downloading' && (
                <button
                  type="button"
                  onClick={() => setShowNotificationShade(!showNotificationShade)}
                  className="text-indigo-400 hover:text-indigo-300 transition-transform active:scale-90"
                  title="Toggle Android Notification Shade"
                >
                  <Download className="w-3.5 h-3.5 animate-bounce" />
                </button>
              )}
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <div className="text-[10px] font-sans font-bold">5G</div>
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>

          {/* Download Started Toast Alert */}
          {downloadToast && (
            <div className="absolute top-10 left-4 right-4 z-50 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
              <Check className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{downloadToast}</span>
            </div>
          )}

          {/* Android Notification Shade Overlay (when open or active download) */}
          {showNotificationShade && activeDownload && (
            <div className="absolute top-8 left-3 right-3 z-40 bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white">
                    <Download className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">MediaDrop • Downloading</span>
                </div>
                <button
                  onClick={() => setShowNotificationShade(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-slate-200 truncate max-w-[200px]">
                    {activeDownload.fileName}
                  </span>
                  <span className="text-indigo-400 font-mono">{activeDownload.progress}%</span>
                </div>

                {/* Android Native Style Linear Progress */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${activeDownload.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>
                    {formatBytes(activeDownload.downloadedBytes)} / {formatBytes(activeDownload.totalBytes)}
                  </span>
                  <span>{formatSpeed(activeDownload.speedBytesPerSec)}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={handlePauseResume}
                    className="px-2 py-0.5 text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 rounded font-medium"
                  >
                    {activeDownload.status === 'downloading' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={handleCancelDownload}
                    className="px-2 py-0.5 text-[10px] text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Android App Top Bar */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-600/30">
                MD
              </div>
              <div>
                <h1 className="text-xs font-bold text-slate-100 tracking-tight leading-none">MediaDrop</h1>
                <p className="text-[10px] text-slate-400 leading-tight">Android Media Downloader</p>
              </div>
            </div>

            {/* Quick Share Intent Simulator Button */}
            <button
              onClick={onOpenShareIntent}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <Share2 className="w-3 h-3 text-indigo-400" />
              <span>Simulate Share</span>
            </button>
          </div>

          {/* Screen Body Content */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5">
            {/* TAB 1: DOWNLOAD */}
            {activeTab === 'download' && (
              <>
                {/* Simulated Intent Banner if triggered */}
                {sharedSourceApp && (
                  <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs text-indigo-300">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Shared from {sharedSourceApp}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                      ACTION_SEND
                    </span>
                  </div>
                )}

                {/* URL Input Box */}
                <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Media URL</label>
                    <button
                      type="button"
                      onClick={() => {
                        const random = SAMPLE_MEDIA_LINKS[Math.floor(Math.random() * SAMPLE_MEDIA_LINKS.length)];
                        setUrlInput(random.url);
                        handleInspectLink(random.url);
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Random Sample</span>
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setProbedData(null);
                      }}
                      rows={2}
                      placeholder="Paste MP4, MP3, or image link..."
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none pr-8"
                    />
                    {urlInput && (
                      <button
                        onClick={() => {
                          setUrlInput('');
                          setProbedData(null);
                        }}
                        className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sample Media Chips */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400">Quick Test Samples:</div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUrlInput(SAMPLE_MEDIA_LINKS[0].url);
                          handleInspectLink(SAMPLE_MEDIA_LINKS[0].url);
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        🎥 Big Buck (MP4)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUrlInput(SAMPLE_MEDIA_LINKS[2].url);
                          handleInspectLink(SAMPLE_MEDIA_LINKS[2].url);
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        🎵 Canon Piano (MP3)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUrlInput(SAMPLE_MEDIA_LINKS[3].url);
                          handleInspectLink(SAMPLE_MEDIA_LINKS[3].url);
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        🖼️ Galaxy (JPG)
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInspectLink(urlInput)}
                    disabled={!urlInput.trim() || isProbing}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    {isProbing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Inspecting Stream...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Inspect & Probe URL</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Storage Access Framework (SAF) Folder Selection */}
                <div
                  onClick={onOpenFolderPicker}
                  className="bg-slate-800/40 border border-slate-700/70 hover:border-teal-500/50 rounded-2xl p-3 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-teal-400 font-semibold tracking-wide uppercase">
                        Chosen Destination Folder (SAF)
                      </div>
                      <div className="text-xs font-medium text-slate-200 truncate">{chosenFolder}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Probed Details Card */}
                {probedData && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                        {probedData.mediaType === 'video' && <Film className="w-4 h-4" />}
                        {probedData.mediaType === 'audio' && <Volume2 className="w-4 h-4" />}
                        {probedData.mediaType === 'image' && <ImageIcon className="w-4 h-4" />}
                        {probedData.mediaType === 'generic' && <Download className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-100 truncate">{probedData.fileName}</div>
                        <div className="text-[10px] text-slate-400">
                          {probedData.mimeType} · {probedData.sizeFormatted}
                        </div>
                      </div>
                    </div>

                    {extractYouTubeId(urlInput.trim()) ? (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                          <span>YouTube stream detected. Choose download format:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startDownloadWithMeta(
                                urlInput.trim(),
                                probedData.fileName.replace(/\.[^/.]+$/, '') + '.mp4',
                                'video',
                                'video/mp4',
                                probedData.totalBytes
                              )
                            }
                            disabled={activeDownload?.status === 'downloading'}
                            className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Download MP4</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              startDownloadWithMeta(
                                urlInput.trim(),
                                probedData.fileName.replace(/\.[^/.]+$/, '') + '.mp3',
                                'audio',
                                'audio/mpeg',
                                6_500_000
                              )
                            }
                            disabled={activeDownload?.status === 'downloading'}
                            className="py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Download MP3</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          startDownloadWithMeta(
                            urlInput.trim(),
                            probedData.fileName,
                            probedData.mediaType,
                            probedData.mimeType,
                            probedData.totalBytes
                          )
                        }
                        disabled={activeDownload?.status === 'downloading'}
                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download to Chosen Folder & Save</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Active Download Progress Card */}
                {activeDownload && (
                  <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2 shadow-inner">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                        {activeDownload.fileName}
                      </span>
                      <span className="font-mono text-indigo-400 font-bold">{activeDownload.progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${
                          activeDownload.status === 'completed'
                            ? 'bg-emerald-500'
                            : activeDownload.status === 'paused'
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${activeDownload.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        {formatBytes(activeDownload.downloadedBytes)} / {formatBytes(activeDownload.totalBytes)}
                      </span>
                      <span>
                        {activeDownload.status === 'completed'
                          ? 'Saved to folder'
                          : activeDownload.status === 'paused'
                          ? 'Paused'
                          : formatSpeed(activeDownload.speedBytesPerSec)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {activeDownload.status === 'completed' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>File saved to {chosenFolder} &amp; Browser Downloads!</span>
                          </div>

                          <div className="text-[10px] text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                            <span>Check your Chrome/Phone Downloads bar</span>
                            <span className="font-mono text-white text-[9px] bg-indigo-600/50 px-1.5 py-0.5 rounded">Downloaded</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => triggerActualDownload(activeDownload.originalUrl, activeDownload.fileName)}
                              className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Save to Disk Again</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenPlayer(activeDownload)}
                              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
                            >
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Play Media</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={handlePauseResume}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5"
                          >
                            {activeDownload.status === 'downloading' ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>Resume</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelDownload}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg flex items-center justify-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200">Downloaded Files</h3>
                  <span className="text-[10px] text-slate-400">{historyItems.length} items</span>
                </div>

                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onOpenPlayer(item)}
                    className="p-2.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        {item.mediaType === 'video' && <Film className="w-4 h-4" />}
                        {item.mediaType === 'audio' && <Volume2 className="w-4 h-4" />}
                        {item.mediaType === 'image' && <ImageIcon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{item.fileName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatBytes(item.totalBytes)} · {item.destinationFolder}
                        </p>
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-200">App Preferences</h3>

                <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Auto-start on Shared Link</p>
                      <p className="text-[10px] text-slate-400">Download starts instantly when shared</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoStartOnShare}
                      onChange={(e) => setAutoStartOnShare(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                    />
                  </div>

                  <div className="h-px bg-slate-700/50" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Wi-Fi Only Downloads</p>
                      <p className="text-[10px] text-slate-400">Avoid mobile data consumption</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={wifiOnly}
                      onChange={(e) => setWifiOnly(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                    />
                  </div>

                  <div className="h-px bg-slate-700/50" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Download Notifications</p>
                      <p className="text-[10px] text-slate-400">Foreground service status in shade</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-2xl text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Target Platform</div>
                  <div>Android 15 (API 35) · Jetpack Compose · Kotlin 2.1</div>
                  <div className="font-mono text-[10px] text-slate-500">Package: com.mediadrop.app</div>
                </div>
              </div>
            )}
          </div>

          {/* Android Navigation Tab Bar (Bottom Thumb Zone) */}
          <div className="h-14 bg-slate-950 border-t border-slate-800 px-4 grid grid-cols-3 items-center">
            <button
              type="button"
              onClick={() => setActiveTab('download')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'download' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-0.5">Download</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'history' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-0.5">History</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-0.5">Settings</span>
            </button>
          </div>

          {/* Android Gesture Bar */}
          <div className="h-4 bg-slate-950 flex items-center justify-center pb-1">
            <div className="w-24 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
