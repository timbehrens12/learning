/// <reference types="vite/client" />

interface Window {
  electron: {
    openExternal: (url: string) => Promise<void>
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
      on: (channel: string, func: (...args: any[]) => void) => () => void
      removeListener: (channel: string, func: (...args: any[]) => void) => void
    }
  }
  api: {
    runAI: (mode: string, image: string, prompt: string, content?: string) => Promise<any>
  }
}


