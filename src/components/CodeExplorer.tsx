import React, { useState } from 'react';
import {
  FileCode,
  FolderTree,
  Copy,
  Check,
  Download,
  Search,
  ExternalLink,
  Code2,
  FileCheck,
  Terminal,
} from 'lucide-react';
import { ANDROID_PROJECT_FILES } from '../data/androidProjectFiles';
import { AndroidProjectFile } from '../types';
import { generateAndDownloadProjectZip } from '../utils/zipExport';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(ANDROID_PROJECT_FILES[1]); // AndroidManifest.xml or MainActivity
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'kotlin', label: 'Kotlin & Compose' },
    { id: 'gradle', label: 'Gradle Config' },
    { id: 'xml', label: 'Manifest & XML' },
    { id: 'ci', label: 'GitHub Actions' },
  ];

  const filteredFiles = ANDROID_PROJECT_FILES.filter((file) => {
    const matchesCat = selectedCategory === 'all' || file.category === selectedCategory;
    const matchesSearch = file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      setZipProgress(10);
      await generateAndDownloadProjectZip((percent) => {
        setZipProgress(Math.round(percent));
      });
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setTimeout(() => {
        setIsExportingZip(false);
        setZipProgress(0);
      }, 800);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Explorer Top Toolbar */}
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Android Project Source Tree</h2>
            <p className="text-[11px] text-slate-400">
              Clean Architecture with Kotlin 2.1, Jetpack Compose, OkHttp & SAF
            </p>
          </div>
        </div>

        {/* 1-Click ZIP Download Button */}
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isExportingZip}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>
            {isExportingZip ? `Archiving Project (${zipProgress}%)...` : 'Download Android Project (.ZIP)'}
          </span>
        </button>
      </div>

      {/* Main Split: Left File Browser / Right Code Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-[560px]">
        {/* Left Column: File List */}
        <div className="lg:col-span-4 border-r border-slate-800 p-3.5 flex flex-col bg-slate-950/40">
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter files..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[500px]">
            {filteredFiles.map((file, idx) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 shadow-sm'
                      : 'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <FileCode
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-medium truncate text-slate-200">
                      {file.path.split('/').pop()}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-mono">{file.path}</p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{file.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code View */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/70">
          {/* File Header Bar */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono font-semibold text-indigo-300 truncate">
                {selectedFile.path}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                {selectedFile.category}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>

          {/* Description banner */}
          <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800/60 text-xs text-slate-400">
            {selectedFile.description}
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 max-h-[500px]">
            <pre className="relative leading-relaxed">
              <code>
                {selectedFile.content.split('\n').map((line, i) => (
                  <div key={i} className="table-row">
                    <span className="table-cell select-none pr-4 text-right text-slate-600 font-mono text-[11px] w-10">
                      {i + 1}
                    </span>
                    <span className="table-cell whitespace-pre">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
