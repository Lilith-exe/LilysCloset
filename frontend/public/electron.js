// public/electron.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

const APP_ID = "com.Layla.lilyscloset"; // MUST match build.appId
app.setAppUserModelId(APP_ID);

let updaterWin = null;

function createUpdaterWindow() {
  if (updaterWin) return updaterWin;
  updaterWin = new BrowserWindow({
    width: 420,
    height: 160,
    title: "Updating Lily's Closet…",
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    modal: false,
    webPreferences: {
      preload: path.join(__dirname, "updater-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  updaterWin.removeMenu?.();
  updaterWin.loadFile(path.join(__dirname, "updater.html"));
  updaterWin.on("closed", () => (updaterWin = null));
  return updaterWin;
}

function log(line) {
  try {
    const f = path.join(app.getPath("userData"), "lilys.log");
    fs.appendFileSync(f, `[${new Date().toISOString()}] ${line}\n`);
  } catch {}
}

function res(p) {
  return app.isPackaged ? path.join(process.resourcesPath, p) : path.join(process.cwd(), p);
}

function createWindow() {
  const iconPath = res(path.join("electron-resources", "icon.ico"));
  log(`APP_ID=${APP_ID}`);
  log(`iconPath=${iconPath} exists=${fs.existsSync(iconPath)}`);

  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: "Lily's Closet",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:3000");
  } else {
    const indexPath = path.join(__dirname, "..", "build", "index.html");
    log(`indexPath=${indexPath} exists=${fs.existsSync(indexPath)}`);
    win.loadFile(indexPath);

    // ✅ start updater only in packaged builds
    startUpdater();
  }
}

function startUpdater() {
  // settings
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // show the small window as soon as we know there's something to do
  autoUpdater.on("checking-for-update", () => {
    createUpdaterWindow();
    updaterWin?.webContents.send("upd:state", { s: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    createUpdaterWindow();
    updaterWin?.webContents.send("upd:state", { s: "available", v: info?.version });
  });

  autoUpdater.on("update-not-available", () => {
    updaterWin?.webContents.send("upd:state", { s: "none" });
    setTimeout(() => updaterWin?.hide(), 1200);
  });

  autoUpdater.on("download-progress", (p) => {
    updaterWin?.webContents.send("upd:progress", {
      percent: Math.round(p.percent || 0),
      transferred: p.transferred,
      total: p.total,
      bytesPerSecond: p.bytesPerSecond,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    updaterWin?.webContents.send("upd:state", { s: "ready", v: info?.version });
  });

  autoUpdater.on("error", (err) => {
    createUpdaterWindow();
    updaterWin?.webContents.send("upd:state", { s: "error", m: String(err) });
    log(`updater error: ${String(err)}`);
  });

  // button in updater.html
  ipcMain.handle("upd:installNow", () => {
    autoUpdater.quitAndInstall();
  });

  // kick it off
  // small delay gives the main window time to finish loading
  setTimeout(() => autoUpdater.checkForUpdates(), 1000);
}

app.whenReady().then(createWindow);
