import React, { useState } from 'react';
import { Folder, FolderPlus, Check, X, HardDrive, Smartphone, ShieldCheck } from 'lucide-react';

interface SafFolderPickerModalProps {
  isOpen: boolean;
  currentFolder: string;
  onClose: () => void;
  onSelectFolder: (folderPath: string, folderUri: string) => void;
}

export const SafFolderPickerModal: React.FC<SafFolderPickerModalProps> = ({
  isOpen,
  currentFolder,
  onClose,
  onSelectFolder,
}) => {
  const [selectedPath, setSelectedPath] = useState(currentFolder);
  const [customFolderInput, setCustomFolderInput] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  if (!isOpen) return null;

  const standardFolders = [
    {
      name: 'Downloads / MediaDrop',
      path: '/storage/emulated/0/Download/MediaDrop',
      uri: 'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FMediaDrop',
      description: 'Recommended for media downloads',
    },
    {
      name: 'Movies & Videos',
      path: '/storage/emulated/0/Movies',
      uri: 'content://com.android.externalstorage.documents/tree/primary%3AMovies',
      description: 'System video library folder',
    },
    {
      name: 'Music & Audio',
      path: '/storage/emulated/0/Music/Podcasts',
      uri: 'content://com.android.externalstorage.documents/tree/primary%3AMusic%2FPodcasts',
      description: 'System audio & podcast directory',
    },
    {
      name: 'Pictures & Wallpapers',
      path: '/storage/emulated/0/Pictures/MediaDrop',
      uri: 'content://com.android.externalstorage.documents/tree/primary%3APictures%2FMediaDrop',
      description: 'System image library folder',
    },
    {
      name: 'SD Card / External Storage',
      path: '/storage/XXXX-XXXX/Downloads',
      uri: 'content://com.android.externalstorage.documents/tree/XXXX-XXXX%3ADownloads',
      description: 'Removable SD Card storage',
    },
  ];

  const handleConfirm = () => {
    const found = standardFolders.find((f) => f.name === selectedPath || f.path === selectedPath);
    if (found) {
      onSelectFolder(found.name, found.uri);
    } else {
      const generatedUri = `content://com.android.externalstorage.documents/tree/primary%3A${encodeURIComponent(selectedPath)}`;
      onSelectFolder(selectedPath, generatedUri);
    }
    onClose();
  };

  const handleCreateFolder = () => {
    if (customFolderInput.trim()) {
      const newName = `Custom / ${customFolderInput.trim()}`;
      setSelectedPath(newName);
      setShowNewFolderInput(false);
      setCustomFolderInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Android Document Tree Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Storage Access Framework</h3>
              <p className="text-[11px] text-slate-400">Select directory for download access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SAF Permissions Banner */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 text-[11px] text-teal-300">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Android will grant persistent write access (takePersistableUriPermission)</span>
        </div>

        {/* Directory List */}
        <div className="p-4 max-h-72 overflow-y-auto space-y-2">
          {standardFolders.map((folder, idx) => {
            const isSelected = selectedPath === folder.name || selectedPath === folder.path;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPath(folder.name)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-teal-500/10 border-teal-500/40 text-slate-100'
                    : 'bg-slate-800/40 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-slate-200">{folder.name}</p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">{folder.path}</p>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0 ml-2" />}
              </button>
            );
          })}

          {showNewFolderInput ? (
            <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl space-y-2">
              <input
                type="text"
                value={customFolderInput}
                onChange={(e) => setCustomFolderInput(e.target.value)}
                placeholder="Folder name, e.g. Downloads/Anime"
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-teal-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderInput(false)}
                  className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="px-3 py-1 text-[11px] font-medium bg-teal-600 text-white rounded-md hover:bg-teal-500"
                >
                  Use Folder
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewFolderInput(true)}
              className="w-full py-2 px-3 border border-dashed border-slate-700/80 hover:border-teal-500/50 rounded-xl text-xs text-slate-400 hover:text-teal-300 flex items-center justify-center gap-2 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create or specify custom directory</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-all"
          >
            Grant Access & Use This Folder
          </button>
        </div>
      </div>
    </div>
  );
};
