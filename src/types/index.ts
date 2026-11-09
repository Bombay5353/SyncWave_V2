export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  tokensCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  systemPrompt?: string;
}

export interface CodexSnippet {
  id: string;
  title: string;
  language: 'javascript' | 'typescript' | 'html' | 'css' | 'python' | 'json' | 'sql' | 'markdown';
  code: string;
  updatedAt: number;
  description?: string;
}

export interface SyncState {
  roomId: string;
  lastUpdated: number;
  conversations: Conversation[];
  codexSnippets: CodexSnippet[];
  activeModel: string;
  activeDeviceId?: string;
}

export interface NvidiaModel {
  id: string;
  name: string;
  tag: string;
  context: string;
  description: string;
}

export interface AppSettings {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  syncRoomId: string;
  deviceName: string;
}

export type ViewMode = 'auto' | 'windows' | 'android';
export type ActiveTab = 'chat' | 'codex' | 'sync' | 'guide';
