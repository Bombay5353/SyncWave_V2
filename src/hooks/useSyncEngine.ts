import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, CodexSnippet, SyncState, AppSettings } from '../types';

const STORAGE_KEY_ROOM = 'syncwave_room_id';
const STORAGE_KEY_SETTINGS = 'syncwave_settings';
const STORAGE_KEY_CONVS = 'syncwave_conversations';
const STORAGE_KEY_SNIPPETS = 'syncwave_snippets';

export function useSyncEngine() {
  // Detect current device platform
  const getDevicePlatform = (): string => {
    if (typeof navigator === 'undefined') return 'Desktop Device';
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return 'Android Device';
    if (/iphone|ipad|ipod/.test(ua)) return 'iOS Device';
    if (/windows/.test(ua)) return 'Windows Desktop';
    if (/mac/.test(ua)) return 'macOS Workstation';
    if (/linux/.test(ua)) return 'Linux Machine';
    return 'Web Client';
  };

  // Get Room ID from URL query if present (for QR scanning from Android)
  const getInitialRoomId = (): string => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom && urlRoom.trim()) {
        localStorage.setItem(STORAGE_KEY_ROOM, urlRoom.trim().toUpperCase());
        return urlRoom.trim().toUpperCase();
      }
      const stored = localStorage.getItem(STORAGE_KEY_ROOM);
      if (stored) return stored;
    }
    // Generate friendly 4-digit room code
    const generated = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ROOM, generated);
    }
    return generated;
  };

  const [roomId, setRoomId] = useState<string>(getInitialRoomId);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [devicePlatform] = useState<string>(getDevicePlatform);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      apiKey: '',
      defaultModel: 'meta/llama-3.3-70b-instruct',
      temperature: 0.6,
      topP: 0.9,
      maxTokens: 2048,
      systemPrompt: 'You are an expert AI software engineer and problem solver powered by NVIDIA NIM.',
      syncRoomId: roomId,
      deviceName: getDevicePlatform(),
    };
  });

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CONVS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'c-welcome',
        title: 'Getting Started with NVIDIA NIM',
        model: 'meta/llama-3.3-70b-instruct',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'm-1',
            role: 'assistant',
            content: `### Welcome to SyncWave Studio! ⚡\n\nYour app is equipped with **NVIDIA NIM API** integration (\`https://integrate.api.nvidia.com/v1\`) and **Real-Time Cross-Device Synchronization**.\n\n#### What can you do right now?\n1. **Live Synchronization**: Notice your Room ID (\`${roomId}\`). Open this URL on your **Android phone** or **Windows desktop** and your messages and code will mirror in real time!\n2. **Codex Studio**: Open the **Codex** tab to write code with live HTML/JS preview and execution sandbox.\n3. **Install as App**: Use the **Install App** button to install as a standalone PWA on Windows or Android without an app store.\n4. **NVIDIA API Key**: Click **API Settings** in the header to enter your API key (\`nvapi-...\`) for live frontier models like DeepSeek R1 and Llama 3.3.`,
            timestamp: Date.now(),
          },
        ],
      },
    ];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || '';
  });

  // Codex Snippets State
  const [snippets, setSnippets] = useState<CodexSnippet[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SNIPPETS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 's-nvidia-client',
        title: 'nvidia_nim_client.py',
        language: 'python',
        description: 'Native Python client for NVIDIA NIM chat completions',
        code: `import os
from openai import OpenAI

# Initialize client using NVIDIA NIM API Base URL
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.environ.get("NVIDIA_API_KEY")
)

def run_chat():
    response = client.chat.completions.create(
        model="deepseek-ai/deepseek-r1",
        messages=[{"role": "user", "content": "Explain how cross-device sync works via WebSockets and SSE."}],
        temperature=0.6,
        max_tokens=1024,
        stream=True
    )
    
    print("--- NVIDIA NIM Output ---")
    for chunk in response:
        delta = chunk.choices[0].delta.content or ""
        print(delta, end="", flush=True)

if __name__ == "__main__":
    run_chat()`,
        updatedAt: Date.now(),
      },
      {
        id: 's-html-sandbox',
        title: 'matrix_rain.html',
        language: 'html',
        description: 'Interactive canvas preview ready to run in the Sandbox',
        code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #070b12; overflow: hidden; font-family: monospace; }
    canvas { display: block; }
    #badge { position: absolute; top: 12px; left: 12px; color: #76b900; background: rgba(0,0,0,0.7); padding: 6px 12px; border-radius: 6px; border: 1px solid #76b900; font-size: 12px; }
  </style>
</head>
<body>
  <div id="badge">NVIDIA NIM Live Sandbox</div>
  <canvas id="c"></canvas>
  <script>
    const c = document.getElementById("c");
    const ctx = c.getContext("2d");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const chars = "0123456789ABCDEF⚡SYNCWAVE";
    const fontSize = 14;
    const columns = c.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function draw() {
      ctx.fillStyle = "rgba(7, 11, 18, 0.08)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#76b900";
      ctx.font = fontSize + "px monospace";
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > c.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
    setInterval(draw, 33);
  </script>
</body>
</html>`,
        updatedAt: Date.now(),
      },
    ];
  });

  const [activeSnippetId, setActiveSnippetId] = useState<string>(() => snippets[0]?.id || '');

  // Ref to avoid cyclic broadcasts
  const isIncomingSync = useRef(false);

  // Sync to server
  const broadcastSync = useCallback(
    async (newConversations: Conversation[], newSnippets: CodexSnippet[], model: string) => {
      if (isIncomingSync.current) return;
      try {
        setSyncStatus('syncing');
        await fetch(`/api/sync/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversations: newConversations,
            codexSnippets: newSnippets,
            activeModel: model,
            activeDeviceId: devicePlatform,
          }),
        });
        setSyncStatus('connected');
        setLastSyncTime(Date.now());
      } catch (err) {
        console.warn('Sync broadcast warning:', err);
        setSyncStatus('offline');
      }
    },
    [roomId, devicePlatform]
  );

  // Persistent storage effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONVS, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SNIPPETS, JSON.stringify(snippets));
  }, [snippets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Connect SSE for Real-Time synchronization
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isSubscribed = true;

    try {
      eventSource = new EventSource(`/api/sync/${roomId}/stream`);

      eventSource.onopen = () => {
        if (isSubscribed) setSyncStatus('connected');
      };

      eventSource.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data: SyncState = JSON.parse(event.data);
          if (data && data.lastUpdated) {
            isIncomingSync.current = true;
            if (Array.isArray(data.conversations) && data.conversations.length > 0) {
              setConversations(data.conversations);
            }
            if (Array.isArray(data.codexSnippets) && data.codexSnippets.length > 0) {
              setSnippets(data.codexSnippets);
            }
            setLastSyncTime(data.lastUpdated);
            setSyncStatus('connected');
            setTimeout(() => {
              isIncomingSync.current = false;
            }, 100);
          }
        } catch (e) {
          console.error('Failed to parse sync stream event:', e);
        }
      };

      eventSource.onerror = () => {
        if (isSubscribed) setSyncStatus('offline');
      };
    } catch (err) {
      setSyncStatus('offline');
    }

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [roomId]);

  // Switch or join a new room
  const changeRoom = (newRoom: string) => {
    const clean = newRoom.trim().toUpperCase();
    if (!clean || clean === roomId) return;
    setRoomId(clean);
    localStorage.setItem(STORAGE_KEY_ROOM, clean);
    setSettings((prev) => ({ ...prev, syncRoomId: clean }));
    // Update URL query without full reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', clean);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Helper actions
  const updateConversations = (updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations((prev) => {
      const next = updater(prev);
      broadcastSync(next, snippets, settings.defaultModel);
      return next;
    });
  };

  const updateSnippets = (updater: (prev: CodexSnippet[]) => CodexSnippet[]) => {
    setSnippets((prev) => {
      const next = updater(prev);
      broadcastSync(conversations, next, settings.defaultModel);
      return next;
    });
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return {
    roomId,
    changeRoom,
    syncStatus,
    lastSyncTime,
    devicePlatform,
    settings,
    updateSettings,
    conversations,
    updateConversations,
    activeConversationId,
    setActiveConversationId,
    snippets,
    updateSnippets,
    activeSnippetId,
    setActiveSnippetId,
  };
}
