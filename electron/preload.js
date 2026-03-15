const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  selectPhotos: () => ipcRenderer.invoke('select-photos'),
  getPhotoPath: (filename) => ipcRenderer.invoke('get-photo-path', filename),
  deletePhoto: (filename) => ipcRenderer.invoke('delete-photo', filename),
  isElectron: true
});
