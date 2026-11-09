import React, { useState, useEffect } from 'react';
import { ActiveTab, ViewMode, CodexSnippet } from './types';
import { useSyncEngine } from './hooks/useSyncEngine';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { CodexView } from './components/CodexView';
import { CrossPlatformGuideView } from './components/CrossPlatformGuideView';
import { SyncModal } from './components/SyncModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallModal } from './components/InstallModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DeviceFrameWrapper } from './components/DeviceFrameWrapper';

export default function App() {
  const {
    roomId,
    changeRoom,
    syncStatus,
    devicePlatform,
    settings,
    updateSettings,
    conversations,
    updateConversations,
    activeConversationId,
    setActiveConversationId,
    snippets,
    updateSnippets,
    activeSnippetId,
    setActiveSnippetId,
  } = useSyncEngine();

  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SyncWave Service Worker registered:', reg.scope))
        .catch((err) => console.log('Service Worker registration skipped:', err));
    }
  }, []);

  const handleSendToCodex = (
    title: string,
    code: string,
    language: CodexSnippet['language']
  ) => {
    const newId = `s-${Date.now()}`;
    const newSnippet: CodexSnippet = {
      id: newId,
      title: title.endsWith(`.${language}`) ? title : `${title}.${language}`,
      language,
      code,
      updatedAt: Date.now(),
    };

    updateSnippets((prev) => [newSnippet, ...prev]);
    setActiveSnippetId(newId);
    setActiveTab('codex');
  };

  const handleImportBackup = (data: { conversations: any[]; snippets: any[] }) => {
    updateConversations(() => data.conversations);
    updateSnippets(() => data.snippets);
  };

  return (
    <div className="h-[100dvh] w-full max-w-full bg-[#070a11] text-slate-100 flex flex-col font-sans selection:bg-[#76b900]/25 selection:text-white overflow-hidden">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        roomId={roomId}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        syncStatus={syncStatus}
        apiKeySet={Boolean(settings.apiKey && settings.apiKey.trim().length > 0)}
      />

      {/* Main View Wrapped in Device Frame */}
      <DeviceFrameWrapper viewMode={viewMode}>
        {activeTab === 'chat' && (
          <ChatView
            conversations={conversations}
            updateConversations={updateConversations}
            activeConversationId={activeConversationId}
            setActiveConversationId={setActiveConversationId}
            settings={settings}
            onSendToCodex={handleSendToCodex}
          />
        )}

        {activeTab === 'codex' && (
          <CodexView
            snippets={snippets}
            updateSnippets={updateSnippets}
            activeSnippetId={activeSnippetId}
            setActiveSnippetId={setActiveSnippetId}
            settings={settings}
          />
        )}

        {activeTab === 'guide' && <CrossPlatformGuideView roomId={roomId} />}
      </DeviceFrameWrapper>

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSync={() => setIsSyncModalOpen(true)}
        syncStatus={syncStatus}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        apiKeySet={Boolean(settings.apiKey && settings.apiKey.trim().length > 0)}
      />

      {/* Installation Center Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        roomId={roomId}
      />

      {/* Sync Pairing Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        roomId={roomId}
        onChangeRoom={changeRoom}
        syncStatus={syncStatus}
        devicePlatform={devicePlatform}
        conversations={conversations}
        snippets={snippets}
        onImportData={handleImportBackup}
      />

      {/* NVIDIA NIM Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
      />
    </div>
  );
}
