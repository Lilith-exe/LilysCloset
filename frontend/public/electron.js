const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_ID = "com.Layla.lilyscloset"; // MUST match build.appId
app.setAppUserModelId(APP_ID);

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
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:3000");
  } else {
    const indexPath = path.join(__dirname, "..", "build", "index.html");
    log(`indexPath=${indexPath} exists=${fs.existsSync(indexPath)}`);
    win.loadFile(indexPath);
  }
}

app.whenReady().then(createWindow);