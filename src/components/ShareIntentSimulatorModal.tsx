import React, { useState } from 'react';
import { Share2, X, Send, Sparkles, ExternalLink, Globe, MessageSquare, Twitter } from 'lucide-react';
import { SAMPLE_MEDIA_LINKS } from '../data/sampleLinks';

interface ShareIntentSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToMediaDrop: (url: string, sourceApp: string) => void;
}

export const ShareIntentSimulatorModal: React.FC<ShareIntentSimulatorModalProps> = ({
  isOpen,
  onClose,
  onShareToMediaDrop,
}) => {
  const [selectedApp, setSelectedApp] = useState<'chrome' | 'twitter' | 'reddit' | 'telegram' | 'custom'>('chrome');
  const [customUrl, setCustomUrl] = useState(SAMPLE_MEDIA_LINKS[0].url);

  if (!isOpen) return null;

  const appPresets = [
    {
      id: 'chrome' as const,
      name: 'Google Chrome',
      subtitle: 'Direct web media link',
      url: SAMPLE_MEDIA_LINKS[0].url,
      icon: Globe,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'twitter' as const,
      name: 'Twitter / X',
      subtitle: 'Post containing video clip',
      url: SAMPLE_MEDIA_LINKS[1].url,
      icon: Twitter,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      id: 'reddit' as const,
      name: 'Reddit',
      subtitle: 'Shared audio & podcast link',
      url: SAMPLE_MEDIA_LINKS[2].url,
      icon: MessageSquare,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
    {
      id: 'telegram' as const,
      name: 'Telegram / Chat',
      subtitle: 'High-res image asset',
      url: SAMPLE_MEDIA_LINKS[3].url,
      icon: Send,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  const handleSelectPreset = (preset: typeof appPresets[0]) => {
    setSelectedApp(preset.id);
    setCustomUrl(preset.url);
  };

  const handleSend = () => {
    if (!customUrl.trim()) return;
    const currentAppName = selectedApp === 'custom' ? 'External App' : appPresets.find((a) => a.id === selectedApp)?.name || 'Shared App';
    onShareToMediaDrop(customUrl.trim(), currentAppName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Simulate Android Share Intent</h3>
              <p className="text-xs text-slate-400">Test how MediaDrop intercepts Intent.ACTION_SEND</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source App Presets */}
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-300 block mb-2">
            1. Select Simulated Sending App:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {appPresets.map((app) => {
              const IconComp = app.icon;
              const isSelected = selectedApp === app.id;
              return (
                <button
                  key={app.id}
                  onClick={() => handleSelectPreset(app)}
                  type="button"
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 ring-1 ring-indigo-500/30'
                      : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1.5 rounded-lg border ${app.color}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold">{app.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{app.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* URL Payload */}
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            2. Shared Link Payload (Intent.EXTRA_TEXT):
          </label>
          <textarea
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setSelectedApp('custom');
            }}
            rows={2}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-indigo-300 focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Paste any direct media link (.mp4, .mp3, .jpg, etc.)"
          />
        </div>

        {/* Quick Sample Media Links */}
        <div className="mt-3">
          <div className="text-[11px] text-slate-400 mb-1.5">Or pick another test media link:</div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_MEDIA_LINKS.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCustomUrl(sample.url);
                  setSelectedApp('custom');
                }}
                className="text-[11px] px-2 py-1 rounded-md bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!customUrl.trim()}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Send ACTION_SEND Intent</span>
          </button>
        </div>
      </div>
    </div>
  );
};
