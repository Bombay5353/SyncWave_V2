const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: 'SyncWave AI Studio - NVIDIA NIM Chat & Codex',
    icon: path.join(__dirname, '../public/icon.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const appUrl = process.env.APP_URL || 'https://ais-pre-n3laelskoh6pbbuixx6l37-683064120718.asia-northeast1.run.app';
  win.loadURL(appUrl);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
