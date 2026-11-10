import React, { useState, useRef, useEffect } from 'react';
import { Conversation, ChatMessage, AppSettings, CodexSnippet, FileAttachment, AiSkill } from '../types';
import {
  streamChatCompletion,
  getTemporalSystemPrompt,
  CURATED_MODELS,
  DEFAULT_ACTIVE_MODEL,
  DEFAULT_SKILLS,
} from '../services/nvidiaApi';
import { processUploadedFile } from '../utils/fileParser';
import { MemorySkillsModal } from './MemorySkillsModal';
import {
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  Sparkles,
  Bot,
  User,
  PanelLeftClose,
  PanelLeft,
  Search,
  Cpu,
  ChevronDown,
  X,
  Paperclip,
  FileText,
  FileCode,
  Image as ImageIcon,
  Brain,
  AlertTriangle,
  Zap,
  Eye,
  Archive,
  FolderArchive,
  Command,
  FileSpreadsheet,
} from 'lucide-react';

interface ChatViewProps {
  conversations: Conversation[];
  updateConversations: (updater: (prev: Conversation[]) => Conversation[]) => void;
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  onSendToCodex: (title: string, code: string, language: CodexSnippet['language']) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  updateConversations,
  activeConversationId,
  setActiveConversationId,
  settings,
  updateSettings,
  onSendToCodex,
}) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memoryModalTab, setMemoryModalTab] = useState<'skills' | 'memories'>('skills');

  // Claude-Style Skill Selector State
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');

  // Universal File Upload State
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Responsive sidebar open on desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  const activeConv =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  // Auto-migrate retired EOL model
  useEffect(() => {
    if (activeConv && activeConv.model === 'meta/llama-3.3-70b-instruct') {
      updateConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, model: DEFAULT_ACTIVE_MODEL } : c))
      );
    }
  }, [activeConv?.id, activeConv?.model, updateConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, streamingContent, pendingAttachments]);

  const currentSkills: AiSkill[] = settings.skills || DEFAULT_SKILLS;
  const activeSkills = currentSkills.filter((s) => s.isActive);
  const primarySkill = activeSkills[0] || null;

  // Handle Input Changes & Slash Commands
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Detect if input starts with '/' or contains a slash command
    if (val.startsWith('/')) {
      setShowSlashMenu(true);
      setSlashQuery(val.slice(1).toLowerCase());
    } else {
      setShowSlashMenu(false);
    }
  };

  // Select a skill via slash command
  const handleSelectSlashSkill = (skill: AiSkill) => {
    // Equip the skill
    const updated = currentSkills.map((s) => ({
      ...s,
      isActive: s.id === skill.id ? true : s.isActive,
    }));
    updateSettings({ skills: updated });

    // Clear slash command prefix from input
    setInput('');
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  };

  // Toggle active skill from dropdown
  const handleToggleSkill = (skillId: string) => {
    const updated = currentSkills.map((s) =>
      s.id === skillId ? { ...s, isActive: !s.isActive } : s
    );
    updateSettings({ skills: updated });
  };

  // Equip single exclusive skill
  const handleEquipSingleSkill = (skillId: string) => {
    const updated = currentSkills.map((s) => ({
      ...s,
      isActive: s.id === skillId,
    }));
    updateSettings({ skills: updated });
    setShowSkillDropdown(false);
  };

  const handleNewChat = () => {
    const newId = `c-${Date.now()}`;
    const newChat: Conversation = {
      id: newId,
      title: 'New Conversation',
      model: settings.defaultModel || DEFAULT_ACTIVE_MODEL,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `m-${Date.now()}`,
          role: 'assistant',
          content: 'Hello! I am ready to assist you. Ask a question, paste code, upload any files or ZIP archives, or equip specialized AI skills.',
          timestamp: Date.now(),
        },
      ],
    };

    updateConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      handleNewChat();
    }
    updateConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      }
    }
  };

  const handleSwitchModel = (newModel: string) => {
    updateConversations((prev) =>
      prev.map((c) => (c.id === activeConv?.id ? { ...c, model: newModel } : c))
    );
    setShowModelPicker(false);
  };

  // Universal File & ZIP Upload Handler
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    setProcessingStatus(`Processing ${files.length} file(s)...`);

    const processedList: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(`Reading ${file.name}...`);
      try {
        const attachment = await processUploadedFile(file);
        processedList.push(attachment);
      } catch (err: any) {
        console.error('File parsing error:', err);
      }
    }

    setPendingAttachments((prev) => [...prev, ...processedList]);
    setIsProcessingFiles(false);
    setProcessingStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const messageText = customPrompt !== undefined ? customPrompt : input;
    const hasAttachments = pendingAttachments.length > 0;

    if ((!messageText.trim() && !hasAttachments) || isStreaming || !activeConv) return;

    // Build context-rich prompt incorporating uploaded text, code, and ZIP archive contents
    let effectiveUserContent = messageText.trim();
    const currentAttachments = [...pendingAttachments];
    const nonImageAttachments = currentAttachments.filter((a) => !a.isImage && a.textContent);

    if (nonImageAttachments.length > 0) {
      const filesContext = nonImageAttachments
        .map((att) => {
          if (att.isZip) {
            return `--- [ZIP ARCHIVE: ${att.name} (${(att.size / 1024).toFixed(1)} KB)] ---\n${att.textContent}\n----------------------------------------`;
          }
          const ext = att.name.split('.').pop() || 'text';
          return `--- [FILE: ${att.name} (${(att.size / 1024).toFixed(1)} KB)] ---\n\`\`\`${ext}\n${att.textContent}\n\`\`\`\n----------------------------------------`;
        })
        .join('\n\n');

      if (effectiveUserContent) {
        effectiveUserContent = `${effectiveUserContent}\n\n${filesContext}`;
      } else {
        effectiveUserContent = `Please inspect, analyze, and review the uploaded file(s) and project contents:\n\n${filesContext}`;
      }
    } else if (!effectiveUserContent && hasAttachments) {
      effectiveUserContent = 'Please analyze the uploaded image(s) in detail.';
    }

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: effectiveUserContent,
      timestamp: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const updatedMessages = [...activeConv.messages, userMessage];
    const isFirstUserMessage = activeConv.messages.filter((m) => m.role === 'user').length === 0;
    const titleBase = messageText.trim() || (hasAttachments ? currentAttachments[0].name : 'Conversation');
    const newTitle = isFirstUserMessage
      ? titleBase.slice(0, 28).trim() + (titleBase.length > 28 ? '...' : '')
      : activeConv.title;

    updateConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : c
      )
    );

    setInput('');
    setPendingAttachments([]);
    setIsStreaming(true);
    setStreamingContent('');

    // Inject real-time date/time, persistent memory, and Claude-style active skills
    const dynamicSystemPrompt = getTemporalSystemPrompt(
      settings.systemPrompt,
      settings.memories,
      settings.skills
    );

    const contextMessages = [
      { role: 'system', content: dynamicSystemPrompt },
      ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    await streamChatCompletion({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: activeConv.model || settings.defaultModel,
      messages: contextMessages,
      attachments: currentAttachments,
      temperature: settings.temperature,
      topP: settings.topP,
      maxTokens: settings.maxTokens,
      onChunk: (chunk) => {
        setStreamingContent(chunk);
      },
      onFinish: (fullText) => {
        const assistantMessage: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: fullText,
          timestamp: Date.now(),
          modelUsed: activeConv.model,
        };

        updateConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...updatedMessages, assistantMessage],
                }
              : c
          )
        );

        setStreamingContent('');
        setIsStreaming(false);
      },
      onError: (errMsg) => {
        const is410 = errMsg.includes('410') || errMsg.includes('no longer active') || errMsg.includes('End-of-Life');
        const errMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: is410
            ? `⚠️ **Model Error 410 (End-of-Life)**: The model \`${activeConv.model}\` has reached end-of-life on this endpoint. Click below to upgrade immediately.`
            : `⚠️ **LLM API Error**: ${errMsg}\n\nPlease check your API key in **API Settings** or verify your connection to \`${settings.baseUrl}\`.`,
          timestamp: Date.now(),
        };

        updateConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...updatedMessages, errMessage],
                }
              : c
          )
        );

        setStreamingContent('');
        setIsStreaming(false);
      },
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let language = 'typescript';
        let codeLines = lines;

        const firstLine = lines[0].trim().toLowerCase();
        if (
          [
            'javascript', 'typescript', 'python', 'html', 'css', 'json', 'sql', 'bash', 'c++', 'rust', 'markdown', 'yaml'
          ].includes(firstLine)
        ) {
          language = firstLine;
          codeLines = lines.slice(1);
        }
        const codeText = codeLines.join('\n');
        const blockId = `${msgId}-code-${index}`;

        return (
          <div
            key={index}
            className="my-2.5 rounded-xl border border-slate-800 bg-[#070a10] overflow-hidden shadow-sm max-w-full"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px]">
              <span className="font-mono text-slate-400 font-medium uppercase">{language}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onSendToCodex(
                      `Snippet (${language})`,
                      codeText,
                      language as CodexSnippet['language']
                    )
                  }
                  className="flex items-center gap-1 text-slate-300 hover:text-[#76b900] transition-colors py-1 px-2 rounded hover:bg-slate-800"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Codex</span>
                </button>
                <button
                  onClick={() => handleCopy(codeText, blockId)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors py-1 px-2 rounded hover:bg-slate-800"
                >
                  {copiedId === blockId ? (
                    <Check className="w-3.5 h-3.5 text-[#76b900]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === blockId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm break-words">
          {part.split('\n\n').map((paragraph, pIdx) => (
            <p key={pIdx} className="mb-2 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      );
    });
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSlashSkills = currentSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(slashQuery) ||
      (s.triggerKeyword && s.triggerKeyword.toLowerCase().includes(slashQuery))
  );

  const quickStarters = [
    'Analyze an uploaded ZIP archive or code project',
    'Write an async Python client for NVIDIA NIM or OpenAI',
    'Review code for subtle security bugs and memory leaks',
    'Design an interactive matrix canvas animation in HTML5',
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-1 h-[calc(100dvh-57px)] w-full overflow-hidden bg-[#0a0d16] relative pb-16 md:pb-0 ${
        isDraggingOver ? 'ring-2 ring-inset ring-[#76b900] bg-[#0d1424]' : ''
      }`}
    >
      {/* Hidden Universal File Input (accepts ALL file types) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        multiple
        className="hidden"
      />

      {/* Drag Overlay Notice */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#090d16]/90 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#76b900]/20 border border-[#76b900] flex items-center justify-center text-[#76b900] animate-bounce">
            <Archive className="w-7 h-7" />
          </div>
          <div className="text-base font-bold text-white">Drop any files or ZIP archives here</div>
          <p className="text-xs text-slate-400 max-w-sm">
            Instant client-side decompression of ZIPs, multimodal image ingestion, and code analysis.
          </p>
        </div>
      )}

      {/* Image Modal Lightbox */}
      {selectedPreviewImage && (
        <div
          onClick={() => setSelectedPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPreviewImage}
              alt="Attachment Full View"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-slate-700"
            />
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Claude-Style Memory & Skills Modal */}
      <MemorySkillsModal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        settings={settings}
        updateSettings={updateSettings}
        initialTab={memoryModalTab}
      />

      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar: Responsive Drawer on Mobile, Column on Desktop */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto bg-[#080b12] border-r border-slate-800/80 flex flex-col shrink-0 transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'w-72 sm:w-80 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0'
        } overflow-hidden`}
      >
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-950 bg-[#76b900] hover:bg-[#86d200] rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
            title="Close Drawer"
          >
            <X className="w-4 h-4 md:hidden" />
            <PanelLeftClose className="w-4 h-4 hidden md:block" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-2 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-xs rounded-lg pl-8 pr-2.5 py-1.5 border border-slate-800 focus:outline-none focus:border-[#76b900] text-slate-200 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map((conv) => {
            const isActive = conv.id === activeConv?.id;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <div className="truncate flex-1 mr-2">{conv.title || 'Untitled Chat'}</div>
                <button
                  onClick={(e) => handleDeleteChat(conv.id, e)}
                  className="opacity-70 md:opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Drawer Bar with Claude Skills Shortcut */}
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <button
            onClick={() => {
              setMemoryModalTab('skills');
              setShowMemoryModal(true);
            }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-[#76b900]" />
            <span>Skills ({activeSkills.length} active)</span>
          </button>
          <span className="font-mono">{conversations.length} synced</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#0a0d16] relative overflow-hidden">
        {/* Top Chat Bar */}
        <div className="h-12 border-b border-slate-800/80 flex items-center justify-between px-3 sm:px-4 bg-[#0a0d16]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
              title="Toggle Conversations"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Model Selector */}
            <div className="relative flex items-center gap-1.5 min-w-0">
              <Cpu className="w-3.5 h-3.5 text-[#76b900] shrink-0" />
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 focus-within:border-[#76b900] transition-colors">
                <span className="text-[10px] text-slate-500 font-mono mr-1 hidden sm:inline">model:</span>
                <input
                  type="text"
                  value={activeConv?.model || settings.defaultModel}
                  onChange={(e) => {
                    const newModel = e.target.value;
                    updateConversations((prev) =>
                      prev.map((c) => (c.id === activeConv?.id ? { ...c, model: newModel } : c))
                    );
                  }}
                  placeholder="e.g. nvidia/llama-3.1-nemotron-70b-instruct or gpt-4o"
                  className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none w-24 sm:w-52 truncate"
                  title="Enter any custom model ID"
                />
                <button
                  type="button"
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="p-0.5 text-slate-400 hover:text-white rounded ml-1"
                  title="Choose active verified model"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Model Dropdown Menu */}
              {showModelPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowModelPicker(false)}
                  />
                  <div className="absolute top-full left-0 mt-1.5 w-72 rounded-xl bg-[#090d16] border border-slate-800 shadow-2xl z-50 p-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Verified Flagship Models
                    </div>
                    {CURATED_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSwitchModel(m.id)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col ${
                          activeConv?.model === m.id
                            ? 'bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/30'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span>{m.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{m.context}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono truncate">{m.id}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Claude-Style Skill Selector Button in Header */}
            <div className="relative">
              <button
                onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                  activeSkills.length > 0
                    ? 'bg-[#76b900]/15 border-[#76b900]/40 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Select or equip AI skill"
              >
                <Zap className="w-3.5 h-3.5 text-[#76b900]" />
                <span className="hidden sm:inline">
                  {primarySkill ? primarySkill.name : 'Skills'}
                </span>
                {activeSkills.length > 1 && (
                  <span className="text-[10px] font-mono bg-[#76b900]/25 text-[#76b900] px-1 rounded">
                    +{activeSkills.length - 1}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Skills Dropdown Popover */}
              {showSkillDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSkillDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1.5 w-72 rounded-xl bg-[#090d16] border border-slate-800 shadow-2xl z-50 p-2 space-y-1.5">
                    <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-300">
                      <span>Equipped Claude Skills</span>
                      <button
                        onClick={() => {
                          setShowSkillDropdown(false);
                          setMemoryModalTab('skills');
                          setShowMemoryModal(true);
                        }}
                        className="text-[#76b900] hover:underline text-[10px]"
                      >
                        + Add Custom
                      </button>
                    </div>

                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {currentSkills.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => handleToggleSkill(skill.id)}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-start justify-between gap-2 transition-colors ${
                            skill.isActive
                              ? 'bg-[#76b900]/15 text-white border border-[#76b900]/40'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-medium text-xs truncate flex items-center gap-1.5">
                              <span>{skill.name}</span>
                              {skill.triggerKeyword && (
                                <span className="font-mono text-[9px] text-[#76b900] bg-slate-900 px-1 rounded">
                                  /{skill.triggerKeyword}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{skill.description}</div>
                          </div>
                          {skill.isActive && (
                            <Check className="w-3.5 h-3.5 text-[#76b900] shrink-0 mt-0.5" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 px-1">
                      <span>Tip: Type / in chat for slash commands</span>
                      <button
                        onClick={() => {
                          setShowSkillDropdown(false);
                          setMemoryModalTab('skills');
                          setShowMemoryModal(true);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        Manage All
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <button
              onClick={handleNewChat}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (activeConv) {
                  updateConversations((prev) =>
                    prev.map((c) => (c.id === activeConv.id ? { ...c, messages: [] } : c))
                  );
                }
              }}
              className="hidden sm:inline text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 w-full">
          {activeConv?.messages.length === 0 && (
            <div className="max-w-2xl mx-auto my-6 sm:my-10 text-center space-y-4 px-2">
              <div className="w-12 h-12 rounded-2xl bg-[#76b900]/10 border border-[#76b900]/30 flex items-center justify-center mx-auto text-[#76b900]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">SyncWave AI Studio</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Claude-style agent skills, universal file & ZIP codebase analysis, long-term memory, and cross-device sync.
                </p>
              </div>

              {/* Active Skills Badges */}
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {activeSkills.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#76b900]/10 border border-[#76b900]/30 text-[#76b900]"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{s.name} Active</span>
                  </span>
                ))}
                {settings.memories && settings.memories.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300">
                    <Brain className="w-3 h-3" />
                    <span>{settings.memories.length} Memories Active</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {quickStarters.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(starter)}
                    className="p-2.5 sm:p-3 text-xs rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white transition-all text-left"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeConv?.messages.map((msg) => {
            const isUser = msg.role === 'user';
            const is410Error = msg.content.includes('410') || msg.content.includes('retired by NVIDIA');

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-3xl mx-auto w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#76b900]/15 border border-[#76b900]/30 flex items-center justify-center text-[#76b900] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 max-w-[88%] sm:max-w-[85%] text-slate-100 ${
                    isUser
                      ? 'bg-slate-800 text-white rounded-tr-sm border border-slate-700/60'
                      : is410Error
                      ? 'bg-amber-950/30 border border-amber-600/40 rounded-tl-sm shadow-sm'
                      : 'bg-[#0f1523] border border-slate-800/90 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {/* Render attachments in user bubbles */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2.5 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {msg.attachments.map((att) => {
                          if (att.isImage && att.dataUrl) {
                            return (
                              <div
                                key={att.id}
                                onClick={() => setSelectedPreviewImage(att.dataUrl || null)}
                                className="relative rounded-lg overflow-hidden border border-slate-700 cursor-pointer group"
                              >
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="w-24 h-24 sm:w-32 sm:h-32 object-cover group-hover:opacity-90 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            );
                          }

                          if (att.isZip) {
                            return (
                              <div
                                key={att.id}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-[#76b900]/40 text-xs w-full max-w-sm"
                              >
                                <div className="w-8 h-8 rounded-lg bg-[#76b900]/15 flex items-center justify-center text-[#76b900] shrink-0">
                                  <FolderArchive className="w-4 h-4" />
                                </div>
                                <div className="truncate flex-1 min-w-0">
                                  <div className="font-mono text-white font-medium truncate">{att.name}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {(att.size / 1024).toFixed(1)} KB &bull; {att.zipEntries?.length || 0} files extracted
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                            >
                              <FileCode className="w-4 h-4 text-[#76b900] shrink-0" />
                              <div className="truncate max-w-[140px] sm:max-w-[200px]">
                                <div className="font-mono text-white truncate">{att.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  {(att.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isUser ? (
                    <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="break-words">{renderMessageContent(msg.content, msg.id)}</div>
                  )}

                  {/* 1-Tap Upgrade Action for 410 EOL Errors */}
                  {is410Error && (
                    <div className="mt-3 pt-2.5 border-t border-amber-600/30 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSwitchModel(DEFAULT_ACTIVE_MODEL)}
                        className="px-3 py-1.5 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Switch to Nemotron 70B (Active)</span>
                      </button>
                      <button
                        onClick={() => handleSwitchModel('gpt-4o')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 border border-slate-700"
                      >
                        <span>Switch to GPT-4o</span>
                      </button>
                    </div>
                  )}

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:text-slate-300 ml-2"
                      >
                        {copiedId === msg.id ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex gap-2.5 max-w-3xl mx-auto w-full justify-start">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#76b900]/15 border border-[#76b900]/30 flex items-center justify-center text-[#76b900] shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 max-w-[88%] sm:max-w-[85%] bg-[#0f1523] border border-slate-800/90 rounded-tl-sm text-slate-100">
                {streamingContent ? (
                  renderMessageContent(streamingContent, 'streaming')
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-[#76b900] py-1">
                    <span className="w-2 h-2 rounded-full bg-[#76b900] animate-pulse" />
                    <span>Generating response...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 border-t border-slate-800/80 bg-[#090d16] shrink-0 relative">
          {/* Slash Command Autocomplete Popover */}
          {showSlashMenu && (
            <div className="absolute bottom-full left-3 right-3 sm:left-auto sm:w-96 mb-2 rounded-xl bg-[#090d16] border border-slate-800 shadow-2xl p-1.5 z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center justify-between">
                <span>Invoke Claude-Style Skill</span>
                <span className="text-[#76b900] font-mono">/{slashQuery}</span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {filteredSlashSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleSelectSlashSkill(skill)}
                    className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-800/80 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span className="text-[#76b900] font-mono">/{skill.triggerKeyword || skill.name.toLowerCase()}</span>
                        <span className="text-slate-300 font-normal">({skill.name})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{skill.description}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono group-hover:text-white">Tab / Click</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto relative rounded-xl bg-slate-900 border border-slate-800 focus-within:border-[#76b900] transition-colors p-2">
            {/* Attachment Preview Chips */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                {pendingAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 text-xs text-slate-200"
                  >
                    {att.isImage ? (
                      <img src={att.dataUrl} alt={att.name} className="w-5 h-5 rounded object-cover" />
                    ) : att.isZip ? (
                      <FolderArchive className="w-4 h-4 text-[#76b900]" />
                    ) : (
                      <FileCode className="w-4 h-4 text-[#76b900]" />
                    )}
                    <span className="truncate max-w-[130px] font-mono text-[11px]">{att.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({(att.size / 1024).toFixed(0)}K)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-0.5 text-slate-400 hover:text-white rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isProcessingFiles && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-[#76b900] bg-slate-950/50 rounded mb-1">
                <span className="w-2 h-2 rounded-full bg-[#76b900] animate-pulse" />
                <span>{processingStatus}</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${activeConv?.model ? activeConv.model.split('/').pop() : 'AI'} (type / for skills, attach any file or ZIP)...`}
              rows={2}
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 resize-none focus:outline-none px-2 py-1 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1 px-1">
              <div className="flex items-center gap-2">
                {/* Universal File Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFiles}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
                  title="Upload any file: ZIP archives, code repositories, images, PDFs, CSV, docs"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Attach / ZIP</span>
                </button>

                {/* Claude-Style Skills Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMemoryModalTab('skills');
                    setShowMemoryModal(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-[#76b900] hover:bg-slate-800 transition-colors text-xs"
                  title="Equip or create Claude-style agent skills"
                >
                  <Zap className="w-3.5 h-3.5 text-[#76b900]" />
                  <span className="text-[11px] hidden sm:inline">Skills</span>
                  {activeSkills.length > 0 && (
                    <span className="text-[10px] font-mono px-1 rounded bg-[#76b900]/20 text-[#76b900]">
                      {activeSkills.length}
                    </span>
                  )}
                </button>

                {/* Memory Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMemoryModalTab('memories');
                    setShowMemoryModal(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs hidden sm:flex"
                  title="Persistent Memory Bank"
                >
                  <Brain className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px]">Memory</span>
                </button>
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && pendingAttachments.length === 0) || isStreaming}
                className={`flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg transition-colors ${
                  (input.trim() || pendingAttachments.length > 0) && !isStreaming
                    ? 'bg-[#76b900] hover:bg-[#86d200] text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
