import React from 'react';
import { X, Play, Download, Volume2, Film, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { SimulatedDownloadItem } from '../types';

interface MediaPlayerModalProps {
  item: SimulatedDownloadItem | null;
  onClose: () => void;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            {item.mediaType === 'video' && <Film className="w-4 h-4 text-indigo-400 shrink-0" />}
            {item.mediaType === 'audio' && <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {item.mediaType === 'image' && <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />}
            <span className="text-xs font-semibold text-slate-100 truncate">{item.fileName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Content */}
        <div className="p-4 bg-black/40 flex items-center justify-center min-h-[280px]">
          {item.mediaType === 'video' && (
            <video
              src={item.originalUrl}
              controls
              autoPlay
              className="max-h-[360px] w-full rounded-xl bg-black object-contain"
            >
              Your browser does not support the video tag.
            </video>
          )}

          {item.mediaType === 'audio' && (
            <div className="w-full max-w-md p-6 bg-slate-800/80 border border-slate-700 rounded-2xl text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Volume2 className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100 truncate">{item.fileName}</h4>
                <p className="text-xs text-slate-400">{item.mimeType} • Saved in {item.destinationFolder}</p>
              </div>
              <audio src={item.originalUrl} controls autoPlay className="w-full mt-2" />
            </div>
          )}

          {item.mediaType === 'image' && (
            <div className="relative max-h-[380px] overflow-hidden rounded-xl">
              <img
                src={item.originalUrl}
                alt={item.fileName}
                referrerPolicy="no-referrer"
                className="max-h-[380px] w-auto object-contain mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}

          {item.mediaType === 'generic' && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-300">File downloaded to {item.destinationFolder}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{item.originalUrl}</p>
            </div>
          )}
        </div>

        {/* Footer info & Direct open */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div className="truncate max-w-sm">
            <span>Destination: </span>
            <span className="font-mono text-slate-200">{item.destinationFolder}</span>
          </div>
          <a
            href={item.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <span>Open Link in New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
