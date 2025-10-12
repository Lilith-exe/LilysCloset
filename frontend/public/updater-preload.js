const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("upd", {
  onState: (cb) => ipcRenderer.on("upd:state", (_e, d) => cb(d)),
  onProgress: (cb) => ipcRenderer.on("upd:progress", (_e, d) => cb(d)),
  installNow: () => ipcRenderer.invoke("upd:installNow"),
});
