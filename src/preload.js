const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  blockDomains: () => ipcRenderer.invoke('block-domains'),
  restoreHosts: () => ipcRenderer.invoke('restore-hosts'),
  getBlacklist: () => ipcRenderer.invoke('get-blacklist'),
  addDomain: (domain) => ipcRenderer.invoke('add-domain', domain),
  removeDomain: (domain) => ipcRenderer.invoke('remove-domain', domain),
  getLogs: () => ipcRenderer.invoke('get-logs')
});
