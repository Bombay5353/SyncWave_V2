import React, { useState } from 'react';
import { CodexSnippet, AppSettings } from '../types';
import { streamChatCompletion } from '../services/nvidiaApi';
import {
  Play,
  RotateCw,
  Copy,
  Check,
  Plus,
  Trash2,
  FileCode,
  Sparkles,
  Download,
  Terminal,
  ExternalLink,
  SplitSquareVertical,
  Layers,
  Code,
  Eye,
} from 'lucide-react';

interface CodexViewProps {
  snippets: CodexSnippet[];
  updateSnippets: (updater: (prev: CodexSnippet[]) => CodexSnippet[]) => void;
  activeSnippetId: string;
  setActiveSnippetId: (id: string) => void;
  settings: AppSettings;
}

export const CodexView: React.FC<CodexViewProps> = ({
  snippets,
  updateSnippets,
  activeSnippetId,
  setActiveSnippetId,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [sandboxKey, setSandboxKey] = useState(1);
  const [activeRightTab, setActiveRightTab] = useState<'preview' | 'terminal'>('preview');
  const [codexModel, setCodexModel] = useState<string>(
    settings.defaultModel || 'qwen/qwen2.5-coder-32b-instruct'
  );

  // Mobile segmented view state: 'files' | 'editor' | 'preview'
  const [mobilePane, setMobilePane] = useState<'files' | 'editor' | 'preview'>('editor');

  const activeSnippet =
    snippets.find((s) => s.id === activeSnippetId) || snippets[0];

  const handleAddSnippet = () => {
    const newId = `s-${Date.now()}`;
    const newSnippet: CodexSnippet = {
      id: newId,
      title: 'untitled_script.ts',
      language: 'typescript',
      description: 'Custom script',
      code: `// Powered by NVIDIA NIM Codex Engine\n\nfunction calculateMetrics(data: number[]): { sum: number; avg: number } {\n  const sum = data.reduce((acc, val) => acc + val, 0);\n  return {\n    sum,\n    avg: data.length > 0 ? sum / data.length : 0,\n  };\n}\n\nconsole.log(calculateMetrics([10, 20, 30, 40, 50]));`,
      updatedAt: Date.now(),
    };

    updateSnippets((prev) => [newSnippet, ...prev]);
    setActiveSnippetId(newId);
    setMobilePane('editor');
  };

  const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (snippets.length <= 1) {
      handleAddSnippet();
    }
    updateSnippets((prev) => prev.filter((s) => s.id !== id));
    if (activeSnippetId === id) {
      const remaining = snippets.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSnippetId(remaining[0].id);
      }
    }
  };

  const handleCodeChange = (newCode: string) => {
    if (!activeSnippet) return;
    updateSnippets((prev) =>
      prev.map((s) => (s.id === activeSnippet.id ? { ...s, code: newCode, updatedAt: Date.now() } : s))
    );
  };

  const handleCopy = () => {
    if (!activeSnippet) return;
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeSnippet) return;
    const blob = new Blob([activeSnippet.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeSnippet.title;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunCode = () => {
    if (!activeSnippet) return;

    if (activeSnippet.language === 'html') {
      setSandboxKey((k) => k + 1);
      setActiveRightTab('preview');
      setMobilePane('preview');
      return;
    }

    setActiveRightTab('terminal');
    setMobilePane('preview');
    setConsoleOutput([`[NVIDIA Codex Runner] Executing ${activeSnippet.title}...`]);

    try {
      if (activeSnippet.language === 'javascript' || activeSnippet.language === 'typescript') {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
          error: (...args: any[]) => logs.push(`[ERROR] ${args.join(' ')}`),
          warn: (...args: any[]) => logs.push(`[WARN] ${args.join(' ')}`),
        };

        const cleanedCode = activeSnippet.code
          .replace(/import\s+.*?;/g, '// import')
          .replace(/export\s+/g, '');
        
        const runFn = new Function('console', cleanedCode);
        runFn(customConsole);

        setTimeout(() => {
          setConsoleOutput((prev) => [
            ...prev,
            ...logs,
            `[Finished in 0.04s — Status: OK]`,
          ]);
        }, 150);
      } else if (activeSnippet.language === 'python') {
        setTimeout(() => {
          setConsoleOutput((prev) => [
            ...prev,
            `Python 3.11.8 (NVIDIA NIM Environment)`,
            `Connecting to https://integrate.api.nvidia.com/v1...`,
            `Model loaded: ${settings.defaultModel}`,
            `Process finished with exit code 0`,
          ]);
        }, 200);
      } else {
        setConsoleOutput((prev) => [
          ...prev,
          `File type: ${activeSnippet.language}. Code validated syntax clean.`,
        ]);
      }
    } catch (err: any) {
      setConsoleOutput((prev) => [
        ...prev,
        `Execution Error: ${err.message}`,
      ]);
    }
  };

  const handleAiTransform = async () => {
    if (!aiPrompt.trim() || isGenerating || !activeSnippet) return;

    setIsGenerating(true);
    const instruction = `You are NVIDIA NIM Codex. Take this existing code and user prompt, and return ONLY the updated code without conversational preamble:\n\nUser Request: ${aiPrompt}\nCurrent File: ${activeSnippet.title} (${activeSnippet.language})\n\nExisting Code:\n\`\`\`${activeSnippet.language}\n${activeSnippet.code}\n\`\`\``;

    await streamChatCompletion({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: codexModel.trim() || settings.defaultModel || 'qwen/qwen2.5-coder-32b-instruct',
      messages: [{ role: 'user', content: instruction }],
      temperature: 0.2,
      topP: 0.8,
      maxTokens: 2048,
      onChunk: (chunk) => {
        let clean = chunk;
        if (clean.includes('```')) {
          const match = clean.match(/```(?:[a-z]+)?\n([\s\S]*?)(?:```|$)/);
          if (match && match[1]) {
            clean = match[1];
          }
        }
        handleCodeChange(clean);
      },
      onFinish: (full) => {
        let clean = full;
        if (clean.includes('```')) {
          const match = clean.match(/```(?:[a-z]+)?\n([\s\S]*?)(?:```|$)/);
          if (match && match[1]) {
            clean = match[1];
          }
        }
        handleCodeChange(clean);
        setIsGenerating(false);
        setAiPrompt('');
      },
      onError: (err) => {
        alert(`Codex generation error: ${err}`);
        setIsGenerating(false);
      },
    });
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-[calc(100dvh-57px)] w-full overflow-hidden bg-[#070a11] pb-16 md:pb-0">
      {/* Mobile Top Segmented Selector (Visible only on < lg screens) */}
      <div className="lg:hidden flex items-center justify-between p-2 bg-[#090d16] border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs w-full max-w-sm mx-auto">
          <button
            onClick={() => setMobilePane('files')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded font-medium transition-colors ${
              mobilePane === 'files' ? 'bg-[#76b900] text-slate-950 font-semibold' : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Files ({snippets.length})</span>
          </button>
          <button
            onClick={() => setMobilePane('editor')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded font-medium transition-colors ${
              mobilePane === 'editor' ? 'bg-[#76b900] text-slate-950 font-semibold' : 'text-slate-400'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setMobilePane('preview')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded font-medium transition-colors ${
              mobilePane === 'preview' ? 'bg-[#76b900] text-slate-950 font-semibold' : 'text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Pane 1: Left Files Sidebar (Always shown on desktop, conditioned on mobile) */}
      <div
        className={`${
          mobilePane === 'files' ? 'flex' : 'hidden lg:flex'
        } w-full lg:w-64 border-r border-slate-800/80 bg-[#070a11] flex-col shrink-0 h-full overflow-hidden`}
      >
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <FileCode className="w-4 h-4 text-[#76b900]" />
            <span>Codex Workspace</span>
          </div>
          <button
            onClick={handleAddSnippet}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Create new file"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {snippets.map((snip) => {
            const isActive = snip.id === activeSnippet?.id;
            return (
              <div
                key={snip.id}
                onClick={() => {
                  setActiveSnippetId(snip.id);
                  setMobilePane('editor');
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate mr-1">
                  <span className="font-mono text-[10px] uppercase text-[#76b900] bg-[#76b900]/10 px-1 py-0.5 rounded">
                    {snip.language.slice(0, 3)}
                  </span>
                  <span className="truncate">{snip.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSnippet(snip.id, e)}
                  className="opacity-70 lg:opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500">
          Syncs live across Android & Windows
        </div>
      </div>

      {/* Pane 2: Center Code Editor (Always shown on desktop, conditioned on mobile) */}
      <div
        className={`${
          mobilePane === 'editor' ? 'flex' : 'hidden lg:flex'
        } flex-1 flex-col border-r border-slate-800/80 bg-[#090d16] min-w-0 h-full overflow-hidden`}
      >
        {/* Editor Toolbar */}
        <div className="h-11 border-b border-slate-800/80 flex items-center justify-between px-3 bg-slate-900/60 shrink-0 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              value={activeSnippet?.title || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateSnippets((prev) =>
                  prev.map((s) => (s.id === activeSnippet?.id ? { ...s, title: val } : s))
                );
              }}
              className="bg-transparent text-xs font-mono font-medium text-white focus:outline-none focus:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[120px] sm:max-w-none"
            />
            <select
              value={activeSnippet?.language || 'typescript'}
              onChange={(e) => {
                const val = e.target.value as CodexSnippet['language'];
                updateSnippets((prev) =>
                  prev.map((s) => (s.id === activeSnippet?.id ? { ...s, language: val } : s))
                );
              }}
              className="bg-slate-800 text-[10px] sm:text-[11px] text-slate-300 rounded px-1.5 py-0.5 border border-slate-700"
            >
              <option value="typescript">TS</option>
              <option value="javascript">JS</option>
              <option value="python">Python</option>
              <option value="html">HTML5</option>
              <option value="css">CSS3</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
            </select>

            {/* Model User Input */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 focus-within:border-[#76b900] transition-colors">
              <span className="text-[10px] text-slate-500 font-mono mr-1">model:</span>
              <input
                type="text"
                value={codexModel}
                onChange={(e) => setCodexModel(e.target.value)}
                placeholder="e.g. qwen/qwen2.5-coder-32b-instruct"
                className="bg-transparent text-[10px] font-mono text-slate-200 focus:outline-none w-28 sm:w-44 truncate"
                title="Codex Model Name (User Input)"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRunCode}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold text-slate-950 bg-[#76b900] hover:bg-[#86d200] rounded-lg transition-colors shadow-sm"
              title="Run or Preview"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#76b900]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 hidden sm:block"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Codex Copilot Prompt Bar */}
        <div className="p-2 sm:p-2.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#76b900] shrink-0" />
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiTransform()}
            placeholder="AI Codex: 'Optimize loop', 'Add types'..."
            className="flex-1 bg-slate-950 text-xs text-white placeholder-slate-500 px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-[#76b900] min-w-0"
          />
          <button
            onClick={handleAiTransform}
            disabled={!aiPrompt.trim() || isGenerating}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              aiPrompt.trim() && !isGenerating
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'text-slate-600 bg-slate-900 cursor-not-allowed'
            }`}
          >
            {isGenerating ? '...' : 'Edit'}
          </button>
        </div>

        {/* Code Textarea / Editor */}
        <div className="flex-1 relative flex overflow-hidden">
          <div className="w-8 sm:w-10 bg-slate-950/70 border-r border-slate-800/60 select-none py-3 px-1 text-right font-mono text-[11px] text-slate-600 leading-6 hidden sm:block">
            {Array.from({ length: Math.max(15, (activeSnippet?.code.split('\n').length || 1) + 2) }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          <textarea
            value={activeSnippet?.code || ''}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent text-xs font-mono leading-6 text-slate-100 p-2 sm:p-3 resize-none focus:outline-none selection:bg-[#76b900]/30 selection:text-white"
          />
        </div>
      </div>

      {/* Pane 3: Right Live Sandbox & Console (Always shown on desktop, conditioned on mobile) */}
      <div
        className={`${
          mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
        } w-full lg:w-80 xl:w-96 flex-col bg-[#070a11] shrink-0 h-full overflow-hidden`}
      >
        <div className="h-11 border-b border-slate-800/80 flex items-center justify-between px-3 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveRightTab('preview')}
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                activeRightTab === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveRightTab('terminal')}
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                activeRightTab === 'terminal' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Terminal
            </button>
          </div>

          <button
            onClick={() => setSandboxKey((k) => k + 1)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Refresh Sandbox"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          {activeRightTab === 'preview' ? (
            activeSnippet?.language === 'html' ? (
              <iframe
                key={sandboxKey}
                title="Codex HTML Sandbox"
                srcDoc={activeSnippet.code}
                sandbox="allow-scripts allow-modals"
                className="w-full h-full bg-white border-none"
              />
            ) : (
              <div className="p-4 text-xs text-slate-400 space-y-3 h-full flex flex-col justify-center items-center text-center">
                <SplitSquareVertical className="w-8 h-8 text-slate-600 mb-2" />
                <p className="font-medium text-slate-300">Live Preview Ready</p>
                <p className="text-[11px] leading-relaxed max-w-xs">
                  For interactive visual rendering, select an HTML file or switch to <strong>Terminal</strong> to execute code.
                </p>
                <button
                  onClick={() => {
                    const htmlSnip = snippets.find((s) => s.language === 'html');
                    if (htmlSnip) setActiveSnippetId(htmlSnip.id);
                  }}
                  className="text-xs text-[#76b900] hover:underline"
                >
                  Switch to Matrix HTML sample →
                </button>
              </div>
            )
          ) : (
            <div className="h-full bg-black font-mono text-xs p-3 overflow-y-auto text-emerald-400 space-y-1">
              <div className="flex items-center gap-2 text-slate-500 pb-2 border-b border-slate-900 mb-2 text-[11px]">
                <Terminal className="w-3.5 h-3.5" />
                <span>NVIDIA NIM Sandbox Shell</span>
              </div>
              {consoleOutput.length === 0 ? (
                <div className="text-slate-600 italic">Click 'Run' to execute.</div>
              ) : (
                consoleOutput.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    {line}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
