import { app, shell, BrowserWindow, globalShortcut, screen, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 600,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    roundedCorners: true, // Rounded corners (Windows 11+)
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the standard Dashboard URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createOverlayWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const overlayWidth = 500
  const overlayHeight = 600

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    minWidth: 300,
    minHeight: 400,
    // Remove maxWidth/maxHeight to allow resizing beyond screen
    x: width - overlayWidth - 20,
    y: height - overlayHeight - 20,
    show: false,
    frame: false, // No title bar (we made our own)
    transparent: true, // See-through background
    backgroundColor: '#00000000', // Fully transparent background
    alwaysOnTop: true, // Floats above everything
    skipTaskbar: true, // Doesn't show in taskbar
    hasShadow: false, // We control shadow in CSS
    resizable: true, // Enable resizing
    movable: true, // Enable moving (can drag off-screen)
    roundedCorners: true, // Rounded corners (Windows 11+)
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  // Enable window to be moved off-screen
  overlayWindow.setMovable(true)
  overlayWindow.setResizable(true)

  // Load the Overlay URL (Note the hash /#/overlay)
  const overlayUrl = is.dev && process.env['ELECTRON_RENDERER_URL']
    ? `${process.env['ELECTRON_RENDERER_URL']}/#/overlay`
    : `file://${join(__dirname, '../renderer/index.html')}#/overlay`

  overlayWindow.loadURL(overlayUrl)
  
  // Prevent closing, just hide instead
  overlayWindow.on('close', (e) => {
    e.preventDefault()
    overlayWindow?.hide()
  })
}

// Modified Toggle Logic
function toggleOverlay() {
  if (overlayWindow?.isVisible()) {
    overlayWindow.hide()
    // Show the dashboard when overlay closes
    mainWindow?.show()
    mainWindow?.focus()
  } else {
    overlayWindow?.show()
    overlayWindow?.focus()
    // Hides the dashboard to "close it out"
    mainWindow?.hide() 
  }
}

// Register custom protocol for OAuth callback
const PROTOCOL_NAME = 'visnly'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.studylayer.app')

  // Register custom protocol handler for OAuth callbacks
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [process.argv[1]])
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME)
  }

  // Handle protocol URLs (OAuth callbacks)
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleOAuthCallback(url)
  })

  // Handle protocol URLs on Windows/Linux
  if (process.platform !== 'darwin') {
    app.on('second-instance', (_, commandLine) => {
      // Someone tried to run a second instance, focus our window instead
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
      
      // Check for protocol URL in command line
      const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`))
      if (url) {
        handleOAuthCallback(url)
      }
    })
  }

  // Handle protocol URLs passed as command line argument
  const url = process.argv.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`))
  if (url) {
    handleOAuthCallback(url)
  }

  function handleOAuthCallback(url: string) {
    // Extract the URL hash/fragment which contains the OAuth tokens
    const urlObj = new URL(url)
    const hash = urlObj.hash.substring(1) // Remove the #
    
    // Send the callback URL to the renderer process
    if (mainWindow) {
      mainWindow.webContents.send('oauth-callback', hash)
    }
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
    
    // Handle permission requests (microphone, camera, etc.)
    window.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      // Automatically allow microphone permissions
      if (permission === 'media') {
        callback(true) // Allow
      } else {
        callback(false) // Deny other permissions
      }
    })

    // Handle permission check results
    window.webContents.session.setPermissionCheckHandler((_webContents, permission, _requestingOrigin) => {
      // Allow microphone access
      if (permission === 'media') {
        return true
      }
      return false
    })
  })

  // HANDLE STEALTH MODE
  // isDetectable = true  -> Protection OFF (Zoom can see it)
  // isDetectable = false -> Protection ON  (Zoom sees nothing)
  ipcMain.on('set-detectable', (_, isDetectable: boolean) => {
    if (overlayWindow) {
      // setContentProtection(true) HIDEs it from capture
      // setContentProtection(false) SHOWS it to capture
      overlayWindow.setContentProtection(!isDetectable)
    }

    // Optional: Hide dashboard from capture too
    if (mainWindow) {
      mainWindow.setContentProtection(!isDetectable)
    }
  })

  // Listen for the "Start Session" button click from React
  ipcMain.on('open-overlay', () => {
    if (!overlayWindow?.isVisible()) {
      toggleOverlay()
    }
  })

  // Listen for overlay close button click from React
  ipcMain.on('close-overlay', () => {
    if (overlayWindow?.isVisible()) {
      toggleOverlay()
    }
  })

  // Enable window dragging mode
  ipcMain.on('enable-window-drag', () => {
    if (overlayWindow) {
      overlayWindow.setIgnoreMouseEvents(false)
    }
  })

  // NEW: Handle screen source request
  ipcMain.handle('get-screen-source', async () => {
    const { desktopCapturer } = require('electron')
    // Get all screens
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } })
    // Return the first screen (Primary Display)
    return sources[0]
  })

  // Handle overlay window movement (allows off-screen movement)
  ipcMain.on('move-overlay-window', (_event, { direction, distance }: { direction: 'left' | 'right' | 'up' | 'down', distance: number }) => {
    if (!overlayWindow) return
    
    const [x, y] = overlayWindow.getPosition()
    
    let newX = x
    let newY = y
    
    // Allow movement off-screen (no bounds checking)
    switch (direction) {
      case 'left':
        newX = x - distance
        break
      case 'right':
        newX = x + distance
        break
      case 'up':
        newY = y - distance
        break
      case 'down':
        newY = y + distance
        break
    }
    
    overlayWindow.setPosition(newX, newY)
  })

  // 1. Create Dashboard
  createMainWindow()
  
  // 2. Create Overlay (Hidden)
  createOverlayWindow()

  // 3. Register Hotkey
  // 'CommandOrControl+Shift+Space' works on both Mac and Windows
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleOverlay()
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Unregister hotkeys when quitting
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
