export interface ZipEntryItem {
  name: string;
  size: number;
  content?: string;
  isText: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // base64 preview/image
  textContent?: string; // extracted text for code/docs/pdf
  isImage: boolean;
  isZip?: boolean;
  zipEntries?: ZipEntryItem[];
  category?: 'image' | 'code' | 'document' | 'data' | 'zip' | 'binary';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  tokensCount?: number;
  attachments?: FileAttachment[];
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

export interface UserMemoryItem {
  id: string;
  content: string;
  category?: 'preference' | 'persona' | 'workflow' | 'fact';
  createdAt: number;
}

export interface AiSkill {
  id: string;
  name: string;
  description: string;
  systemPromptAddition: string;
  isActive: boolean;
  isBuiltIn?: boolean;
  triggerKeyword?: string; // e.g. 'architect', 'review', 'test', 'audit', 'docs'
  category?: 'coding' | 'analysis' | 'writing' | 'devops' | 'productivity' | 'custom';
  icon?: string; // 'code' | 'shield' | 'database' | 'zap' | 'palette' | 'book' | 'terminal' | 'sparkles'
  referenceKnowledge?: string; // styleguide, API specs, schemas, rules
  examplePrompt?: string;
  createdAt?: number;
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
  memories?: UserMemoryItem[];
  skills?: AiSkill[];
}

export type ViewMode = 'auto' | 'windows' | 'android';
export type ActiveTab = 'chat' | 'codex' | 'sync' | 'guide';
