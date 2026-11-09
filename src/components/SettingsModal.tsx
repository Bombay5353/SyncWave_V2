import React, { useState } from 'react';
import { X, Eye, EyeOff, CheckCircle2, AlertCircle, Key, Cpu, Sliders, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { testNvidiaConnection, CURATED_MODELS } from '../services/nvidiaApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testNvidiaConnection(settings.apiKey, settings.baseUrl);
    setTestResult(result);
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#090d16] border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#76b900]" />
            <h2 className="text-lg font-bold text-white tracking-tight">NVIDIA NIM API Configuration</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          {/* Base URL */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              NVIDIA NIM Base URL
            </label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => updateSettings({ baseUrl: e.target.value })}
              className="w-full bg-slate-900 text-white font-mono rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-[#76b900]"
              placeholder="https://integrate.api.nvidia.com/v1"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Default OpenAI-compatible endpoint for NVIDIA NIM microservices.
            </p>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">
                NVIDIA API Key <span className="text-slate-500 font-normal">(nvapi-...)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showKey ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
                placeholder="nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 bg-slate-900 text-white font-mono rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-[#76b900]"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !settings.apiKey}
                className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  settings.apiKey && !isTesting
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                }`}
              >
                {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Test Key</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2 p-2.5 rounded-lg flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Default Model User Text Input */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Default NVIDIA NIM Model ID
            </label>
            <input
              type="text"
              value={settings.defaultModel}
              onChange={(e) => updateSettings({ defaultModel: e.target.value })}
              placeholder="e.g. meta/llama-3.3-70b-instruct or deepseek-ai/deepseek-r1"
              className="w-full bg-slate-900 text-white font-mono rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-[#76b900] text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Type any model ID supported by your endpoint (e.g. <span className="text-[#76b900]">deepseek-ai/deepseek-r1</span>, <span className="text-[#76b900]">meta/llama-3.3-70b-instruct</span>, <span className="text-[#76b900]">qwen/qwen2.5-coder-32b-instruct</span>).
            </p>
          </div>

          {/* Model Parameters */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Temperature</span>
                <span className="font-mono text-slate-200">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-[#76b900]"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Top P</span>
                <span className="font-mono text-slate-200">{settings.topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={settings.topP}
                onChange={(e) => updateSettings({ topP: parseFloat(e.target.value) })}
                className="w-full accent-[#76b900]"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Max Tokens</span>
                <span className="font-mono text-slate-200">{settings.maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="4096"
                step="256"
                value={settings.maxTokens}
                onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                className="w-full accent-[#76b900]"
              />
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              System Instruction
            </label>
            <textarea
              rows={3}
              value={settings.systemPrompt}
              onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
              className="w-full bg-slate-900 text-white rounded-lg p-2.5 border border-slate-800 focus:outline-none focus:border-[#76b900] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
