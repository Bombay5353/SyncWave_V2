const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Register custom scheme 'app' as standard & secure BEFORE app is ready.
// This gives app:// the same privileges as https://, eliminating all file:// CORS & ES module loading restrictions.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function createWindow() {
  const appRoot = app.getAppPath();
  const iconPath = path.join(appRoot, 'public/icon.svg');

  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: 'SyncWave AI Studio - NVIDIA NIM Chat & Codex',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows local desktop app to call NVIDIA NIM API directly
      allowRunningInsecureContent: true,
    },
  });

  // Handle load failures gracefully
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Window failed to load:', errorCode, errorDescription, validatedURL);
    // If app:// failed, attempt direct loadFile fallback
    if (validatedURL && validatedURL.startsWith('app://')) {
      const fallbackIndex = path.join(app.getAppPath(), 'dist/index.html');
      if (fs.existsSync(fallbackIndex)) {
        win.loadFile(fallbackIndex);
      }
    }
  });

  if (process.env.APP_URL) {
    win.loadURL(process.env.APP_URL);
  } else {
    // Load via the standard 'app://' protocol to ensure ES modules and relative assets work flawlessly
    win.loadURL('app://localhost/index.html');
  }

  // Debugging aid: Press F12 to inspect developer tools
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  // Handle 'app://' protocol requests to serve built files directly from app package dist/
  protocol.handle('app', (request) => {
    try {
      const reqUrl = new URL(request.url);
      let decodedPath = decodeURIComponent(reqUrl.pathname);

      if (!decodedPath || decodedPath === '/' || decodedPath === '') {
        decodedPath = '/index.html';
      }
      if (decodedPath.startsWith('/')) {
        decodedPath = decodedPath.slice(1);
      }

      const appPath = app.getAppPath();
      let targetFile = path.join(appPath, 'dist', decodedPath);

      if (!fs.existsSync(targetFile)) {
        // Check in public/
        const publicFile = path.join(appPath, 'public', decodedPath);
        if (fs.existsSync(publicFile)) {
          targetFile = publicFile;
        } else {
          // SPA fallback to index.html
          targetFile = path.join(appPath, 'dist', 'index.html');
        }
      }

      return net.fetch(url.pathToFileURL(targetFile).toString());
    } catch (err) {
      console.error('Protocol handler error:', err);
      const fallbackFile = path.join(app.getAppPath(), 'dist', 'index.html');
      return net.fetch(url.pathToFileURL(fallbackFile).toString());
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
