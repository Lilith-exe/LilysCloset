// public/electron.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

const APP_ID = "com.Layla.lilyscloset"; // MUST match build.appId
app.setAppUserModelId(APP_ID);

let updaterWin = null;

function createUpdaterWindow() {
  if (updaterWin && !updaterWin.isDestroyed()) return updaterWin;
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
    show: false, // wait for ready-to-show to avoid white flash
    webPreferences: {
      preload: path.join(__dirname, "updater-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  updaterWin.removeMenu?.();
  updaterWin.once("ready-to-show", () => updaterWin?.show());
  updaterWin.loadFile(path.join(__dirname, "updater.html")).catch(e => log(`updater loadFile error: ${e}`));
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
  // --- helpful logging to your existing file ---
  try {
    const logPath = path.join(app.getPath("userData"), "lilys.log");
    autoUpdater.logger = {
      info: (m) => fs.appendFileSync(logPath, `[AU][info] ${m}\n`),
      warn: (m) => fs.appendFileSync(logPath, `[AU][warn] ${m}\n`),
      error: (m) => fs.appendFileSync(logPath, `[AU][error] ${m}\n`),
      debug: () => {}
    };
  } catch {}

  // --- settings ---
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false; // ⬅️ critical change (we'll install ourselves)
  // If you publish prereleases (1.2.3-beta), uncomment:
  // autoUpdater.allowPrerelease = true;

  let installing = false; // guard against double installs

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
    // ensure window exists before sending
    if (updaterWin) {
      updaterWin.webContents.send("upd:state", { s: "none" });
      setTimeout(() => { if (!updaterWin?.isDestroyed()) updaterWin.hide(); }, 1200);
    }
  });

  autoUpdater.on("download-progress", (p) => {
    if (!updaterWin || updaterWin.isDestroyed()) createUpdaterWindow();
    updaterWin?.webContents.send("upd:progress", {
      percent: Math.round(p.percent || 0),
      transferred: p.transferred,
      total: p.total,
      bytesPerSecond: p.bytesPerSecond,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    createUpdaterWindow();
    updaterWin?.webContents.send("upd:state", { s: "ready", v: info?.version });
    // auto-restart after brief paint, unless you want to force a button click
    if (!installing) {
      installing = true;
      setTimeout(() => {
        try {
          autoUpdater.quitAndInstall(true, true); // silent & relaunch
        } catch (e) {
          installing = false;
          log(`quitAndInstall error: ${String(e)}`);
          updaterWin?.webContents.send("upd:state", { s: "error", m: String(e) });
        }
      }, 500);
    }
  });

  autoUpdater.on("error", (err) => {
    createUpdaterWindow();
    updaterWin?.webContents.send("upd:state", { s: "error", m: String(err) });
    log(`updater error: ${String(err)}`);
  });

  // Optional: keep the manual button, but it's now just a second path
  ipcMain.handle("upd:installNow", () => {
    if (!installing) {
      installing = true;
      autoUpdater.quitAndInstall(true, true);
    }
  });

  // kick it off (after main window appears is fine)
  setTimeout(() => autoUpdater.checkForUpdates().catch(e => log(`checkForUpdates failed: ${e}`)), 1000);
}


app.whenReady().then(createWindow);
