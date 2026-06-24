const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('isleAPI', {
  onCoordinatesUpdate:   (cb) => ipcRenderer.on('coordinates-update',    (_e, v) => cb(v)),
  onClickThroughChanged: (cb) => ipcRenderer.on('click-through-changed', (_e, v) => cb(v)),
  steamLogin:            ()   => ipcRenderer.invoke('open-steam-login'),
  onAuthSuccess:         (cb) => ipcRenderer.on('auth-success',          (_e, v) => cb(v))
});
