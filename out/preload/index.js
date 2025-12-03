"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  openExternal: (url) => electron.shell.openExternal(url),
  // Expose IPC renderer for communication with main process
  ipcRenderer: {
    send: (channel, ...args) => electron.ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args),
    on: (channel, func) => {
      const subscription = (_event, ...args) => func(...args);
      electron.ipcRenderer.on(channel, subscription);
      return () => electron.ipcRenderer.removeListener(channel, subscription);
    },
    removeListener: (channel, func) => {
      electron.ipcRenderer.removeListener(channel, func);
    }
  }
});
