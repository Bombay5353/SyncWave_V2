import React, { useState } from 'react';
import { X, Monitor, Smartphone, Download, Copy, Check, ExternalLink, Globe, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose, roomId }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'android'>('windows');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  // Use the canonical production shared URL or current origin
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin.includes('localhost')
        ? 'https://ais-pre-n3laelskoh6pbbuixx6l37-683064120718.asia-northeast1.run.app'
        : window.location.origin
      : 'https://ais-pre-n3laelskoh6pbbuixx6l37-683064120718.asia-northeast1.run.app';

  const fullAppUrl = `${baseUrl}/?room=${roomId}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleOpenInNewTab = () => {
    // Open in separate browser window/tab outside iframe
    const opened = window.open(fullAppUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      // Fallback if popup blocker intercepts
      window.location.href = fullAppUrl;
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      // Guide user to pop out first
      handleOpenInNewTab();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-[#090d16] border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#76b900]" />
            <h2 className="text-lg font-bold text-white tracking-tight">Open & Install on PC / Android</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'windows' ? 'bg-[#76b900] text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Open & Install on PC</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'android' ? 'bg-[#76b900] text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Open & Install on Android</span>
          </button>
        </div>

        {/* Tab 1: Windows PC */}
        {activeTab === 'windows' && (
          <div className="space-y-4 text-xs">
            {/* Primary Action: Open Full Browser Tab */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-[#76b900]/40 text-center space-y-3 shadow-lg">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/20 px-2.5 py-0.5 rounded-full">
                <Laptop className="w-3.5 h-3.5" />
                <span>Step 1: Open in Dedicated Chrome/Edge Tab</span>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm font-medium max-w-md mx-auto">
                Currently, you are inside the Google AI Studio editor. Click below to launch the full app in its own browser window:
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleOpenInNewTab}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#76b900] hover:bg-[#86d200] rounded-xl transition-all shadow-md inline-flex items-center justify-center gap-2 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch in Full Chrome Window</span>
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all inline-flex items-center justify-center gap-1.5"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-[#76b900]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUrl ? 'URL Copied!' : 'Copy Direct URL'}</span>
                </button>
              </div>
            </div>

            {/* Direct URL Display */}
            <div>
              <label className="text-slate-400 font-semibold block mb-1">
                Direct Application Web URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullAppUrl}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-[11px] truncate select-all"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#76b900]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-[#76b900]/20 text-[#76b900] flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Step 2: Install as a Windows Desktop App</span>
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed pl-1 text-[11px]">
                <li>
                  Once opened in your browser window, look at the <strong>right side of your Chrome/Edge address bar</strong>.
                </li>
                <li>
                  Click the <strong>Install App</strong> icon (a computer monitor icon with a down arrow).
                </li>
                <li>
                  Click <strong>Install</strong>. SyncWave will instantly turn into an independent Windows desktop application with taskbar pinning and keyboard shortcuts!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: Android Phone */}
        {activeTab === 'android' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="bg-white p-2.5 rounded-lg inline-block shadow-inner">
                  <svg width="140" height="140" viewBox="0 0 180 180" className="w-32 h-32">
                    <rect x="10" y="10" width="46" height="46" fill="#090d16" rx="6" />
                    <rect x="18" y="18" width="30" height="30" fill="#ffffff" rx="3" />
                    <rect x="24" y="24" width="18" height="18" fill="#76b900" rx="2" />

                    <rect x="124" y="10" width="46" height="46" fill="#090d16" rx="6" />
                    <rect x="132" y="18" width="30" height="30" fill="#ffffff" rx="3" />
                    <rect x="138" y="24" width="18" height="18" fill="#76b900" rx="2" />

                    <rect x="10" y="124" width="46" height="46" fill="#090d16" rx="6" />
                    <rect x="18" y="132" width="30" height="30" fill="#ffffff" rx="3" />
                    <rect x="24" y="138" width="18" height="18" fill="#76b900" rx="2" />

                    <rect x="66" y="18" width="8" height="8" fill="#090d16" />
                    <rect x="80" y="18" width="8" height="8" fill="#090d16" />
                    <rect x="108" y="18" width="8" height="8" fill="#090d16" />
                    <rect x="66" y="32" width="8" height="8" fill="#76b900" />
                    <rect x="80" y="32" width="8" height="8" fill="#090d16" />
                    <rect x="18" y="66" width="8" height="8" fill="#090d16" />
                    <rect x="66" y="66" width="16" height="16" fill="#76b900" rx="2" />
                    <rect x="104" y="66" width="14" height="14" fill="#090d16" rx="2" />
                    <rect x="140" y="66" width="14" height="14" fill="#76b900" rx="2" />
                    <rect x="80" y="82" width="14" height="14" fill="#090d16" rx="2" />
                    <rect x="18" y="98" width="14" height="14" fill="#76b900" rx="2" />
                    <rect x="80" y="124" width="14" height="14" fill="#76b900" rx="2" />
                    <rect x="146" y="124" width="14" height="14" fill="#76b900" rx="2" />
                    <rect x="104" y="146" width="14" height="14" fill="#090d16" rx="2" />
                  </svg>
                </div>
                <p className="font-semibold text-white mt-2">Scan with Android Camera</p>
                <p className="text-[11px] text-slate-500">Opens the exact same room on phone</p>
              </div>

              {/* URL & Sync Code */}
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Android Browser URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={fullAppUrl}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono text-[11px] truncate select-all"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#76b900]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Sync Code (Pre-configured):</span>
                  <span className="text-base font-mono font-bold text-[#76b900] tracking-wider">{roomId}</span>
                </div>
              </div>
            </div>

            {/* Android Home Screen Steps */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[#76b900] flex items-center justify-center text-xs">
                  📱
                </span>
                <span>Install on Android (3 Taps):</span>
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed pl-1 text-[11px]">
                <li>Open the URL in <strong>Google Chrome on your Android phone</strong>.</li>
                <li>Tap the <strong>three dots (⋮)</strong> menu in the upper-right corner.</li>
                <li>
                  Tap <strong className="text-[#76b900]">"Install app"</strong> (or "Add to Home screen").
                </li>
                <li>
                  An app icon appears in your App Drawer, running full-screen with real-time sync!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 font-mono">Sync Room: {roomId}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
