import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  FolderTree,
  Key,
  Layers,
  Share2,
  CheckCircle,
  ExternalLink,
  Shield,
  Zap,
  ArrowRight,
  Folder,
  Radio,
  FileCode,
  Github,
} from 'lucide-react';
import { DeviceSimulator } from './components/DeviceSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { GitHubActionsWizard } from './components/GitHubActionsWizard';
import { ShareIntentSimulatorModal } from './components/ShareIntentSimulatorModal';
import { SafFolderPickerModal } from './components/SafFolderPickerModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import { SimulatedDownloadItem } from './types';
import { generateAndDownloadProjectZip } from './utils/zipExport';

export default function App() {
  const [activeView, setActiveView] = useState<'simulator' | 'code' | 'cicd' | 'architecture'>('simulator');

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [activeMediaItem, setActiveMediaItem] = useState<SimulatedDownloadItem | null>(null);

  // Simulated SAF chosen folder
  const [chosenFolder, setChosenFolder] = useState('Downloads / MediaDrop');
  const [chosenFolderUri, setChosenFolderUri] = useState('content://com.android.externalstorage.documents/tree/primary%3ADownload%2FMediaDrop');

  // Shared URL payload passed into the simulator
  const [sharedUrlPayload, setSharedUrlPayload] = useState<string | null>(null);
  const [sharedSourceApp, setSharedSourceApp] = useState<string>('');

  // Handle simulated intent share
  const handleShareToMediaDrop = (url: string, sourceApp: string) => {
    setSharedUrlPayload(url);
    setSharedSourceApp(sourceApp);
    setActiveView('simulator');
  };

  const handleDownloadZip = async () => {
    await generateAndDownloadProjectZip();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Contract: 3 zones (Brand wordmark — Nav links — 1 primary action) */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('simulator');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-600/30">
            MD
          </div>
          <span>MediaDrop</span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveView('simulator')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'simulator' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Live Simulator
          </button>
          <button
            onClick={() => setActiveView('code')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'code' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Project Source Code
          </button>
          <button
            onClick={() => setActiveView('cicd')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'cicd' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            GitHub Actions & Signed APK
          </button>
          <button
            onClick={() => setActiveView('architecture')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'architecture' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Android Architecture
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadZip}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project (.ZIP)</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* VIEW 1: LIVE SIMULATOR */}
        {activeView === 'simulator' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Context Hero Card */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Interactive Android 15 & Jetpack Compose Mockup</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 text-wrap-balance">
                  Personal Media Downloader for Android
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Accepts shared direct media links (MP4, MP3, Images) across Chrome, Twitter/X, Reddit, or Telegram,
                  saves them directly to your chosen Storage Access Framework (SAF) folder, and runs in the background
                  with foreground notifications.
                </p>
              </div>

              {/* Action shortcuts */}
              <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
                <a
                  href="https://github.com/sajju8378/VidDown/actions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Android APK (Artifacts)</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Simulate "Share to MediaDrop"</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFolderPickerOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Folder className="w-4 h-4 text-teal-400" />
                  <span>Select Destination Folder</span>
                </button>
              </div>
            </div>

            {/* Split Grid: Left interactive Phone Mockup, Right Feature Deep-Dive & Test Links */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Phone Simulator */}
              <div className="lg:col-span-5 flex justify-center">
                <DeviceSimulator
                  onOpenShareIntent={() => setIsShareModalOpen(true)}
                  onOpenFolderPicker={() => setIsFolderPickerOpen(true)}
                  chosenFolder={chosenFolder}
                  onOpenPlayer={(item) => setActiveMediaItem(item)}
                  sharedUrlPayload={sharedUrlPayload}
                  onClearSharedUrl={() => setSharedUrlPayload(null)}
                  sharedSourceApp={sharedSourceApp}
                />
              </div>

              {/* Right Column: Capabilities, Test Scenarios & Architecture Highlights */}
              <div className="lg:col-span-7 space-y-6">
                {/* Highlights Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-100">Core Capabilities Implemented</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-200">Cross-App Share Target</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Declares <code className="text-indigo-300 font-mono">Intent.ACTION_SEND</code> with <code className="text-indigo-300 font-mono">text/plain</code> in AndroidManifest.xml. Tapping "Share" from Twitter, Reddit, or Chrome pops MediaDrop into the system share sheet.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                        <Folder className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-200">Storage Access Framework (SAF)</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        User picks ANY folder via <code className="text-teal-300 font-mono">OpenDocumentTree()</code>. Permissions are saved permanently via <code className="text-teal-300 font-mono">takePersistableUriPermission</code> in DataStore.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-200">Chunked Streaming & Progress</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        OkHttp streaming engine calculates real-time download speed (MB/s), % completion, and remaining time ETA while writing directly to DocumentFile output stream.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-200">Foreground Service</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Continuous downloads survive app minimization and screen lock with persistent Android notification shade progress bars and instant cancel/pause buttons.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Intent Simulation Walkthrough Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-100">Try Intent Simulation</h2>
                    <span className="text-xs text-indigo-400">Step-by-step test</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Test the complete user flow right now:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">Click "Simulate Share"</p>
                        <p className="text-[11px] text-slate-400">
                          Pick Twitter/X, Chrome, or Reddit to send a sample MP4 video or MP3 link into MediaDrop.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">Automatic Link Inspection</p>
                        <p className="text-[11px] text-slate-400">
                          The app catches <code className="text-indigo-300">EXTRA_TEXT</code>, extracts clean URLs, and probes file size and MIME type.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">Download to Chosen Folder & Play</p>
                        <p className="text-[11px] text-slate-400">
                          Watch the live speed and progress, test pausing, pull down the notification shade, and tap to play the downloaded media in the integrated player!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PROJECT CODE EXPLORER */}
        {activeView === 'code' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <CodeExplorer />
          </div>
        )}

        {/* VIEW 3: GITHUB ACTIONS & SIGNED APK */}
        {activeView === 'cicd' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <GitHubActionsWizard />
          </div>
        )}

        {/* VIEW 4: ANDROID ARCHITECTURE */}
        {activeView === 'architecture' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold text-slate-100">Android Architectural Specifications</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                This app is designed following Google's modern Android architecture guidelines (MVI / Unidirectional Data Flow) targeting Android 15 (API level 35).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wide">
                    <FileCode className="w-4 h-4" />
                    <span>Cross-App Share Interception</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">Intent Filter in AndroidManifest.xml</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Apps like YouTube, Twitter, Reddit, and Chrome share URLs as plain text via <code className="text-indigo-300">Intent.ACTION_SEND</code>. MediaDrop extracts the first valid HTTP/HTTPS URL from any shared text block (even if prefixed with title or caption), cleans tracking query parameters, and immediately initiates the download workflow.
                  </p>
                </div>

                <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wide">
                    <Folder className="w-4 h-4" />
                    <span>Scoped Storage & SAF</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">Storage Access Framework Directory Write</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Rather than requiring legacy broad storage permissions, MediaDrop uses Android's native <code className="text-teal-300">ActivityResultContracts.OpenDocumentTree()</code>. The user designates their chosen folder once. The app persists permissions via <code className="text-teal-300">takePersistableUriPermission()</code>, allowing writing directly to that tree via <code className="text-teal-300">DocumentFile.createFile()</code>.
                  </p>
                </div>

                <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                    <Zap className="w-4 h-4" />
                    <span>OkHttp Chunked Engine</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">Streaming with Byte-Level Progress</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Downloads are streamed in 16KB buffers via <code className="text-amber-300">OkHttpClient</code> with redirect resolution and User-Agent spoofing to bypass hotlinking blocks. Byte counting throttles speed calculations to twice per second for butter-smooth UI rendering without recomposition overhead.
                  </p>
                </div>

                <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <Shield className="w-4 h-4" />
                    <span>Foreground Service Lifecycle</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">Android 14+ Foreground Service (dataSync)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Downloads trigger <code className="text-emerald-300">DownloadForegroundService</code> with type <code className="text-emerald-300">foregroundServiceType="dataSync"</code>. The system notification displays live progress and speed, and includes pending intents for cancellation and opening the app.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>MediaDrop Android Media Downloader</span>
            <span aria-hidden="true">·</span>
            <span>Kotlin 2.1</span>
            <span aria-hidden="true">·</span>
            <span>Jetpack Compose</span>
            <span aria-hidden="true">·</span>
            <span>API 35</span>
          </div>
          <div>
            <span>Ready to build in Android Studio & GitHub Actions CI/CD</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ShareIntentSimulatorModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShareToMediaDrop={handleShareToMediaDrop}
      />

      <SafFolderPickerModal
        isOpen={isFolderPickerOpen}
        currentFolder={chosenFolder}
        onClose={() => setIsFolderPickerOpen(false)}
        onSelectFolder={(name, uri) => {
          setChosenFolder(name);
          setChosenFolderUri(uri);
        }}
      />

      <MediaPlayerModal
        item={activeMediaItem}
        onClose={() => setActiveMediaItem(null)}
      />
    </div>
  );
}
