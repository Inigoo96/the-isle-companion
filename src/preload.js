const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('isleAPI', {
  onCoordinatesUpdate: (callback) => ipcRenderer.on('coordinates-update', (_e, coords) => callback(coords)),
  onClickThroughChanged: (callback) => ipcRenderer.on('click-through-changed', (_e, state) => callback(state))
});
