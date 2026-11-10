import { NvidiaModel, FileAttachment, UserMemoryItem, AiSkill } from '../types';

export const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
export const DEFAULT_ACTIVE_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';

export interface LlmProvider {
  id: string;
  name: string;
  badge: string;
  baseUrl: string;
  keyPrefixHint: string;
  keyPlaceholder: string;
  defaultModel: string;
  description: string;
  popularModels: { id: string; name: string; context: string; tag: string }[];
}

export const LLM_PROVIDERS: LlmProvider[] = [
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    badge: 'NVIDIA Cloud',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    keyPrefixHint: 'nvapi-...',
    keyPlaceholder: 'nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
    description: 'High-performance NIM microservices from NVIDIA AI Catalog.',
    popularModels: [
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', context: '128K', tag: 'Flagship' },
      { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2', context: '128K', tag: 'Code/Reason' },
      { id: 'deepseek-ai/deepseek-v4.1-flash', name: 'DeepSeek V4.1', context: '128K', tag: 'Fast' },
      { id: 'mistralai/codestral-22b-instruct-v0.1', name: 'Codestral 22B', context: '32K', tag: 'Codex' },
      { id: 'meta/llama-3.2-90b-vision-instruct', name: 'Llama 3.2 90B', context: '128K', tag: 'Vision' },
      { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 340B', context: '128K', tag: 'Frontier' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    badge: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyPrefixHint: 'sk-proj-... / sk-...',
    keyPlaceholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'gpt-4o',
    description: 'Official OpenAI GPT-4o, o1, and o3-mini models.',
    popularModels: [
      { id: 'gpt-4o', name: 'GPT-4o', context: '128K', tag: 'Omni Flagship' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: '128K', tag: 'Fast & Cheap' },
      { id: 'o3-mini', name: 'o3-mini', context: '200K', tag: 'STEM/Code' },
      { id: 'o1', name: 'o1', context: '200K', tag: 'Deep Reasoning' },
      { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Dynamic', context: '128K', tag: 'Latest Web' },
    ],
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    badge: 'Claude',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPrefixHint: 'sk-or-... or sk-ant-...',
    keyPlaceholder: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'anthropic/claude-3.7-sonnet',
    description: 'Claude 3.7 Sonnet, Claude 3.5 Sonnet, and Haiku via OpenRouter or direct Anthropic.',
    popularModels: [
      { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', context: '200K', tag: 'Hybrid Thinking' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', context: '200K', tag: 'Coding Standard' },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', context: '200K', tag: 'Ultra-fast' },
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 (Direct)', context: '200K', tag: 'Direct API' },
    ],
  },
  {
    id: 'grok',
    name: 'xAI (Grok)',
    badge: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    keyPrefixHint: 'xai-...',
    keyPlaceholder: 'xai-xxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'grok-2-latest',
    description: 'Official xAI Grok-2 and Grok Vision models.',
    popularModels: [
      { id: 'grok-2-latest', name: 'Grok 2 Latest', context: '128K', tag: 'Flagship' },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', context: '32K', tag: 'Multimodal' },
      { id: 'grok-beta', name: 'Grok Beta', context: '128K', tag: 'General' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    badge: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    keyPrefixHint: 'pplx-...',
    keyPlaceholder: 'pplx-xxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'sonar-pro',
    description: 'Real-time grounded search and reasoning models from Perplexity.',
    popularModels: [
      { id: 'sonar-pro', name: 'Sonar Pro', context: '200K', tag: 'Flagship Search' },
      { id: 'sonar', name: 'Sonar', context: '128K', tag: 'Fast Search' },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', context: '128K', tag: 'Reasoning CoT' },
      { id: 'sonar-reasoning', name: 'Sonar Reasoning', context: '128K', tag: 'Web Reasoning' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq (Ultra-Fast LPU)',
    badge: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyPrefixHint: 'gsk_...',
    keyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'llama-3.3-70b-versatile',
    description: 'Blazing fast sub-second inference on Groq LPUs.',
    popularModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', context: '128K', tag: 'Flagship' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B', context: '128K', tag: 'Reasoning' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', context: '32K', tag: 'Fast MoE' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', context: '8K', tag: 'Lightweight' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek Official',
    badge: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    keyPrefixHint: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    defaultModel: 'deepseek-chat',
    description: 'Official DeepSeek V3 chat and DeepSeek R1 reasoning endpoints.',
    popularModels: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 Chat', context: '64K', tag: 'DeepSeek-V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 Reasoner', context: '64K', tag: 'DeepSeek-R1 CoT' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom / Local (Ollama, LM Studio)',
    badge: 'Custom',
    baseUrl: 'http://localhost:11434/v1',
    keyPrefixHint: 'Any key or leave empty',
    keyPlaceholder: 'sk-custom or leave empty for Ollama',
    defaultModel: 'llama3.2',
    description: 'Any self-hosted Ollama, LM Studio, vLLM, or custom OpenAI-compatible endpoint.',
    popularModels: [
      { id: 'llama3.2', name: 'Llama 3.2', context: '128K', tag: 'Local' },
      { id: 'deepseek-r1', name: 'DeepSeek R1', context: '64K', tag: 'Local' },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', context: '32K', tag: 'Local' },
      { id: 'mistral', name: 'Mistral', context: '32K', tag: 'Local' },
    ],
  },
];

export const CURATED_MODELS: NvidiaModel[] = [
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron 70B Instruct',
    tag: 'Flagship NVIDIA',
    context: '128K',
    description: 'NVIDIA-aligned model with state-of-the-art reasoning, code, and helpfulness.',
  },
  {
    id: 'mistralai/mistral-large-2-instruct',
    name: 'Mistral Large 2',
    tag: 'Multilingual & Code',
    context: '128K',
    description: 'Flagship reasoning with multi-language fluency and advanced algorithmic coding.',
  },
  {
    id: 'deepseek-ai/deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash',
    tag: 'Deep Reasoning',
    context: '128K',
    description: 'Ultra-fast open architecture model optimized for low-latency reasoning.',
  },
  {
    id: 'mistralai/codestral-22b-instruct-v0.1',
    name: 'Codestral 22B',
    tag: 'Codex Specialist',
    context: '32K',
    description: 'Tailored for software engineering, multi-file refactoring, and code review.',
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    tag: 'OpenAI Flagship',
    context: '128K',
    description: 'High-speed flagship multimodal omni intelligence from OpenAI.',
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    tag: 'Anthropic Flagship',
    context: '200K',
    description: 'Hybrid reasoning and software engineering model from Anthropic.',
  },
  {
    id: 'grok-2-latest',
    name: 'xAI Grok 2',
    tag: 'xAI Frontier',
    context: '128K',
    description: 'Frontier reasoning and real-time knowledge from xAI.',
  },
  {
    id: 'sonar-pro',
    name: 'Perplexity Sonar Pro',
    tag: 'Perplexity Search',
    context: '200K',
    description: 'Grounded live search model from Perplexity AI.',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Groq Llama 3.3 70B',
    tag: 'Groq Real-Time',
    context: '128K',
    description: 'Ultra high-speed Llama 3.3 execution on Groq LPU chips.',
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    tag: 'Vision & Language',
    context: '128K',
    description: 'Flagship multimodal Meta model with deep analytical comprehension.',
  },
];

export interface TestConnectionParams {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export const DEFAULT_SKILLS: AiSkill[] = [
  {
    id: 'skill-code-architect',
    name: 'Full-Stack Architect',
    description: 'Production-ready code, strict types, edge cases, and modern patterns.',
    systemPromptAddition: 'Act as a Senior Full-Stack Architect. Write clean, modular, production-ready code with complete TypeScript types, defensive edge-case handling, and modern architectural patterns.',
    triggerKeyword: 'architect',
    category: 'coding',
    icon: 'code',
    isActive: true,
    isBuiltIn: true,
  },
  {
    id: 'skill-bug-hunter',
    name: 'Deep Code Reviewer',
    description: 'Security vulnerabilities, memory leaks, algorithmic complexity, and edge cases.',
    systemPromptAddition: 'Act as a Principal Security & Code Auditor. Systematically inspect code for subtle bugs, race conditions, memory leaks, and performance bottlenecks, then explain root causes and robust fixes.',
    triggerKeyword: 'review',
    category: 'analysis',
    icon: 'shield',
    isActive: false,
    isBuiltIn: true,
  },
  {
    id: 'skill-test-tdd',
    name: 'Unit Test & TDD Pro',
    description: 'Generates comprehensive test suites, mocks, edge cases, and regression tests.',
    systemPromptAddition: 'Act as a Principal QA & Test Automation Specialist. Write exhaustive test suites with clear assertion descriptions, edge-case coverage, and mocking strategies (Jest, Vitest, PyTest).',
    triggerKeyword: 'test',
    category: 'coding',
    icon: 'terminal',
    isActive: false,
    isBuiltIn: true,
  },
  {
    id: 'skill-data-ai',
    name: 'Data & AI Specialist',
    description: 'Python, Pandas, NumPy, PyTorch, SQL schemas, data pipelines, and embeddings.',
    systemPromptAddition: 'Act as an expert Data & Machine Learning Engineer. Provide vectorized Python implementations, performant SQL schemas, and efficient data pipeline logic.',
    triggerKeyword: 'data',
    category: 'analysis',
    icon: 'database',
    isActive: false,
    isBuiltIn: true,
  },
  {
    id: 'skill-docs-gen',
    name: 'Technical Writer & Docstring Pro',
    description: 'Creates crystal-clear Markdown docs, API references, architecture diagrams, and READMEs.',
    systemPromptAddition: 'Act as a Lead Technical Documentation Engineer. Produce impeccably structured Markdown documentation, API specs, sequence diagrams in Mermaid, and descriptive function docstrings.',
    triggerKeyword: 'docs',
    category: 'writing',
    icon: 'book',
    isActive: false,
    isBuiltIn: true,
  },
  {
    id: 'skill-concise-pro',
    name: 'Concise Pro',
    description: 'No conversational filler or pleasantries; straight to direct code and solutions.',
    systemPromptAddition: 'Be extremely direct and concise. Avoid conversational preambles, introductory filler, or redundant restatements. Provide exact code and immediate answers.',
    triggerKeyword: 'concise',
    category: 'productivity',
    icon: 'zap',
    isActive: false,
    isBuiltIn: true,
  },
];

export const DEFAULT_MEMORIES: UserMemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    content: 'Prefers modern TypeScript and clean functional React components with Tailwind CSS.',
    createdAt: Date.now(),
  },
  {
    id: 'mem-2',
    category: 'workflow',
    content: 'Prefers complete, production-ready code snippets with practical execution examples.',
    createdAt: Date.now(),
  },
];

/**
 * Returns dynamic system prompt grounded with the real-time date/time,
 * persistent user memories/preferences, and equipped AI skills.
 */
export function getTemporalSystemPrompt(
  userSystemPrompt?: string,
  memories?: UserMemoryItem[],
  skills?: AiSkill[]
): string {
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  let timezone = 'Local Time';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  } catch (e) {}

  const base =
    userSystemPrompt && userSystemPrompt.trim().length > 0
      ? userSystemPrompt.trim()
      : 'You are an expert AI software engineer and problem solver.';

  const temporalNotice = `[Real-Time System Grounding: Today is ${dateString}. Current local time is ${timeString} (${timezone}). When the user asks for the date, day, time, or current year, you must answer using this real-time system context.]`;

  let memoryContext = '';
  if (memories && memories.length > 0) {
    const memoryList = memories.map((m) => `- ${m.content}`).join('\n');
    memoryContext = `\n\n[Persistent User Memory & Preferences (Honored across all chats)]:\n${memoryList}\nAlways tailor your answers according to these persistent user preferences without asking them to repeat.`;
  }

  let skillsContext = '';
  const activeSkills = skills ? skills.filter((s) => s.isActive) : [];
  if (activeSkills.length > 0) {
    const skillList = activeSkills
      .map((s) => {
        let block = `### Equipped Skill: ${s.name}\n${s.systemPromptAddition}`;
        if (s.referenceKnowledge && s.referenceKnowledge.trim()) {
          block += `\n\n[Skill Knowledge Base / Guidelines]:\n${s.referenceKnowledge.trim()}`;
        }
        return block;
      })
      .join('\n\n');
    skillsContext = `\n\n[Active AI Skills & Directives (Channeling Specialized Personas)]:\n${skillList}`;
  }

  return `${base}\n\n${temporalNotice}${memoryContext}${skillsContext}`;
}

export const CLOUD_RELAY_CHAT_URL =
  'https://ais-pre-n3laelskoh6pbbuixx6l37-683064120718.asia-northeast1.run.app/api/chat';

async function executeApiRequest(targetUrl: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(targetUrl, options);
  } catch (err: any) {
    if (targetUrl !== '/api/chat' && targetUrl !== CLOUD_RELAY_CHAT_URL) {
      console.warn('Direct API fetch failed, retrying via Cloud Relay:', err);
      return await fetch(CLOUD_RELAY_CHAT_URL, options);
    }
    throw err;
  }
}

/**
 * Sanitize models (e.g. migrate retired EOL models like meta/llama-3.3-70b-instruct on NVIDIA)
 */
export function sanitizeModel(model?: string, baseUrl: string = DEFAULT_NVIDIA_BASE_URL): string {
  if (!model || model.trim().length === 0) {
    if (baseUrl.includes('openai.com')) return 'gpt-4o';
    if (baseUrl.includes('anthropic.com')) return 'claude-3-7-sonnet-20250219';
    if (baseUrl.includes('openrouter.ai')) return 'anthropic/claude-3.7-sonnet';
    if (baseUrl.includes('x.ai')) return 'grok-2-latest';
    if (baseUrl.includes('perplexity.ai')) return 'sonar-pro';
    if (baseUrl.includes('groq.com')) return 'llama-3.3-70b-versatile';
    if (baseUrl.includes('deepseek.com')) return 'deepseek-chat';
    return DEFAULT_ACTIVE_MODEL;
  }
  const trimmed = model.trim();
  if (trimmed === 'meta/llama-3.3-70b-instruct' && baseUrl.includes('nvidia.com')) {
    return DEFAULT_ACTIVE_MODEL;
  }
  return trimmed;
}

/**
 * Validates Base URL, API Key, and Model ID against ANY LLM Provider
 * (NVIDIA NIM, OpenAI, Claude/Anthropic, Grok, Perplexity, Groq, DeepSeek, Local/Ollama).
 */
export async function testNvidiaConnection(
  apiKeyOrParams: string | TestConnectionParams,
  baseUrlArg: string = DEFAULT_NVIDIA_BASE_URL,
  modelArg?: string
): Promise<{ success: boolean; message: string; modelTested?: string }> {
  let apiKey = '';
  let baseUrl = DEFAULT_NVIDIA_BASE_URL;
  let model: string | undefined = undefined;

  if (typeof apiKeyOrParams === 'object' && apiKeyOrParams !== null) {
    apiKey = apiKeyOrParams.apiKey || '';
    baseUrl = apiKeyOrParams.baseUrl || DEFAULT_NVIDIA_BASE_URL;
    model = apiKeyOrParams.model;
  } else {
    apiKey = apiKeyOrParams || '';
    baseUrl = baseUrlArg || DEFAULT_NVIDIA_BASE_URL;
    model = modelArg;
  }

  const cleanBaseUrl = (baseUrl || DEFAULT_NVIDIA_BASE_URL).trim().replace(/\/+$/, '');
  if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
    return { success: false, message: 'Base URL must start with http:// or https://' };
  }

  const effectiveModel = sanitizeModel(model, cleanBaseUrl);
  const isAnthropicDirect = cleanBaseUrl.includes('api.anthropic.com');

  if (!apiKey && !cleanBaseUrl.includes('localhost') && !cleanBaseUrl.includes('127.0.0.1')) {
    return { success: false, message: 'Please enter your API Key.' };
  }

  try {
    const isStandalone = typeof window !== 'undefined' && (
      window.location.protocol === 'file:' ||
      window.location.protocol === 'app:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      (window as any).Capacitor !== undefined ||
      !window.location.origin.startsWith('http')
    );

    let targetUrl: string;
    let headers: Record<string, string>;
    let body: string;

    if (isAnthropicDirect) {
      targetUrl = isStandalone ? `${cleanBaseUrl}/messages` : '/api/chat';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'x-nvidia-api-key': apiKey.trim(),
        'x-nvidia-base-url': cleanBaseUrl,
      };
      body = JSON.stringify({
        model: effectiveModel,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Respond with OK' }],
      });
    } else {
      targetUrl = isStandalone ? `${cleanBaseUrl}/chat/completions` : '/api/chat';
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        'x-nvidia-api-key': apiKey.trim(),
        'x-nvidia-base-url': cleanBaseUrl,
      };
      body = JSON.stringify({
        model: effectiveModel,
        messages: [{ role: 'user', content: 'Respond with just "OK"' }],
        max_tokens: 5,
        stream: false,
      });
    }

    const res = await executeApiRequest(targetUrl, {
      method: 'POST',
      headers,
      body,
    });

    if (!res.ok) {
      let parsedError = `HTTP error ${res.status}`;
      try {
        const errorData = await res.json();
        parsedError =
          errorData?.detail ||
          errorData?.error?.message ||
          (typeof errorData?.error === 'string' ? errorData.error : null) ||
          errorData?.message ||
          errorData?.title ||
          errorData?.details ||
          `HTTP error ${res.status}`;
      } catch (e) {
        const text = await res.text().catch(() => '');
        if (text) parsedError = text.slice(0, 150);
      }

      if (res.status === 401 || res.status === 403) {
        return { success: false, message: `Authentication failed (${parsedError}). Please verify your API Key.` };
      }
      if (res.status === 404) {
        return {
          success: false,
          message: `Endpoint or model '${effectiveModel}' not found on ${cleanBaseUrl} (${parsedError}).`,
        };
      }
      if (res.status === 410) {
        return {
          success: false,
          message: `Model '${effectiveModel}' has reached end-of-life on this provider (${parsedError}). Switch to an active model.`,
        };
      }
      return { success: false, message: `API test failed: ${parsedError}` };
    }

    // Identify provider name for friendly feedback
    const matchedProvider = LLM_PROVIDERS.find((p) => cleanBaseUrl.includes(p.id) || p.baseUrl.includes(cleanBaseUrl));
    const providerName = matchedProvider ? matchedProvider.name : cleanBaseUrl;

    return {
      success: true,
      message: `Verified! Successfully connected to ${providerName} using model '${effectiveModel}'.`,
      modelTested: effectiveModel,
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Network error connecting to API' };
  }
}

export const testLlmConnection = testNvidiaConnection;

/**
 * Universal Streaming Chat Completion
 * Supports OpenAI, NVIDIA NIM, Anthropic Claude, xAI Grok, Perplexity, Groq, DeepSeek, and custom APIs.
 * Supports Multimodal Vision & Document Attachments.
 */
export async function streamChatCompletion({
  apiKey,
  baseUrl,
  model,
  messages,
  attachments,
  temperature,
  topP,
  maxTokens,
  onChunk,
  onFinish,
  onError,
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: { role: string; content: string }[];
  attachments?: FileAttachment[];
  temperature: number;
  topP: number;
  maxTokens: number;
  onChunk: (chunk: string) => void;
  onFinish: (fullText: string) => void;
  onError: (error: string) => void;
}) {
  const cleanBaseUrl = (baseUrl || DEFAULT_NVIDIA_BASE_URL).trim().replace(/\/+$/, '');
  const effectiveModel = sanitizeModel(model, cleanBaseUrl);

  // If no API key provided and not targeting local Ollama, fallback to simulation
  if ((!apiKey || apiKey.trim() === '') && !cleanBaseUrl.includes('localhost') && !cleanBaseUrl.includes('127.0.0.1')) {
    simulateNvidiaResponse(messages[messages.length - 1]?.content || '', effectiveModel, onChunk, onFinish, attachments);
    return;
  }

  try {
    const isStandalone = typeof window !== 'undefined' && (
      window.location.protocol === 'file:' ||
      window.location.protocol === 'app:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      (window as any).Capacitor !== undefined ||
      !window.location.origin.startsWith('http')
    );

    const isAnthropicDirect = cleanBaseUrl.includes('api.anthropic.com');
    const imageAttachments = attachments ? attachments.filter((a) => a.isImage && a.dataUrl) : [];
    let targetUrl: string;
    let fetchOptions: RequestInit;

    if (isAnthropicDirect) {
      targetUrl = isStandalone ? `${cleanBaseUrl}/messages` : '/api/chat';
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const conversationMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m, idx, arr) => {
          const isLastUser = idx === arr.length - 1 && m.role === 'user';
          if (isLastUser && imageAttachments.length > 0) {
            const contentParts: any[] = [{ type: 'text', text: m.content }];
            for (const img of imageAttachments) {
              const [meta, base64] = (img.dataUrl || '').split(',');
              const mediaType = meta?.split(':')[1]?.split(';')[0] || 'image/jpeg';
              contentParts.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64,
                },
              });
            }
            return { role: 'user', content: contentParts };
          }
          return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content };
        });

      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'x-nvidia-api-key': apiKey.trim(),
          'x-nvidia-base-url': cleanBaseUrl,
        },
        body: JSON.stringify({
          model: effectiveModel,
          messages: conversationMessages,
          system: systemMessage,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
          stream: true,
        }),
      };
    } else {
      targetUrl = isStandalone ? `${cleanBaseUrl}/chat/completions` : '/api/chat';
      const payloadMessages = messages.map((m, idx, arr) => {
        const isLastUser = idx === arr.length - 1 && m.role === 'user';
        if (isLastUser && imageAttachments.length > 0) {
          const contentParts: any[] = [{ type: 'text', text: m.content }];
          for (const img of imageAttachments) {
            contentParts.push({
              type: 'image_url',
              image_url: { url: img.dataUrl },
            });
          }
          return { role: m.role, content: contentParts };
        }
        return m;
      });

      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
          'x-nvidia-api-key': apiKey.trim(),
          'x-nvidia-base-url': cleanBaseUrl,
        },
        body: JSON.stringify({
          model: effectiveModel,
          messages: payloadMessages,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
          stream: true,
        }),
      };
    }

    const res = await executeApiRequest(targetUrl, fetchOptions);

    if (!res.ok) {
      let errorMsg = `API error ${res.status}`;
      try {
        const errorJson = await res.json();
        errorMsg =
          errorJson.detail ||
          errorJson.error?.message ||
          errorJson.message ||
          (typeof errorJson.error === 'string' ? errorJson.error : null) ||
          errorJson.title ||
          errorJson.details ||
          `API error ${res.status}`;
      } catch (e) {
        const text = await res.text().catch(() => '');
        if (text) errorMsg = text.slice(0, 150);
      }

      if (res.status === 410) {
        errorMsg = `Model '${effectiveModel}' is no longer active on this endpoint (${errorMsg}). Please select an active model.`;
      }
      onError(errorMsg);
      return;
    }

    let accumulated = '';

    // If streaming body reader is available (browser and desktop)
    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              // Universal chunk extraction: OpenAI delta.content, Anthropic delta.text, or Perplexity text
              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.delta?.text ||
                parsed.choices?.[0]?.text ||
                '';
              if (delta) {
                accumulated += delta;
                onChunk(accumulated);
              }
            } catch (e) {
              // Ignore partial SSE chunk parses
            }
          }
        }
      }
    } else {
      // Buffered body fallback (e.g. mobile native HTTP layer)
      const fullText = await res.text();
      if (fullText.includes('data: ')) {
        const lines = fullText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.delta?.text ||
                parsed.choices?.[0]?.text ||
                '';
              if (delta) {
                accumulated += delta;
              }
            } catch (e) {}
          }
        }
      } else {
        try {
          const parsed = JSON.parse(fullText);
          accumulated =
            parsed.choices?.[0]?.message?.content ||
            parsed.content?.[0]?.text ||
            parsed.choices?.[0]?.delta?.content ||
            fullText;
        } catch (e) {
          accumulated = fullText;
        }
      }
      onChunk(accumulated);
    }

    onFinish(accumulated);
  } catch (err: any) {
    onError(err?.message || 'Streaming failed');
  }
}

// Fallback simulator for preview & demo when no key is entered yet
function simulateNvidiaResponse(
  userPrompt: string,
  model: string,
  onChunk: (chunk: string) => void,
  onFinish: (fullText: string) => void,
  attachments?: FileAttachment[]
) {
  let responseText = '';
  const promptLower = userPrompt.toLowerCase();
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  if (attachments && attachments.length > 0) {
    const fileList = attachments.map((a) => `\`${a.name}\` (${(a.size / 1024).toFixed(1)} KB)`).join(', ');
    const hasImages = attachments.some((a) => a.isImage);
    responseText = `### 📎 File Analysis (${attachments.length} attachment${attachments.length > 1 ? 's' : ''})\n**Detected:** ${fileList}\n\nI have parsed your uploaded ${hasImages ? 'multimodal image(s) and documents' : 'files'}.\n\n#### Key Observations:\n1. **Data Inspection**: Parsed structure and verified content payload without corruption.\n2. **Context Integration**: File context has been integrated into the prompt session for **${model}**.\n\n${userPrompt ? `Regarding your request: *"${userPrompt}"*\n\nThe content is ready for review, refactoring, or question-answering.` : 'How would you like me to analyze or process these files?'}\n\n*To run live frontier multimodal vision inference (GPT-4o, Claude 3.7 Sonnet, Grok 2 Vision, Llama 3.2 90B Vision), add your API key in **API Settings**.*`;
  } else if (
    promptLower.includes('date') ||
    promptLower.includes('today') ||
    promptLower.includes('day is it') ||
    promptLower.includes('what time') ||
    promptLower.includes('current time') ||
    promptLower.includes('current year')
  ) {
    responseText = `Today's date is **${dateString}**, and the current local time is **${timeString}**.\n\n*Synced in real-time with device clock and live temporal grounding.*`;
  } else if (promptLower.includes('code') || promptLower.includes('python') || promptLower.includes('function') || promptLower.includes('react')) {
    responseText = `Here is a clean implementation powered by **${model}**:\n\n\`\`\`typescript\n// Universal Cross-Platform LLM Task Queue\nexport class SyncTaskQueue<T> {\n  private queue: T[] = [];\n  private isProcessing = false;\n\n  constructor(private handler: (item: T) => Promise<void>) {}\n\n  enqueue(item: T) {\n    this.queue.push(item);\n    this.processNext();\n  }\n\n  private async processNext() {\n    if (this.isProcessing || this.queue.length === 0) return;\n    this.isProcessing = true;\n    \n    const next = this.queue.shift()!;\n    try {\n      await this.handler(next);\n    } catch (err) {\n      console.error("Queue execution error:", err);\n    } finally {\n      this.isProcessing = false;\n      this.processNext();\n    }\n  }\n}\n\`\`\`\n\nYou can click **"Send to Codex Studio"** on this snippet to edit and run it in real-time across your Windows PC and Android phone!`;
  } else {
    responseText = `I am running in demo mode with **${model}**.\n\nYour message: "${userPrompt}"\n\n### Multi-Provider Capabilities Active:\n1. **Any Base URL & API Key**: Supports **OpenAI (ChatGPT)**, **Anthropic Claude**, **xAI Grok**, **Perplexity AI**, **Groq**, **DeepSeek**, **NVIDIA NIM**, and local Ollama.\n2. **Universal File Upload**: Attach images, PDFs, code files, CSV, or text for instant AI analysis.\n3. **Windows & Android Sync**: Messages, codes, and presets mirror instantly across your devices.\n\n*To connect to live frontier models, click **API Settings** at the top, choose your provider preset (or enter a custom URL), and add your API Key.*`;
  }

  let index = 0;
  const words = responseText.split(' ');
  const interval = setInterval(() => {
    if (index < words.length) {
      index++;
      onChunk(words.slice(0, index).join(' '));
    } else {
      clearInterval(interval);
      onFinish(responseText);
    }
  }, 30);
}
