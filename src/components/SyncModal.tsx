import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Smartphone,
  Monitor,
  Camera,
  RefreshCw,
  Download,
  Upload,
  CameraOff,
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
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
  const [activeTab, setActiveTab] = useState<'qr' | 'scan'>('qr');
  const [newRoomInput, setNewRoomInput] = useState(roomId);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Universal share link that works everywhere (desktop, mobile, browser)
  const universalUrl = `https://ais-pre-n3laelskoh6pbbuixx6l37-683064120718.asia-northeast1.run.app/?room=${encodeURIComponent(roomId)}`;

  // Generate real, high-contrast, camera-scannable QR code
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(universalUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [universalUrl, isOpen]);

  // Clean up camera stream when modal closes or switching tabs
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'scan') {
      stopCamera();
    }
  }, [isOpen, activeTab]);

  // Start in-app camera scanner using jsqr
  const startCamera = async () => {
    setCameraError(null);
    setScannedSuccess(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or platform.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        scanQrLoop();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Could not access device camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const scanQrLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        let extractedRoom = code.data.trim();
        // Check if QR encoded a full URL with ?room=
        try {
          if (extractedRoom.includes('room=')) {
            const urlObj = new URL(extractedRoom);
            const rParam = urlObj.searchParams.get('room');
            if (rParam) extractedRoom = rParam;
          }
        } catch (e) {
          // If not URL, check regex for room code
          const match = extractedRoom.match(/room=([A-Za-z0-9_-]+)/);
          if (match) extractedRoom = match[1];
        }

        extractedRoom = extractedRoom.toUpperCase().trim();

        if (extractedRoom.length > 0) {
          setScannedSuccess(extractedRoom);
          onChangeRoom(extractedRoom);
          stopCamera();
          setTimeout(() => {
            onClose();
          }, 1200);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQrLoop);
  };

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(universalUrl);
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
      onChangeRoom(newRoomInput.trim().toUpperCase());
      onClose();
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
          onClose();
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-[#090d16] border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : 'text-[#76b900]'}`}
            />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Cross-Device Synchronization
            </h2>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            {devicePlatform.includes('Android') ? (
              <Smartphone className="w-4 h-4 text-[#76b900] shrink-0" />
            ) : (
              <Monitor className="w-4 h-4 text-[#76b900] shrink-0" />
            )}
            <span className="font-medium text-white">{devicePlatform}</span>
            <span className="text-slate-600">·</span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'connected'
                  ? 'bg-[#76b900]'
                  : syncStatus === 'syncing'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
              }`}
            />
            <span className="capitalize text-slate-300">{syncStatus}</span>
          </div>
        </div>

        {/* Mode Toggle Tabs: Show QR vs In-App Camera Scanner */}
        <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('qr');
            }}
            className={`flex-1 py-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'qr'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-[#76b900]" />
            <span>Show Room QR Code</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('scan');
              startCamera();
            }}
            className={`flex-1 py-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'scan'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4 text-[#76b900]" />
            <span>Scan with Camera</span>
          </button>
        </div>

        {/* TAB 1: Real Scannable QR Code */}
        {activeTab === 'qr' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* Real Camera-Scannable QR Image */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
              <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-200 inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Scannable QR for room ${roomId}`}
                    className="w-44 h-44 rounded-lg block"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-500 text-xs">
                    Generating scannable QR...
                  </div>
                )}
              </div>
              <p className="text-xs text-white mt-3 font-semibold">Scan with Any Smartphone Camera</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Instantly opens and connects to your live room
              </p>
            </div>

            {/* Room Code & Links */}
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Your Room Code
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-base sm:text-lg font-bold text-white bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-center tracking-widest text-[#76b900]">
                    {roomId}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                    title="Copy Room Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-[#76b900]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Direct Universal Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={universalUrl}
                    className="flex-1 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                    title="Copy Share Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-[#76b900]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveRoom} className="pt-1">
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Switch to Another Room
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRoomInput}
                    onChange={(e) => setNewRoomInput(e.target.value)}
                    placeholder="e.g. SYNC-9999"
                    className="flex-1 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 uppercase font-mono focus:border-[#76b900] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg text-xs transition-colors shrink-0"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: Live In-App Camera Scanner */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
              {scannedSuccess ? (
                <div className="flex flex-col items-center gap-2 text-emerald-400 p-6 text-center">
                  <Check className="w-12 h-12 text-[#76b900] animate-bounce" />
                  <span className="text-base font-bold text-white">QR Code Recognized!</span>
                  <span className="text-xs font-mono text-[#76b900]">Joining Room: {scannedSuccess}</span>
                </div>
              ) : cameraError ? (
                <div className="flex flex-col items-center gap-2 text-rose-400 p-6 text-center text-xs">
                  <CameraOff className="w-8 h-8 text-rose-500 mb-1" />
                  <span className="font-semibold text-white">Camera Unavailable</span>
                  <span className="text-slate-400">{cameraError}</span>
                  <button
                    onClick={startCamera}
                    className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scanner reticle overlay */}
                  <div className="absolute inset-0 border-2 border-[#76b900]/40 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-full h-0.5 bg-[#76b900] shadow-[0_0_8px_#76b900] animate-pulse" />
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-center text-slate-400">
              Point your camera at a SyncWave QR Code on another screen to join that room automatically.
            </p>
          </div>
        )}

        {/* Offline Backup & Restore */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Offline JSON Backup</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
