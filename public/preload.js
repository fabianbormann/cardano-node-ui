const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openDialog: () => {
    return ipcRenderer.sendSync('open-dialog');
  },
  addEventListener: (channel, callback) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  getDefaultDirectory: () => ipcRenderer.invoke('getDefaultPath'),
  startNode: (directory, network) =>
    ipcRenderer.send('start-node', directory, network),
});
