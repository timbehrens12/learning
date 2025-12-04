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
  mainWindow.webContents.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
  if (utils.is.dev) {
    mainWindow.show();
  }
  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith("visnly://")) {
      handleOAuthCallback(details.url);
      return { action: "deny" };
    }
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    console.log("🔗 Will navigate to:", navigationUrl);
    let isVisnlyDomain = false;
    try {
      const url = new URL(navigationUrl);
      const hostname = url.hostname.toLowerCase();
      isVisnlyDomain = hostname === "visnly.com" || hostname === "www.visnly.com";
    } catch (e) {
      isVisnlyDomain = navigationUrl.includes("visnly.com") || navigationUrl.includes("www.visnly.com");
    }
    if (isVisnlyDomain) {
      if (navigationUrl.includes("/auth/callback")) {
        console.log("🔐 INTERCEPTING OAuth callback");
        event.preventDefault();
        let callbackUrl = null;
        try {
          const url = new URL(navigationUrl);
          const code = url.searchParams.get("code");
          if (code) {
            console.log("✅ Extracted code (PKCE):", code.substring(0, 20) + "...");
            callbackUrl = `visnly://auth/callback?code=${code}`;
          } else {
            const hashMatch = navigationUrl.match(/#(.+)$/);
            if (hashMatch) {
              const hash = hashMatch[1];
              console.log("✅ Extracted hash fragment (implicit flow)");
              callbackUrl = `visnly://auth/callback#${hash}`;
            } else {
              console.warn("⚠️ No code or hash found in callback URL");
            }
          }
        } catch (e) {
          console.error("❌ Error parsing callback URL:", e);
        }
        if (callbackUrl) {
          console.log("📤 Sending OAuth callback to renderer:", callbackUrl.substring(0, 80) + "...");
          handleOAuthCallback(callbackUrl);
          const sessionConfirmed = new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log("⏱️ Timeout waiting for session confirmation, reloading anyway");
              resolve();
            }, 3e3);
            electron.ipcMain.once("oauth-session-set", () => {
              clearTimeout(timeout);
              console.log("✅ Session confirmed by renderer, reloading now");
              resolve();
            });
          });
          sessionConfirmed.then(() => {
            console.log("🔄 Reloading app after OAuth intercept");
            if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
              mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
            } else {
              mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
            }
          });
        } else {
          setTimeout(() => {
            console.log("🔄 Reloading app (no callback URL extracted)");
            if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
              mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
            } else {
              mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
            }
          }, 50);
        }
      } else {
        console.log("🚫 BLOCKING navigation to website:", navigationUrl);
        event.preventDefault();
        setTimeout(() => {
          if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
            mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
          } else {
            mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
          }
        }, 50);
      }
      return;
    }
    if (navigationUrl.startsWith("visnly://")) {
      event.preventDefault();
      handleOAuthCallback(navigationUrl);
      setTimeout(() => {
        if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
          mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
        } else {
          mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
        }
      }, 50);
      return;
    }
  });
  mainWindow.webContents.on("did-finish-load", () => {
    const currentUrl = mainWindow.webContents.getURL();
    let isVisnlyDomain = false;
    try {
      const url = new URL(currentUrl);
      const hostname = url.hostname.toLowerCase();
      isVisnlyDomain = hostname === "visnly.com" || hostname === "www.visnly.com";
    } catch (e) {
      isVisnlyDomain = false;
    }
    if (isVisnlyDomain && !currentUrl.includes("localhost") && !currentUrl.includes("127.0.0.1")) {
      console.log("🚫 Website loaded in app window - extracting tokens and reloading app:", currentUrl);
      mainWindow.webContents.executeJavaScript(`
        (function() {
          const hash = window.location.hash;
          if (hash && (hash.includes('access_token') || hash.includes('code='))) {
            return hash.substring(1); // Remove the #
          }
          return null;
        })();
      `).then((hashFragment) => {
        if (hashFragment) {
          console.log("✅ Extracted hash fragment from loaded page");
          const callbackUrl = `visnly://auth/callback#${hashFragment}`;
          const encodedCallback = encodeURIComponent(callbackUrl);
          console.log("💾 OAuth callback extracted, reloading app with callback parameter");
          if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
            mainWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}?oauth_callback=${encodedCallback}`);
          } else {
            mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"), {
              query: { oauth_callback: encodedCallback }
            });
          }
        } else {
          setTimeout(() => {
            if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
              mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
            } else {
              mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
            }
          }, 100);
        }
      }).catch((e) => {
        console.error("Error extracting hash:", e);
        if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
          mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
        } else {
          mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
        }
      });
    }
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    console.log("Loading dev URL:", process.env["ELECTRON_RENDERER_URL"]);
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    console.log("Loading production file:", path.join(__dirname, "../renderer/index.html"));
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  if (utils.is.dev) {
    mainWindow.webContents.openDevTools();
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
    handleOAuthCallback2(url2);
  });
  if (process.platform !== "darwin") {
    electron.app.on("second-instance", (_, commandLine) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
      const url2 = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
      if (url2) {
        handleOAuthCallback2(url2);
      }
    });
  }
  const url = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
  if (url) {
    handleOAuthCallback2(url);
  }
  function handleOAuthCallback2(url2) {
    console.log("Main process received OAuth callback:", url2);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
    if (mainWindow) {
      mainWindow.webContents.send("oauth-callback", url2);
    } else {
      electron.app.once("browser-window-created", () => {
        if (mainWindow) {
          mainWindow.webContents.send("oauth-callback", url2);
        }
      });
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
  electron.ipcMain.on("load-oauth-url", (_event, url2) => {
    if (mainWindow) {
      console.log("🔐 Loading OAuth URL in app window (stays in app):", url2);
      mainWindow.loadURL(url2);
    }
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
