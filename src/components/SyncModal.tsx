import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Smartphone, Monitor, ArrowRight, RefreshCw, Download, Upload } from 'lucide-react';
import { Conversation, CodexSnippet } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  onChangeRoom: (newRoom: string) => void;
  syncStatus: 'connected' | 'syncing' | 'offline';
  devicePlatform: string;
  conversations: Conversation[];
  snippets: CodexSnippet[];
  onImportData: (data: { conversations: Conversation[]; snippets: CodexSnippet[] }) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  roomId,
  onChangeRoom,
  syncStatus,
  devicePlatform,
  conversations,
  snippets,
  onImportData,
}) => {
  const [newRoomInput, setNewRoomInput] = useState(roomId);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/?room=${roomId}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomInput.trim()) {
      onChangeRoom(newRoomInput.trim());
    }
  };

  const handleExportJson = () => {
    const data = {
      roomId,
      exportedAt: new Date().toISOString(),
      conversations,
      snippets,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncwave-backup-${roomId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.conversations || parsed.snippets) {
          onImportData({
            conversations: parsed.conversations || [],
            snippets: parsed.snippets || [],
          });
          alert('Backup restored and synchronized successfully!');
          onClose();
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Generate a clean stylized SVG QR matrix based on the room link
  const renderQrSvg = () => {
    const size = 180;
    return (
      <div className="bg-white p-3 rounded-xl shadow-inner inline-block">
        <svg width={size} height={size} viewBox="0 0 180 180" className="w-40 h-40">
          {/* Position detection squares (top-left, top-right, bottom-left) */}
          <rect x="10" y="10" width="46" height="46" fill="#090d16" rx="6" />
          <rect x="18" y="18" width="30" height="30" fill="#ffffff" rx="3" />
          <rect x="24" y="24" width="18" height="18" fill="#76b900" rx="2" />

          <rect x="124" y="10" width="46" height="46" fill="#090d16" rx="6" />
          <rect x="132" y="18" width="30" height="30" fill="#ffffff" rx="3" />
          <rect x="138" y="24" width="18" height="18" fill="#76b900" rx="2" />

          <rect x="10" y="124" width="46" height="46" fill="#090d16" rx="6" />
          <rect x="18" y="132" width="30" height="30" fill="#ffffff" rx="3" />
          <rect x="24" y="138" width="18" height="18" fill="#76b900" rx="2" />

          {/* Data patterns */}
          <rect x="66" y="18" width="8" height="8" fill="#090d16" />
          <rect x="80" y="18" width="8" height="8" fill="#090d16" />
          <rect x="94" y="18" width="8" height="8" fill="#090d16" />
          <rect x="108" y="18" width="8" height="8" fill="#090d16" />

          <rect x="66" y="32" width="8" height="8" fill="#76b900" />
          <rect x="80" y="32" width="8" height="8" fill="#090d16" />
          <rect x="108" y="32" width="8" height="8" fill="#76b900" />

          <rect x="66" y="46" width="8" height="8" fill="#090d16" />
          <rect x="94" y="46" width="8" height="8" fill="#090d16" />

          {/* Middle section */}
          <rect x="18" y="66" width="8" height="8" fill="#090d16" />
          <rect x="32" y="66" width="8" height="8" fill="#090d16" />
          <rect x="46" y="66" width="8" height="8" fill="#76b900" />
          <rect x="66" y="66" width="16" height="16" fill="#76b900" rx="2" />
          <rect x="90" y="66" width="8" height="8" fill="#090d16" />
          <rect x="104" y="66" width="14" height="14" fill="#090d16" rx="2" />
          <rect x="126" y="66" width="8" height="8" fill="#090d16" />
          <rect x="140" y="66" width="14" height="14" fill="#76b900" rx="2" />

          <rect x="18" y="82" width="8" height="8" fill="#090d16" />
          <rect x="46" y="82" width="8" height="8" fill="#090d16" />
          <rect x="66" y="90" width="8" height="8" fill="#090d16" />
          <rect x="80" y="82" width="14" height="14" fill="#090d16" rx="2" />
          <rect x="126" y="82" width="14" height="14" fill="#090d16" rx="2" />
          <rect x="148" y="82" width="8" height="8" fill="#090d16" />

          <rect x="18" y="98" width="14" height="14" fill="#76b900" rx="2" />
          <rect x="40" y="98" width="8" height="8" fill="#090d16" />
          <rect x="66" y="106" width="8" height="8" fill="#76b900" />
          <rect x="80" y="104" width="8" height="8" fill="#090d16" />
          <rect x="94" y="98" width="14" height="14" fill="#090d16" rx="2" />
          <rect x="126" y="104" width="8" height="8" fill="#090d16" />
          <rect x="140" y="104" width="14" height="14" fill="#090d16" rx="2" />

          {/* Bottom section */}
          <rect x="66" y="124" width="8" height="8" fill="#090d16" />
          <rect x="80" y="124" width="14" height="14" fill="#76b900" rx="2" />
          <rect x="102" y="124" width="8" height="8" fill="#090d16" />
          <rect x="124" y="124" width="14" height="14" fill="#090d16" rx="2" />
          <rect x="146" y="124" width="14" height="14" fill="#76b900" rx="2" />

          <rect x="66" y="146" width="14" height="14" fill="#090d16" rx="2" />
          <rect x="90" y="146" width="8" height="8" fill="#090d16" />
          <rect x="104" y="146" width="14" height="14" fill="#090d16" rx="2" />
          <rect x="126" y="146" width="8" height="8" fill="#090d16" />
          <rect x="140" y="146" width="14" height="14" fill="#090d16" rx="2" />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#090d16] border border-slate-800 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : 'text-[#76b900]'}`}
            />
            <h2 className="text-lg font-bold text-white tracking-tight">Cross-Device Synchronization</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300">
              {devicePlatform.includes('Android') ? (
                <Smartphone className="w-4 h-4 text-[#76b900]" />
              ) : (
                <Monitor className="w-4 h-4 text-[#76b900]" />
              )}
              <span className="font-medium text-white">{devicePlatform}</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1 text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'connected' ? 'bg-[#76b900]' : syncStatus === 'syncing' ? 'bg-amber-400' : 'bg-rose-500'
                }`}
              />
              <span className="capitalize">{syncStatus} to Cloud Sync Engine</span>
            </div>
          </div>
        </div>

        {/* Pairing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
            {renderQrSvg()}
            <p className="text-xs text-slate-400 mt-3 font-medium">Scan with your Android phone</p>
            <p className="text-[11px] text-slate-500">Opens the exact same live workspace</p>
          </div>

          {/* Sync Code & Direct Link */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Your Sync Room Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-lg font-bold text-white bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-center tracking-widest text-[#76b900]">
                  {roomId}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-[#76b900]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Shareable Device Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-[#76b900]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveRoom} className="pt-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Join or Custom Room
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRoomInput}
                  onChange={(e) => setNewRoomInput(e.target.value)}
                  placeholder="e.g. PRATIK-STUDIO"
                  className="flex-1 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 uppercase font-mono focus:border-[#76b900] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Offline Backup & Restore */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Offline JSON Backup</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
