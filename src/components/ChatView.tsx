import React, { useState, useRef, useEffect } from 'react';
import { Conversation, ChatMessage, AppSettings, CodexSnippet } from '../types';
import { streamChatCompletion, getTemporalSystemPrompt, CURATED_MODELS, DEFAULT_ACTIVE_MODEL } from '../services/nvidiaApi';
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
} from 'lucide-react';

interface ChatViewProps {
  conversations: Conversation[];
  updateConversations: (updater: (prev: Conversation[]) => Conversation[]) => void;
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  settings: AppSettings;
  onSendToCodex: (title: string, code: string, language: CodexSnippet['language']) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  updateConversations,
  activeConversationId,
  setActiveConversationId,
  settings,
  onSendToCodex,
}) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on mobile, can open on desktop
  const [searchQuery, setSearchQuery] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set default sidebar open on desktop viewports
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  const activeConv =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  // Auto-migrate retired EOL model on active conversation
  useEffect(() => {
    if (activeConv && activeConv.model === 'meta/llama-3.3-70b-instruct') {
      updateConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, model: DEFAULT_ACTIVE_MODEL } : c))
      );
    }
  }, [activeConv?.id, activeConv?.model]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, streamingContent]);

  const handleNewChat = () => {
    const newId = `c-${Date.now()}`;
    const newChat: Conversation = {
      id: newId,
      title: 'New Conversation',
      model: settings.defaultModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `m-${Date.now()}`,
          role: 'assistant',
          content: 'Hello! I am ready to assist you. Ask a question, paste code, or brainstorm ideas.',
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

  const handleSendMessage = async (customPrompt?: string) => {
    const messageText = customPrompt || input;
    if (!messageText.trim() || isStreaming || !activeConv) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeConv.messages, userMessage];
    const isFirstUserMessage = activeConv.messages.filter((m) => m.role === 'user').length === 0;
    const newTitle = isFirstUserMessage
      ? messageText.slice(0, 28).trim() + (messageText.length > 28 ? '...' : '')
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
    setIsStreaming(true);
    setStreamingContent('');

    const dynamicSystemPrompt = getTemporalSystemPrompt(settings.systemPrompt);

    const contextMessages = [
      { role: 'system', content: dynamicSystemPrompt },
      ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    await streamChatCompletion({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: activeConv.model || settings.defaultModel,
      messages: contextMessages,
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
        const errMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **NVIDIA NIM API Error**: ${errMsg}\n\nPlease check your API key in **API Settings** or verify your connection to \`${settings.baseUrl}\`.`,
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
        if (['javascript', 'typescript', 'python', 'html', 'css', 'json', 'sql', 'bash', 'c++', 'rust', 'markdown'].includes(firstLine)) {
          language = firstLine;
          codeLines = lines.slice(1);
        }
        const codeText = codeLines.join('\n');
        const blockId = `${msgId}-code-${index}`;

        return (
          <div key={index} className="my-2.5 rounded-xl border border-slate-800 bg-[#070a10] overflow-hidden shadow-sm max-w-full">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px]">
              <span className="font-mono text-slate-400 font-medium uppercase">{language}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSendToCodex(`Snippet (${language})`, codeText, language as CodexSnippet['language'])}
                  className="flex items-center gap-1 text-slate-300 hover:text-[#76b900] transition-colors py-1 px-2 rounded hover:bg-slate-800"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Codex</span>
                </button>
                <button
                  onClick={() => handleCopy(codeText, blockId)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors py-1 px-2 rounded hover:bg-slate-800"
                >
                  {copiedId === blockId ? <Check className="w-3.5 h-3.5 text-[#76b900]" /> : <Copy className="w-3.5 h-3.5" />}
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

  const quickStarters = [
    'Write a Python NVIDIA NIM client',
    'Create an interactive matrix rain animation in HTML5',
    'How does real-time cross-device sync work?',
    'Build a responsive mobile navigation bar',
  ];

  return (
    <div className="flex flex-1 h-[calc(100dvh-57px)] w-full overflow-hidden bg-[#0a0d16] relative pb-16 md:pb-0">
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

        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#76b900]" />
            <span>NVIDIA NIM</span>
          </span>
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

            {/* Model User Text Input with Quick Selection Popover */}
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
                  placeholder="e.g. nvidia/llama-3.1-nemotron-70b-instruct"
                  className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none w-32 sm:w-56 truncate"
                  title="Enter any NVIDIA NIM model ID"
                />
                <button
                  type="button"
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="p-0.5 text-slate-400 hover:text-white rounded ml-1"
                  title="Choose active verified NVIDIA model"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Model Dropdown Menu */}
              {showModelPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowModelPicker(false)}
                  />
                  <div className="absolute top-full left-0 mt-1.5 w-72 rounded-xl bg-[#090d16] border border-slate-800 shadow-2xl z-50 p-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Verified Active NIM Models
                    </div>
                    {CURATED_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          updateConversations((prev) =>
                            prev.map((c) => (c.id === activeConv?.id ? { ...c, model: m.id } : c))
                          );
                          setShowModelPicker(false);
                        }}
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
            <div className="max-w-2xl mx-auto my-6 sm:my-12 text-center space-y-4 px-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#76b900]/10 border border-[#76b900]/30 flex items-center justify-center mx-auto text-[#76b900]">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">SyncWave AI Chat</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Powered by NVIDIA NIM microservices. Syncs live with your PC and mobile device.
                </p>
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
                      : 'bg-[#0f1523] border border-slate-800/90 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="break-words">{renderMessageContent(msg.content, msg.id)}</div>
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
                    <span>NVIDIA NIM generating...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 border-t border-slate-800/80 bg-[#090d16] shrink-0">
          <div className="max-w-3xl mx-auto relative rounded-xl bg-slate-900 border border-slate-800 focus-within:border-[#76b900] transition-colors p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${activeConv?.model ? activeConv.model.split('/').pop() : 'NVIDIA NIM'}...`}
              rows={2}
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 resize-none focus:outline-none px-2 py-1 leading-relaxed"
            />
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1 px-1">
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate mr-2">
                {settings.apiKey ? 'NVIDIA Key Active' : 'Demo Mode'}
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isStreaming}
                className={`flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg transition-colors ${
                  input.trim() && !isStreaming
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
