import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for Android Capacitor native apps (https://localhost) and desktop clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-nvidia-api-key, x-nvidia-base-url');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// In-memory sync storage by roomId
interface SyncState {
  roomId: string;
  lastUpdated: number;
  conversations: any[];
  codexSnippets: any[];
  activeModel: string;
  activeDeviceId?: string;
}

const syncRooms = new Map<string, SyncState>();
const sseClients = new Map<string, Set<Response>>();

// Default mock room initial state
function getOrCreateRoom(roomId: string): SyncState {
  if (!syncRooms.has(roomId)) {
    syncRooms.set(roomId, {
      roomId,
      lastUpdated: Date.now(),
      conversations: [
        {
          id: 'welcome-chat',
          title: 'Welcome to SyncWave',
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
          createdAt: Date.now(),
          messages: [
            {
              id: 'm1',
              role: 'assistant',
              content: `Welcome to **SyncWave AI Studio**! ⚡\n\nThis app is powered by the **NVIDIA NIM API** (\`https://integrate.api.nvidia.com/v1\`). You can:\n- 💬 Chat with high-performance LLMs (Nemotron 70B, Mistral Large 2, DeepSeek V4.1, Codestral 22B)\n- 💻 Write, edit, and preview code in the **Codex Studio**\n- 🔄 **Sync live** across your **Windows PC** and **Android Phone** using the Sync Room Key!\n\nTo get started, enter your NVIDIA API key in the top bar or use the built-in demo mode.`,
              timestamp: Date.now(),
            },
          ],
        },
      ],
      codexSnippets: [
        {
          id: 'snippet-1',
          title: 'NVIDIA NIM Client Helper',
          language: 'typescript',
          code: `import OpenAI from "openai";

// NVIDIA NIM uses the standard OpenAI-compatible completions API
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

async function runInference() {
  const completion = await openai.chat.completions.create({
    model: "nvidia/llama-3.1-nemotron-70b-instruct",
    messages: [{ role: "user", content: "Write a high-performance matrix multiplication kernel." }],
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 1024,
    stream: true
  });

  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

runInference();`,
          updatedAt: Date.now(),
        },
      ],
      activeModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
    });
  }
  return syncRooms.get(roomId)!;
}

// NVIDIA NIM Chat Completions Proxy
app.post('/api/chat', async (req: Request, res: Response) => {
  const apiKey = (req.headers['x-nvidia-api-key'] as string) || process.env.NVIDIA_API_KEY || '';
  const baseUrl = (req.headers['x-nvidia-base-url'] as string) || 'https://integrate.api.nvidia.com/v1';
  const { model, messages, temperature = 0.5, top_p = 0.9, max_tokens = 2048, stream = true } = req.body;

  if (!apiKey) {
    res.status(400).json({
      error: 'NVIDIA API Key missing. Please provide your API key in the top settings header.',
    });
    return;
  }

  // Automatically migrate retired EOL model
  const effectiveModel = !model || model === 'meta/llama-3.3-70b-instruct'
    ? 'nvidia/llama-3.1-nemotron-70b-instruct'
    : model;

  try {
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const targetUrl = `${cleanBaseUrl}/chat/completions`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages,
        temperature,
        top_p,
        max_tokens,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `NVIDIA API responded with status ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg =
          errorJson.detail ||
          errorJson.error?.message ||
          errorJson.message ||
          errorJson.title ||
          (typeof errorJson.error === 'string' ? errorJson.error : null) ||
          `NVIDIA API responded with status ${response.status}`;
      } catch (e) {}

      res.status(response.status).json({
        error: errorMsg,
        details: errorText,
      });
      return;
    }

    if (stream && response.body) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
      res.end();
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error: any) {
    console.error('NVIDIA Chat Proxy Error:', error);
    res.status(500).json({
      error: 'Failed to communicate with NVIDIA NIM API',
      message: error?.message || 'Network error',
    });
  }
});

// Fetch Available Models from NVIDIA or return catalog
app.get('/api/models', async (req: Request, res: Response) => {
  const apiKey = (req.headers['x-nvidia-api-key'] as string) || process.env.NVIDIA_API_KEY || '';
  const baseUrl = (req.headers['x-nvidia-base-url'] as string) || 'https://integrate.api.nvidia.com/v1';

  // Fallback curated NVIDIA NIM models list
  const fallbackModels = [
    {
      id: 'nvidia/llama-3.1-nemotron-70b-instruct',
      name: 'Nemotron 70B Instruct',
      tag: 'Flagship NVIDIA',
      context: '128K',
      description: "Optimized with NVIDIA's RLHF for high-fidelity responses.",
    },
    {
      id: 'mistralai/mistral-large-2-instruct',
      name: 'Mistral Large 2',
      tag: 'Multilingual & Code',
      context: '128K',
      description: 'World-class reasoning with multilingual fluency and precise coding.',
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
      description: 'Fine-tuned programming powerhouse for multi-file coding and debugging.',
    },
    {
      id: 'meta/llama-3.2-90b-vision-instruct',
      name: 'Llama 3.2 90B Vision',
      tag: 'Vision & Language',
      context: '128K',
      description: 'Flagship multimodal Meta model with deep analytical comprehension.',
    },
    {
      id: 'nvidia/nemotron-4-340b-instruct',
      name: 'Nemotron 4 340B',
      tag: 'Frontier Scale',
      context: '128K',
      description: 'Enterprise-grade massive foundation model for complex architectural synthesis.',
    },
  ];

  if (!apiKey) {
    res.json({ models: fallbackModels });
    return;
  }

  try {
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const response = await fetch(`${cleanBaseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        const liveModels = data.data.map((m: any) => ({
          id: m.id,
          name: m.id.split('/').pop()?.replace(/-/g, ' ') || m.id,
          tag: m.id.includes('coder') ? 'Codex' : m.id.includes('r1') ? 'Reasoning' : 'NIM',
          context: '128K',
          description: m.owned_by ? `Provided by ${m.owned_by}` : 'NVIDIA NIM model endpoint',
        }));
        res.json({ models: liveModels });
        return;
      }
    }
  } catch (err) {
    console.log('Using curated fallback models catalog:', err);
  }

  res.json({ models: fallbackModels });
});

// Real-Time Device Sync Endpoints
app.get('/api/sync/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const state = getOrCreateRoom(roomId);
  res.json(state);
});

app.post('/api/sync/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const current = getOrCreateRoom(roomId);
  const payload = req.body;

  const updated: SyncState = {
    ...current,
    ...payload,
    roomId,
    lastUpdated: Date.now(),
  };

  syncRooms.set(roomId, updated);

  // Broadcast to all active SSE subscribers for this roomId
  const clients = sseClients.get(roomId);
  if (clients) {
    const dataStr = `data: ${JSON.stringify(updated)}\n\n`;
    for (const client of clients) {
      client.write(dataStr);
    }
  }

  res.json({ success: true, lastUpdated: updated.lastUpdated });
});

// SSE Live Stream for instant cross-device updates
app.get('/api/sync/:roomId/stream', (req: Request, res: Response) => {
  const { roomId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!sseClients.has(roomId)) {
    sseClients.set(roomId, new Set());
  }
  const clients = sseClients.get(roomId)!;
  clients.add(res);

  // Send current state right away
  const initial = getOrCreateRoom(roomId);
  res.write(`data: ${JSON.stringify(initial)}\n\n`);

  req.on('close', () => {
    clients.delete(res);
    if (clients.size === 0) {
      sseClients.delete(roomId);
    }
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncWave Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
