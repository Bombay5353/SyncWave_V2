import React from 'react';
import { ActiveTab, ViewMode } from '../types';
import { Monitor, Smartphone, RefreshCw, Key, Download, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  roomId: string;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onOpenInstall: () => void;
  syncStatus: 'connected' | 'syncing' | 'offline';
  apiKeySet: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  roomId,
  onOpenSync,
  onOpenSettings,
  onOpenInstall,
  syncStatus,
  apiKeySet,
}) => {
  const { isInstallable } = usePWAInstall();

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-6 px-3 sm:px-5 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-2.5 sm:pb-3 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40 select-none w-full max-w-full overflow-hidden">
      {/* Zone 1: Brand Wordmark (Single line, text element) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('chat');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#76b900] shadow-[0_0_8px_#76b900]" />
          <span>SyncWave</span>
          <span className="text-[10px] sm:text-xs font-mono font-medium text-[#76b900] px-1.5 py-0.5 rounded bg-[#76b900]/10 border border-[#76b900]/20 hidden sm:inline">
            Multi-LLM
          </span>
        </a>
      </div>

      {/* Zone 2: 4-5 Single-line Navigation Links (Visible on desktop) */}
      <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('chat')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'chat' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Chat
        </button>

        <button
          onClick={() => setActiveTab('codex')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'codex' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Codex Studio
        </button>

        <button
          onClick={onOpenSync}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'sync' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : syncStatus === 'connected' ? 'text-[#76b900]' : 'text-rose-400'}`}
          />
          <span>Device Sync</span>
          <span className="font-mono text-xs text-slate-400 font-normal">({roomId})</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'guide' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Android & Windows Steps
        </button>
      </nav>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Device Viewport Preview Toggle (Desktop only) */}
        <div className="hidden lg:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode(viewMode === 'windows' ? 'auto' : 'windows')}
            title="Toggle Windows Desktop Mockup"
            className={`p-1.5 rounded flex items-center gap-1 ${
              viewMode === 'windows' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="text-xs">PC</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'android' ? 'auto' : 'android')}
            title="Toggle Android Phone Mockup"
            className={`p-1.5 rounded flex items-center gap-1 ${
              viewMode === 'android' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-xs">Phone</span>
          </button>
        </div>

        {/* Open in full tab / window */}
        <button
          onClick={() => {
            const baseUrl = typeof window !== 'undefined'
              ? window.location.origin.includes('localhost')
                ? 'https://ais-pre-n3laelskoh6pbbuixx6l37-683064120718.asia-northeast1.run.app'
                : window.location.origin
              : '';
            window.open(`${baseUrl}/?room=${roomId}`, '_blank');
          }}
          title="Open in Full Chrome Tab / Window"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Install Button (Always triggers Install Modal or PWA prompt) */}
        <button
          onClick={onOpenInstall}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>

        {/* API Settings Button */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            apiKeySet
              ? 'bg-[#76b900] hover:bg-[#86d200] text-slate-950 shadow-[0_0_12px_rgba(118,185,0,0.25)]'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{apiKeySet ? 'API Key Active' : 'API Key'}</span>
          <span className="sm:hidden">{apiKeySet ? 'Active' : 'Key'}</span>
        </button>
      </div>
    </header>
  );
};
