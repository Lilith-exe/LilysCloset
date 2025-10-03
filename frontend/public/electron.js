// public/electron.js
const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: "Lily's Closet",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL("http://localhost:3000");
    // Only open dev tools in development
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../build/index.html"));
    // Dev tools removed from production
  }

  if (!isDev) {
    setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 3000);
  }
}

app.whenReady().then(createWindow);
