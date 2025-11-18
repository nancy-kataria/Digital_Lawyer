/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    ipcRenderer: {
      send: (channel, data) => {
        let validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
        }
      },
      receive: (channel, func) => {
        let validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      },
      invoke: (channel, data) => {
        let validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, data);
        }
      },
    },
  }
);
