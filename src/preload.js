const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  blockDomains: () => ipcRenderer.invoke('block-domains'),
  restoreHosts: () => ipcRenderer.invoke('restore-hosts')
});
