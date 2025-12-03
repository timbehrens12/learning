"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
let mainWindow = null;
let overlayWindow = null;
function createMainWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 600,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    roundedCorners: true,
    // Rounded corners (Windows 11+)
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function createOverlayWindow() {
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  const overlayWidth = 500;
  const overlayHeight = 600;
  overlayWindow = new electron.BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    minWidth: 300,
    minHeight: 400,
    // Remove maxWidth/maxHeight to allow resizing beyond screen
    x: width - overlayWidth - 20,
    y: height - overlayHeight - 20,
    show: false,
    frame: false,
    // No title bar (we made our own)
    transparent: true,
    // See-through background
    backgroundColor: "#00000000",
    // Fully transparent background
    alwaysOnTop: true,
    // Floats above everything
    skipTaskbar: true,
    // Doesn't show in taskbar
    hasShadow: false,
    // We control shadow in CSS
    resizable: true,
    // Enable resizing
    movable: true,
    // Enable moving (can drag off-screen)
    roundedCorners: true,
    // Rounded corners (Windows 11+)
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  overlayWindow.setMovable(true);
  overlayWindow.setResizable(true);
  const overlayUrl = utils.is.dev && process.env["ELECTRON_RENDERER_URL"] ? `${process.env["ELECTRON_RENDERER_URL"]}/#/overlay` : `file://${path.join(__dirname, "../renderer/index.html")}#/overlay`;
  overlayWindow.loadURL(overlayUrl);
  overlayWindow.on("close", (e) => {
    e.preventDefault();
    overlayWindow?.hide();
  });
}
function toggleOverlay() {
  if (overlayWindow?.isVisible()) {
    overlayWindow.hide();
    mainWindow?.show();
    mainWindow?.focus();
  } else {
    overlayWindow?.show();
    overlayWindow?.focus();
    mainWindow?.hide();
  }
}
const PROTOCOL_NAME = "visnly";
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.studylayer.app");
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      electron.app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [process.argv[1]]);
    }
  } else {
    electron.app.setAsDefaultProtocolClient(PROTOCOL_NAME);
  }
  electron.app.on("open-url", (event, url2) => {
    event.preventDefault();
    handleOAuthCallback(url2);
  });
  if (process.platform !== "darwin") {
    electron.app.on("second-instance", (_, commandLine) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
      const url2 = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
      if (url2) {
        handleOAuthCallback(url2);
      }
    });
  }
  const url = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
  if (url) {
    handleOAuthCallback(url);
  }
  function handleOAuthCallback(url2) {
    const urlObj = new URL(url2);
    const hash = urlObj.hash.substring(1);
    if (mainWindow) {
      mainWindow.webContents.send("oauth-callback", hash);
    }
  }
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
    window.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === "media") {
        callback(true);
      } else {
        callback(false);
      }
    });
    window.webContents.session.setPermissionCheckHandler((_webContents, permission, _requestingOrigin) => {
      if (permission === "media") {
        return true;
      }
      return false;
    });
  });
  electron.ipcMain.on("set-detectable", (_, isDetectable) => {
    if (overlayWindow) {
      overlayWindow.setContentProtection(!isDetectable);
    }
    if (mainWindow) {
      mainWindow.setContentProtection(!isDetectable);
    }
  });
  electron.ipcMain.on("open-overlay", () => {
    if (!overlayWindow?.isVisible()) {
      toggleOverlay();
    }
  });
  electron.ipcMain.on("close-overlay", () => {
    if (overlayWindow?.isVisible()) {
      toggleOverlay();
    }
  });
  electron.ipcMain.on("enable-window-drag", () => {
    if (overlayWindow) {
      overlayWindow.setIgnoreMouseEvents(false);
    }
  });
  electron.ipcMain.handle("get-screen-source", async () => {
    const { desktopCapturer } = require("electron");
    const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 0, height: 0 } });
    return sources[0];
  });
  electron.ipcMain.on("move-overlay-window", (_event, { direction, distance }) => {
    if (!overlayWindow) return;
    const [x, y] = overlayWindow.getPosition();
    let newX = x;
    let newY = y;
    switch (direction) {
      case "left":
        newX = x - distance;
        break;
      case "right":
        newX = x + distance;
        break;
      case "up":
        newY = y - distance;
        break;
      case "down":
        newY = y + distance;
        break;
    }
    overlayWindow.setPosition(newX, newY);
  });
  createMainWindow();
  createOverlayWindow();
  electron.globalShortcut.register("CommandOrControl+Shift+Space", () => {
    toggleOverlay();
  });
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
