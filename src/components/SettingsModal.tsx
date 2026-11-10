import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Key,
  Cpu,
  Sliders,
  RefreshCw,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Brain,
  Zap,
} from 'lucide-react';
import { AppSettings } from '../types';
import { MemorySkillsModal } from './MemorySkillsModal';
import {
  testNvidiaConnection,
  LLM_PROVIDERS,
  DEFAULT_NVIDIA_BASE_URL,
  DEFAULT_ACTIVE_MODEL,
  LlmProvider,
} from '../services/nvidiaApi';

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
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  if (!isOpen) return null;

  // Detect which provider preset matches current baseUrl
  const currentProvider =
    LLM_PROVIDERS.find((p) => settings.baseUrl.includes(p.id) || p.baseUrl.includes(settings.baseUrl.replace(/\/+$/, ''))) ||
    LLM_PROVIDERS[0];

  const handleSelectProvider = (provider: LlmProvider) => {
    updateSettings({
      baseUrl: provider.baseUrl,
      defaultModel: provider.defaultModel,
    });
    setTestResult(null);
  };

  const handleResetDefaults = () => {
    updateSettings({
      baseUrl: DEFAULT_NVIDIA_BASE_URL,
      defaultModel: DEFAULT_ACTIVE_MODEL,
      temperature: 0.6,
      topP: 0.9,
      maxTokens: 2048,
      systemPrompt: 'You are an expert AI software engineer and problem solver powered by NVIDIA NIM.',
    });
    setTestResult({
      success: true,
      message: 'Reset to default configuration (NVIDIA NIM with Nemotron 70B).',
    });
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testNvidiaConnection({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.defaultModel,
    });
    setTestResult(result);
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#090d16] border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#76b900]/15 border border-[#76b900]/30 flex items-center justify-center text-[#76b900]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                LLM Provider & API Configuration
              </h2>
              <p className="text-[11px] text-slate-400">
                Fully configurable for NVIDIA NIM, OpenAI, Claude, Grok, Perplexity, Groq, or custom endpoints.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Presets */}
        <div>
          <label className="font-semibold text-slate-300 block text-xs mb-1.5">
            Select Provider Preset <span className="text-slate-500 font-normal">(1-tap auto-fill)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {LLM_PROVIDERS.map((p) => {
              const isSelected = settings.baseUrl.trim().replace(/\/+$/, '') === p.baseUrl.trim().replace(/\/+$/, '');
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvider(p)}
                  className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#76b900]/15 border-[#76b900]/60 text-white shadow-sm'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{p.name.split(' ')[0]}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#76b900]" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{p.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-3.5 text-xs">
          {/* Base URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">
                API Base URL
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Any OpenAI-compatible or Anthropic URL</span>
            </div>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => updateSettings({ baseUrl: e.target.value })}
              className="w-full bg-slate-900 text-white font-mono rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-[#76b900] text-xs"
              placeholder="https://integrate.api.nvidia.com/v1"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports OpenAI (<code className="text-slate-400 font-mono">https://api.openai.com/v1</code>), Groq, xAI, Perplexity, OpenRouter, or private URLs.
            </p>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">
                API Key <span className="text-slate-500 font-normal">({currentProvider.keyPrefixHint})</span>
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
                placeholder={currentProvider.keyPlaceholder}
                className="flex-1 bg-slate-900 text-white font-mono rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-[#76b900] text-xs"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || (!settings.apiKey && !settings.baseUrl.includes('localhost'))}
                className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap text-xs ${
                  settings.apiKey && !isTesting
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
                title="Tests Base URL, API Key, and Model ID together"
              >
                {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isTesting ? 'Testing...' : 'Test Key & Model'}</span>
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
                <span className="leading-relaxed text-xs">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Model ID User Freeform Input & Popular Chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">
                Model ID <span className="text-slate-500 font-normal">(Freeform text: any custom model)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                active: <code className="text-[#76b900]">{settings.defaultModel}</code>
              </span>
            </div>
            <input
              type="text"
              value={settings.defaultModel}
              onChange={(e) => updateSettings({ defaultModel: e.target.value })}
              placeholder={currentProvider.defaultModel}
              className="w-full bg-slate-900 text-white font-mono rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-[#76b900] text-xs"
            />

            {/* Popular models for selected provider */}
            <div className="mt-2 space-y-1">
              <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Popular models for {currentProvider.name}:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentProvider.popularModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateSettings({ defaultModel: m.id })}
                    className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-colors ${
                      settings.defaultModel === m.id
                        ? 'bg-[#76b900]/20 text-[#76b900] border-[#76b900]/50'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="ml-1 opacity-60">({m.tag})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-slate-400 mb-1 text-[11px]">
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
              <div className="flex justify-between text-slate-400 mb-1 text-[11px]">
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
              <div className="flex justify-between text-slate-400 mb-1 text-[11px]">
                <span>Max Tokens</span>
                <span className="font-mono text-slate-200">{settings.maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
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
              rows={2}
              value={settings.systemPrompt}
              onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
              className="w-full bg-slate-900 text-white rounded-lg p-2.5 border border-slate-800 focus:outline-none focus:border-[#76b900] resize-none text-xs leading-relaxed"
            />
          </div>

          {/* Persistent Memory & Equipped Skills Quick Access */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#76b900]/15 border border-[#76b900]/30 flex items-center justify-center text-[#76b900]">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white text-xs">AI Memory & Equipped Skills</div>
                <div className="text-[10px] text-slate-400">
                  {(settings.skills || []).filter((s) => s.isActive).length} active skill(s) &bull; {(settings.memories || []).length} stored memory item(s)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowMemoryModal(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-[#76b900]" />
              <span>Manage</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs transition-colors"
            title="Reset all settings to default configuration"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
          >
            Save & Close
          </button>
        </div>
      </div>

      {/* Embedded Memory & Skills Modal */}
      <MemorySkillsModal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        settings={settings}
        updateSettings={updateSettings}
      />
    </div>
  );
};
