const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  closeApp: () => {
    return ipcRenderer.sendSync('close-app');
  },
  getSocketPath: (directory, network) => {
    return ipcRenderer.sendSync('get-socket-path', directory, network);
  },
  openUrlInBrowser: (url) => {
    ipcRenderer.send('open-external-url', url);
  },
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
  stopNode: () => ipcRenderer.send('stop-node'),
});
