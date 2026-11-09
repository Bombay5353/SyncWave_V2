import React from 'react';
import { ActiveTab } from '../types';
import { MessageSquare, Code2, RefreshCw, Smartphone, Key } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSync: () => void;
  syncStatus: 'connected' | 'syncing' | 'offline';
  onOpenSettings: () => void;
  apiKeySet: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSync,
  syncStatus,
  onOpenSettings,
  apiKeySet,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/90 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 px-2 select-none">
      <div className="grid grid-cols-5 items-center h-14">
        {/* Chat Tab */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'chat' ? 'text-[#76b900]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">AI Chat</span>
        </button>

        {/* Codex Tab */}
        <button
          onClick={() => setActiveTab('codex')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'codex' ? 'text-[#76b900]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Codex</span>
        </button>

        {/* Device Sync Tab */}
        <button
          onClick={onOpenSync}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-400 hover:text-slate-200 transition-colors relative"
        >
          <div className="relative">
            <RefreshCw
              className={`w-5 h-5 mb-1 ${
                syncStatus === 'syncing' ? 'animate-spin text-amber-400' : syncStatus === 'connected' ? 'text-[#76b900]' : 'text-rose-400'
              }`}
            />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#090d16] ${
                syncStatus === 'connected' ? 'bg-[#76b900]' : syncStatus === 'syncing' ? 'bg-amber-400' : 'bg-rose-500'
              }`}
            />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Sync</span>
        </button>

        {/* Install & Steps Tab */}
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'guide' ? 'text-[#76b900]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">Install Guide</span>
        </button>

        {/* API Settings */}
        <button
          onClick={onOpenSettings}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            apiKeySet ? 'text-[#76b900]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">{apiKeySet ? 'API Active' : 'API Key'}</span>
        </button>
      </div>
    </nav>
  );
};
