/// <reference types="vite/client" />

interface Window {
  electron?: {
    openExternal: (url: string) => void;
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, func: (...args: any[]) => void) => () => void;
      removeListener: (channel: string, func: (...args: any[]) => void) => void;
    };
  };
}
