import React, { useState, useEffect } from 'react';
import { ViewMode } from '../types';
import { Wifi, Battery, Signal, Minus, Square, X } from 'lucide-react';

interface DeviceFrameWrapperProps {
  viewMode: ViewMode;
  children: React.ReactNode;
}

export const DeviceFrameWrapper: React.FC<DeviceFrameWrapperProps> = ({ viewMode, children }) => {
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // If on actual mobile device or auto view, always use full viewport width
  if (isMobileScreen || viewMode === 'auto') {
    return <div className="flex-1 flex flex-col w-full max-w-full overflow-hidden">{children}</div>;
  }

  if (viewMode === 'android') {
    return (
      <div className="flex-1 bg-[#05070d] p-3 sm:p-6 flex items-center justify-center overflow-auto min-h-[calc(100dvh-57px)]">
        {/* Android Phone Mockup Frame */}
        <div className="w-[380px] max-w-full h-[760px] max-h-[88vh] bg-[#0c101d] rounded-[44px] border-[8px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] flex flex-col overflow-hidden relative">
          {/* Top Notch / Camera Cutout */}
          <div className="h-7 bg-[#0c101d] flex items-center justify-between px-6 pt-1 select-none z-30 shrink-0 text-[11px] font-medium text-slate-300">
            <span>9:41</span>
            <div className="w-16 h-3.5 bg-black rounded-full mx-auto -mt-1 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Phone Screen Body */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-[#090d16]">
            {children}
          </div>

          {/* Android Home Navigation Gesture Bar */}
          <div className="h-4 bg-[#090d16] flex items-center justify-center select-none z-30 shrink-0">
            <div className="w-24 h-1 bg-slate-500/50 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'windows') {
    return (
      <div className="flex-1 bg-[#05070d] p-3 sm:p-6 flex items-center justify-center overflow-auto min-h-[calc(100dvh-57px)]">
        {/* Windows 11 App Window Frame */}
        <div className="w-full max-w-6xl h-[780px] max-h-[88vh] bg-[#090d16] rounded-xl border border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col overflow-hidden">
          {/* Windows Titlebar */}
          <div className="h-9 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between px-3 select-none text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#76b900]" />
              <span className="font-medium text-slate-200 truncate">SyncWave AI Studio — Windows 11</span>
            </div>
            <div className="flex items-center">
              <button className="h-9 w-9 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button className="h-9 w-9 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <Square className="w-3 h-3" />
              </button>
              <button className="h-9 w-9 flex items-center justify-center hover:bg-rose-600 text-slate-400 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-[#090d16]">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return <div className="flex-1 flex flex-col w-full max-w-full overflow-hidden">{children}</div>;
};
