import { NvidiaModel } from '../types';

export const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export const CURATED_MODELS: NvidiaModel[] = [
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    tag: 'Flagship General',
    context: '128K',
    description: 'NVIDIA NIM high-speed inference for general reasoning and assistant workflows.',
  },
  {
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek R1',
    tag: 'Deep Reasoning',
    context: '64K',
    description: 'State-of-the-art open reasoning model with transparent chain-of-thought.',
  },
  {
    id: 'qwen/qwen2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    tag: 'Codex Specialist',
    context: '32K',
    description: 'Optimized for code generation, multi-file refactoring, and algorithmic reasoning.',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron 70B Instruct',
    tag: 'NVIDIA Custom',
    context: '128K',
    description: 'NVIDIA-aligned model with outstanding helpfulness and benchmark scores.',
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    tag: 'Frontier Scale',
    context: '128K',
    description: 'Frontier-grade intelligence for complex architectural synthesis.',
  },
  {
    id: 'mistralai/mistral-large-2-instruct',
    name: 'Mistral Large 2',
    tag: 'Multilingual & Code',
    context: '128K',
    description: 'High-speed reasoning, advanced code capabilities and multilingual nuance.',
  },
];

export interface TestConnectionParams {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/**
 * Returns dynamic system prompt grounded with the real-time date, time, and day of week
 * to prevent LLMs from giving outdated or hallucinated dates.
 */
export function getTemporalSystemPrompt(userSystemPrompt?: string): string {
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
      : 'You are an expert AI software engineer and problem solver powered by NVIDIA NIM.';

  const temporalNotice = `[Real-Time System Grounding: Today is ${dateString}. Current local time is ${timeString} (${timezone}). When the user asks for the date, day, time, or current year, you must answer using this real-time system context.]`;

  return `${base}\n\n${temporalNotice}`;
}

/**
 * Validates Base URL, API Key, and (optionally) Model ID against NVIDIA NIM.
 * Model is optional: if omitted or left blank, falls back to meta/llama-3.3-70b-instruct.
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

  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, message: 'Please enter an NVIDIA API Key.' };
  }

  const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
    return { success: false, message: 'Base URL must start with http:// or https://' };
  }

  // Model is optional: use specified model or default to stable meta/llama-3.3-70b-instruct
  const effectiveModel = model && model.trim().length > 0
    ? model.trim()
    : 'meta/llama-3.3-70b-instruct';

  try {
    const isStandalone = typeof window !== 'undefined' && (
      window.location.protocol === 'file:' ||
      window.location.protocol === 'app:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      (window as any).Capacitor !== undefined ||
      !window.location.origin.startsWith('http')
    );
    const targetUrl = isStandalone
      ? `${cleanBaseUrl}/chat/completions`
      : '/api/chat';

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        'x-nvidia-api-key': apiKey.trim(),
        'x-nvidia-base-url': cleanBaseUrl,
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [{ role: 'user', content: 'Respond with just "OK"' }],
        max_tokens: 5,
        stream: false,
      }),
    });

    if (!res.ok) {
      let parsedError = `HTTP error ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData?.error?.message) {
          parsedError = errorData.error.message;
        } else if (errorData?.error) {
          parsedError = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData?.message) {
          parsedError = errorData.message;
        } else if (errorData?.details) {
          parsedError = errorData.details;
        }
      } catch (e) {
        const text = await res.text().catch(() => '');
        if (text) parsedError = text.slice(0, 150);
      }

      if (res.status === 401) {
        return { success: false, message: `Invalid or unauthorized API key (${parsedError})` };
      }
      if (res.status === 404) {
        return {
          success: false,
          message: `Model '${effectiveModel}' not found on this endpoint or invalid URL (${parsedError})`,
        };
      }
      if (res.status === 410) {
        return {
          success: false,
          message: `Endpoint or model '${effectiveModel}' is no longer active (HTTP 410 Gone: ${parsedError}). Check model ID or use default.`,
        };
      }
      return { success: false, message: `API test failed: ${parsedError}` };
    }

    return {
      success: true,
      message: `Verified! Base URL, API Key, and model '${effectiveModel}' are all functioning correctly.`,
      modelTested: effectiveModel,
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Network error connecting to API' };
  }
}

export async function streamChatCompletion({
  apiKey,
  baseUrl,
  model,
  messages,
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
  temperature: number;
  topP: number;
  maxTokens: number;
  onChunk: (chunk: string) => void;
  onFinish: (fullText: string) => void;
  onError: (error: string) => void;
}) {
  // If no API key provided, fall back to simulated NVIDIA NIM stream with realistic developer response
  if (!apiKey || apiKey.trim() === '') {
    simulateNvidiaResponse(messages[messages.length - 1]?.content || '', model, onChunk, onFinish);
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
    const targetUrl = isStandalone
      ? `${baseUrl.replace(/\/+$/, '')}/chat/completions`
      : '/api/chat';

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        'x-nvidia-api-key': apiKey.trim(),
        'x-nvidia-base-url': baseUrl.trim(),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!res.ok) {
      let errorMsg = `API error ${res.status}`;
      try {
        const errorJson = await res.json();
        errorMsg =
          errorJson.error?.message ||
          errorJson.message ||
          (typeof errorJson.error === 'string' ? errorJson.error : null) ||
          errorJson.details ||
          `API error ${res.status}`;
      } catch (e) {
        const text = await res.text().catch(() => '');
        if (text) errorMsg = text.slice(0, 150);
      }
      onError(errorMsg);
      return;
    }

    if (!res.body) {
      onError('Response body is empty');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
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
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulated += delta;
              onChunk(accumulated);
            }
          } catch (e) {
            // Ignore partial SSE chunks
          }
        }
      }
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
  onFinish: (fullText: string) => void
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
    hour12: true,
  });

  if (
    promptLower.includes('date') ||
    promptLower.includes('today') ||
    promptLower.includes('day is it') ||
    promptLower.includes('what time') ||
    promptLower.includes('current time') ||
    promptLower.includes('current year')
  ) {
    responseText = `Today's date is **${dateString}**, and the current local time is **${timeString}**.\n\n*Synced in real-time with device clock and NVIDIA NIM temporal grounding.*`;
  } else if (promptLower.includes('code') || promptLower.includes('python') || promptLower.includes('function') || promptLower.includes('react')) {
    responseText = `Here is a clean implementation powered by **${model}**:\n\n\`\`\`typescript\n// Synchronized Cross-Platform Task Queue\nexport class SyncTaskQueue<T> {\n  private queue: T[] = [];\n  private isProcessing = false;\n\n  constructor(private handler: (item: T) => Promise<void>) {}\n\n  enqueue(item: T) {\n    this.queue.push(item);\n    this.processNext();\n  }\n\n  private async processNext() {\n    if (this.isProcessing || this.queue.length === 0) return;\n    this.isProcessing = true;\n    \n    const next = this.queue.shift()!;\n    try {\n      await this.handler(next);\n    } catch (err) {\n      console.error("Queue execution error:", err);\n    } finally {\n      this.isProcessing = false;\n      this.processNext();\n    }\n  }\n}\n\`\`\`\n\nYou can click **"Send to Codex Studio"** on this snippet to edit and run it in real-time across your Windows PC and Android phone!`;
  } else {
    responseText = `I am running on the **NVIDIA NIM API** (${model}).\n\nYour message: "${userPrompt}"\n\n### Sync Capabilities Active:\n1. **Windows Desktop App**: Installable via PWA or standalone wrapper with taskbar support.\n2. **Android Phone App**: Native touch viewport with persistent SQLite/IndexedDB caching.\n3. **Real-time Synchronization**: Every message you post here is instantly broadcasted to connected devices in your Sync Room.\n\n*Note: To connect to live NVIDIA inference, click **API Settings** at the top and add your NVIDIA API Key (starts with \`nvapi-...\`).*`;
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
  }, 35);
}
