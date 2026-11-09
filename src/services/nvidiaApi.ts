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

export async function testNvidiaConnection(apiKey: string, baseUrl: string = DEFAULT_NVIDIA_BASE_URL) {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, message: 'Please enter an NVIDIA API Key.' };
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nvidia-api-key': apiKey.trim(),
        'x-nvidia-base-url': baseUrl.trim(),
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: 'Respond with just "OK"' }],
        max_tokens: 5,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      return { success: false, message: err.error || `Error status ${res.status}` };
    }

    return { success: true, message: 'Connected to NVIDIA NIM API successfully!' };
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
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      const errorJson = await res.json().catch(() => ({ error: 'Connection failed' }));
      onError(errorJson.error || errorJson.details || `API error ${res.status}`);
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

  if (promptLower.includes('code') || promptLower.includes('python') || promptLower.includes('function') || promptLower.includes('react')) {
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
